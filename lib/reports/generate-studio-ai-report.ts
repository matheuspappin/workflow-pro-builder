/**
 * Gera relatório de contexto para IA (Catarina)
 * Usa supabaseAdmin para funcionar em cron/sem sessão de usuário
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { translations } from '@/config/translations'

export async function generateStudioAiReport(studioId: string): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    const [
      studentsRes,
      teachersRes,
      classesRes,
      studioRes,
      lessonPackagesRes,
      modalitiesRes,
      settingsRes,
      paymentsRes,
      enrollmentsRes,
    ] = await Promise.all([
      supabaseAdmin.from('students').select('*').eq('studio_id', studioId),
      supabaseAdmin.from('teachers').select('*').eq('studio_id', studioId).eq('status', 'active'),
      supabaseAdmin.from('classes').select('name, dance_style, level, schedule, price, max_students').eq('studio_id', studioId).eq('status', 'active'),
      supabaseAdmin.from('studios').select('name, plan, status').eq('id', studioId).single(),
      supabaseAdmin.from('lesson_packages').select('name, description, lessons_count, price').eq('studio_id', studioId).eq('is_active', true),
      supabaseAdmin.from('modalities').select('name, description').eq('studio_id', studioId),
      supabaseAdmin.from('studio_settings').select('setting_key, setting_value').eq('studio_id', studioId),
      supabaseAdmin.from('payments').select('amount, status, payment_date, due_date').eq('studio_id', studioId),
      supabaseAdmin.from('enrollments').select('*').eq('studio_id', studioId).eq('status', 'active'),
    ])

    const students = studentsRes.data || []
    const teachers = teachersRes.data || []
    const activeClasses = classesRes.data || []
    const studioInfo = studioRes.data
    const lessonPackages = lessonPackagesRes.data || []
    const modalities = modalitiesRes.data || []
    const settings = settingsRes.data || []
    const payments = paymentsRes.data || []

    const studioSettings: Record<string, string> = {}
    settings.forEach((s: any) => { studioSettings[s.setting_key] = s.setting_value })

    const thisMonth = new Date()
    thisMonth.setDate(1)
    const nextMonth = new Date(thisMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const monthlyRevenue = payments
      .filter((p: any) => p.status === 'paid' && p.payment_date && new Date(p.payment_date) >= thisMonth && new Date(p.payment_date) < nextMonth)
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    const overduePayments = payments.filter((p: any) => p.status === 'overdue' || (p.status === 'pending' && new Date(p.due_date) < new Date()))
    const overdueAmount = overduePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    const sStats = {
      total: students.length,
      active: students.filter((s: any) => s.status === 'active').length,
      newThisMonth: students.filter((s: any) => new Date(s.enrollment_date) >= thisMonth).length,
      retentionRate: students.length > 0 ? Math.round((students.filter((s: any) => s.status === 'active').length / students.length) * 100) : 0,
    }

    const cStats = {
      active: activeClasses.length,
      occupancyRate: 0,
    }
    const totalCapacity = activeClasses.reduce((sum: number, c: any) => sum + (c.max_students || 0), 0)
    const totalEnrollments = (enrollmentsRes.data || []).length
    cStats.occupancyRate = totalCapacity > 0 ? Math.round((totalEnrollments / totalCapacity) * 100) : 0

    const fStats = {
      monthlyRevenue,
      overduePayments: overdueAmount,
      debtors: overduePayments.slice(0, 10).map((p: any) => ({ name: 'Cliente', amount: p.amount, dueDate: p.due_date })),
    }

    const formatSchedule = (schedule: any) => {
      if (!Array.isArray(schedule)) return 'Horário a combinar'
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      return schedule.map((s: any) => `${days[s.day_of_week] || 'Dia'} às ${s.start_time} (${s.duration_minutes}min)`).join(', ')
    }

    const reportContent = `
RELATÓRIO MESTRE DE CONTEXTO - ${studioInfo?.name || 'Estúdio'}
Gerado em: ${new Date().toLocaleString('pt-BR')}

--- INFORMAÇÕES DO ESTÚDIO ---
- Nome: ${studioInfo?.name}
- Endereço: ${studioSettings['address'] || 'Não informado'}
- Telefone/WhatsApp: ${studioSettings['phone'] || 'Não informado'}
- Horário de Funcionamento: ${studioSettings['business_hours'] || 'Não informado'}
- Regras de Cancelamento: ${studioSettings['cancellation_policy'] || 'Padrão (24h de antecedência)'}

--- MODALIDADES DISPONÍVEIS ---
${modalities.map((m: any) => `- ${m.name}: ${m.description || 'Sem descrição'}`).join('\n') || 'Nenhuma modalidade cadastrada.'}

--- GRADE DE AULAS E HORÁRIOS ---
${activeClasses.map((c: any) => `- ${c.name} (${c.dance_style}): Nível ${c.level}. 
  Horários: ${formatSchedule(c.schedule)}
  Valor Avulso: R$${c.price}
  Capacidade: ${c.max_students} alunos`).join('\n') || 'Nenhuma turma ativa no momento.'}

--- EQUIPE DE PROFESSORES ---
${teachers.map((t: any) => `- ${t.name}: Especialista em ${(t.specialties || []).join(', ') || 'Dança'}. ${t.bio ? `\n  Bio: ${t.bio}` : ''}`).join('\n') || 'Equipe não listada.'}

--- PLANOS E CRÉDITOS (VALORES) ---
${lessonPackages.map((p: any) => `- Pacote ${p.name}: ${p.lessons_count} aulas por R$ ${p.price}. 
  Descrição: ${p.description || 'Ideal para praticantes regulares.'}`).join('\n') || 'Consulte a recepção para valores de pacotes.'}

--- RESUMO OPERACIONAL (EXCLUSIVO ADMIN) ---
- Total de Alunos: ${sStats.total}
- Alunos Ativos: ${sStats.active}
- Taxa de Ocupação Média: ${cStats.occupancyRate}% (${translations.en.common.avgOccupancy})
- Receita Mensal Realizada: R$ ${monthlyRevenue}
- Pagamentos Atrasados: R$ ${overdueAmount}

--- ALUNOS EM DÉBITO (EXCLUSIVO ADMIN) ---
${fStats.debtors.map((d: any) => `- ${d.name}: R$ ${d.amount} (Vencimento: ${d.dueDate})`).join('\n') || 'Nenhum débito pendente.'}

--- DIRETRIZES DE ATENDIMENTO ---
1. Responda sempre como assistente do estúdio ${studioInfo?.name}.
2. Use os valores de pacotes e horários acima como ÚNICA fonte de verdade.
3. Se um aluno perguntar algo que não está aqui, diga que a secretaria humana entrará em contato para detalhar.
4. Incentive o agendamento de aulas experimentais nas turmas com vagas.
`.trim()

    const { data: report, error: reportError } = await supabaseAdmin
      .from('studio_ai_reports')
      .insert({
        studio_id: studioId,
        content: reportContent,
        metadata: { stats: { students: sStats.total, revenue: monthlyRevenue, classes: cStats.active, packages_count: lessonPackages.length } },
      })
      .select('id')
      .single()

    if (reportError) return { success: false, error: reportError.message }

    await supabaseAdmin.from('studio_ai_reports').delete().eq('studio_id', studioId).neq('id', report.id)
    return { success: true, reportId: report.id }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erro ao gerar relatório' }
  }
}
