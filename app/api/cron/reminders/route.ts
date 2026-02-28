import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import logger from '@/lib/logger';

/**
 * CRON PARA ENVIO DE LEMBRETES DE AULA E CONFIRMAÇÃO
 * Este endpoint deve ser chamado periodicamente (ex: a cada 15 min)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction && !cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET não configurado em produção' }, { status: 500 })
    }
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const now = new Date()
    const dayOfWeek = now.getDay() // 0 (Dom) a 6 (Sáb)
    // Ajustar para o padrão do banco (1-Seg a 7-Dom ou 0-Dom a 6-Sáb?)
    // Vamos assumir 0-Dom a 6-Sáb conforme o JS padrão
    
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const lookaheadMinutes = 60 // Olhar 1 hora a frente

    // 1. Buscar turmas ativas
    const { data: classes } = await supabaseAdmin
      .from('classes')
      .select('*, studio:studios(name)')
      .eq('status', 'active')

    let messagesSent = 0

    for (const classItem of (classes || [])) {
      const schedule = classItem.schedule || []
      
      // Verificar se tem aula hoje no próximo horário
      const todaySchedule = schedule.find((s: any) => s.day_of_week === dayOfWeek)
      
      if (todaySchedule) {
        const [hours, minutes] = todaySchedule.start_time.split(':').map(Number)
        const classStartTime = hours * 60 + minutes
        const diff = classStartTime - currentTime

        // Se a aula começa entre agora e 60 minutos
        if (diff > 0 && diff <= lookaheadMinutes) {
          // Verificar se já enviamos lembrete para hoje para esta turma
          const todayStr = now.toISOString().split('T')[0]
          
          // Buscar ou criar sessão
          let { data: session } = await supabaseAdmin
            .from('sessions')
            .select('*')
            .eq('class_id', classItem.id)
            .eq('scheduled_date', todayStr)
            .maybeSingle()

          if (!session) {
            const { data: newSession } = await supabaseAdmin
              .from('sessions')
              .insert({
                studio_id: classItem.studio_id,
                class_id: classItem.id,
                scheduled_date: todayStr,
                actual_teacher_id: classItem.teacher_id,
                status: 'agendada'
              })
              .select()
              .single()
            session = newSession
          }

          if (session && !session.reminders_sent) {
            // Buscar alunos matriculados
            const { data: enrollments } = await supabaseAdmin
              .from('enrollments')
              .select('student:students(*)')
              .eq('class_id', classItem.id)
              .eq('status', 'active')

            for (const enrollment of (enrollments || [])) {
              const student = Array.isArray((enrollment as any).student) ? (enrollment as any).student[0] : (enrollment as any).student
              if (student && student.phone) {
                const message = `Olá ${student.name.split(' ')[0]}! 💃\n\nSua aula de *${classItem.name}* no *${classItem.studio?.name}* começa às *${todaySchedule.start_time}*.\n\nVocê confirma sua presença?\nResponda *SIM* para confirmar ou *NAO* caso não possa vir.`
                
                await sendWhatsAppMessage({
                  to: student.phone,
                  message,
                  studioId: classItem.studio_id
                })

                // Criar registro de presença pendente se não existir
                await supabaseAdmin
                  .from('attendance')
                  .upsert({
                    studio_id: classItem.studio_id,
                    student_id: student.id,
                    class_id: classItem.id,
                    session_id: session.id,
                    date: todayStr,
                    status: 'pending'
                  }, { onConflict: 'studio_id, student_id, class_id, date' })

                messagesSent++
              }
            }

            // Marcar que lembretes foram enviados
            await supabaseAdmin
              .from('sessions')
              .update({ reminders_sent: true })
              .eq('id', session.id)
          }
        }
      }
    }

    return NextResponse.json({ success: true, messagesSent })
  } catch (error: any) {
    logger.error('💥 Erro no Cron de Lembretes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
