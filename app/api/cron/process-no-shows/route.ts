import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyLowCredits } from '@/lib/whatsapp';
import logger from '@/lib/logger';

/**
 * CRON JOB: Processa alunos que confirmaram presença mas não compareceram (No-Show)
 * Recomendado: Rodar a cada 1h ou ao final do dia.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction && !cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET não configurado em produção' }, { status: 500 })
    }
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Buscar todas as presenças 'confirmed' de datas passadas ou hoje (se a sessão já terminou)
    // Para simplificar, pegaremos tudo que ficou como 'confirmed' de ontem para trás
    const { data: noShows, error: fetchError } = await supabaseAdmin
      .from('attendance')
      .select('*, class:classes(name, studio_id)')
      .eq('status', 'confirmed')
      .lt('date', today);

    if (fetchError) throw fetchError;

    const results = [];

    for (const record of noShows) {
      // 2. Verificar se o aluno tem créditos
      const { data: credits } = await supabaseAdmin
        .from('student_lesson_credits')
        .select('*')
        .eq('student_id', record.student_id)
        .maybeSingle();

      if (credits && credits.remaining_credits > 0) {
        // 3. Debitar crédito por No-Show
        const newRemaining = credits.remaining_credits - 1;
        await supabaseAdmin
          .from('student_lesson_credits')
          .update({ 
            remaining_credits: newRemaining,
            updated_at: new Date().toISOString()
          })
          .eq('id', credits.id);

        // 4. Registrar uso
        await supabaseAdmin.from('student_credit_usage').insert({
          studio_id: record.class.studio_id,
          student_id: record.student_id,
          class_id: record.class_id,
          session_id: record.session_id,
          credits_used: 1,
          usage_type: 'class_attendance',
          notes: `Débito automático: No-Show em ${record.class.name} (${record.date})`
        });

        // 4b. Registrar cobrança no financeiro (uso de crédito - No-Show)
        const today = new Date().toISOString().split('T')[0];
        const refMonth = new Date().toISOString().slice(0, 7);
        await supabaseAdmin.from('payments').insert({
          studio_id: record.class.studio_id,
          student_id: record.student_id,
          amount: 0,
          due_date: today,
          payment_date: today,
          status: 'paid',
          payment_method: 'credit',
          reference_month: refMonth,
          description: `Aula: ${record.class.name} (No-Show)`,
          payment_source: 'credit_usage',
          reference_id: record.class_id,
          credits_used: 1,
        });

        // 5. Atualizar status para 'absent' (Falta)
        await supabaseAdmin
          .from('attendance')
          .update({ status: 'absent', notes: 'No-Show (Débito automático)' })
          .eq('id', record.id);

        // 6. Notificar se créditos baixos
        if (newRemaining <= 2) {
          notifyLowCredits(record.student_id, record.class.studio_id, newRemaining).catch(() => {});
        }

        results.push({ id: record.id, student_id: record.student_id, status: 'processed' });
      } else {
        // Se não tem crédito, apenas marca como falta sem debitar (ou gera pendência)
        await supabaseAdmin
          .from('attendance')
          .update({ status: 'absent', notes: 'No-Show (Sem créditos para debitar)' })
          .eq('id', record.id);
        
        results.push({ id: record.id, student_id: record.student_id, status: 'no_credits' });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      details: results
    });

  } catch (error: any) {
    logger.error('❌ Erro no processamento de No-Shows:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
