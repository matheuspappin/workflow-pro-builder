import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getStudentsData, getTeachersData, getFinancialData, getClassesData } from '@/lib/supabase';
import logger from '@/lib/logger';
import { translations } from '@/config/translations';

/**
 * Gera um novo relatório de contexto para a IA
 * Consolida dados do estúdio em um formato otimizado para o Gemini/ChatGPT
 */
export async function POST(req: NextRequest) {
  try {
    const { studioId } = await req.json();

    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID ausente' }, { status: 400 });
    }

    // 1. Buscar dados consolidados e tabelas específicas em paralelo
    const [
      sStats, tStats, fStats, cStats, 
      studioInfo, 
      activeClasses, 
      activeTeachers, 
      lessonPackages,
      modalities,
      settings
    ] = await Promise.all([
      getStudentsData(studioId),
      getTeachersData(studioId),
      getFinancialData(studioId),
      getClassesData(studioId),
      supabase.from('studios').select('name, plan, status').eq('id', studioId).single(),
      supabase.from('classes').select('name, dance_style, level, schedule, price, max_students').eq('studio_id', studioId).eq('status', 'active'),
      supabase.from('teachers').select('name, specialties, bio').eq('studio_id', studioId).eq('status', 'active'),
      supabase.from('lesson_packages').select('name, description, lessons_count, price').eq('studio_id', studioId).eq('is_active', true),
      supabase.from('modalities').select('name, description').eq('studio_id', studioId),
      supabase.from('studio_settings').select('setting_key, setting_value').eq('studio_id', studioId)
    ]);

    // Organizar configurações em um objeto para facilitar acesso
    const studioSettings: Record<string, string> = {};
    settings.data?.forEach(s => {
      studioSettings[s.setting_key] = s.setting_value;
    });

    // 4. Montar o conteúdo do relatório (Formatado para IA)
    const formatSchedule = (schedule: any) => {
      if (!Array.isArray(schedule)) return "Horário a combinar";
      const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      return schedule.map(s => `${days[s.day_of_week] || 'Dia'} às ${s.start_time} (${s.duration_minutes}min)`).join(', ');
    };

    const reportContent = `
RELATÓRIO MESTRE DE CONTEXTO - ${studioInfo.data?.name || 'Estúdio'}
Gerado em: ${new Date().toLocaleString('pt-BR')}

--- INFORMAÇÕES DO ESTÚDIO ---
- Nome: ${studioInfo.data?.name}
- Endereço: ${studioSettings['address'] || 'Não informado'}
- Telefone/WhatsApp: ${studioSettings['phone'] || 'Não informado'}
- Horário de Funcionamento: ${studioSettings['business_hours'] || 'Não informado'}
- Regras de Cancelamento: ${studioSettings['cancellation_policy'] || 'Padrão (24h de antecedência)'}

--- MODALIDADES DISPONÍVEIS ---
${modalities.data?.map(m => `- ${m.name}: ${m.description || 'Sem descrição'}`).join('\n') || "Nenhuma modalidade cadastrada."}

--- GRADE DE AULAS E HORÁRIOS ---
${activeClasses.data?.map(c => `- ${c.name} (${c.dance_style}): Nível ${c.level}. 
  Horários: ${formatSchedule(c.schedule)}
  Valor Avulso: R$${c.price}
  Capacidade: ${c.max_students} alunos`).join('\n') || "Nenhuma turma ativa no momento."}

--- EQUIPE DE PROFESSORES ---
${activeTeachers.data?.map(t => `- ${t.name}: Especialista em ${t.specialties?.join(', ') || 'Dança'}. ${t.bio ? `\n  Bio: ${t.bio}` : ''}`).join('\n') || "Equipe não listada."}

--- PLANOS E CRÉDITOS (VALORES) ---
${lessonPackages.data?.map(p => `- Pacote ${p.name}: ${p.lessons_count} aulas por R$ ${p.price}. 
  Descrição: ${p.description || 'Ideal para praticantes regulares.'}`).join('\n') || "Consulte a recepção para valores de pacotes."}

--- RESUMO OPERACIONAL (EXCLUSIVO ADMIN) ---
- Total de Alunos: ${sStats.total}
- Alunos Ativos: ${sStats.active}
- Taxa de Ocupação Média: ${cStats.occupancyRate}% (${translations.en.common.avgOccupancy})
- Receita Mensal Realizada: R$ ${fStats.monthlyRevenue}
- Pagamentos Atrasados: R$ ${fStats.overduePayments}

--- ALUNOS EM DÉBITO (EXCLUSIVO ADMIN) ---
${fStats.debtors.map(d => `- ${d.name}: R$ ${d.amount} (Vencimento: ${d.dueDate})`).join('\n') || "Nenhum débito pendente."}

--- DIRETRIZES DE ATENDIMENTO ---
1. Responda sempre como assistente do estúdio ${studioInfo.data?.name}.
2. Use os valores de pacotes e horários acima como ÚNICA fonte de verdade.
3. Se um aluno perguntar algo que não está aqui, diga que a secretaria humana entrará em contato para detalhar.
4. Incentive o agendamento de aulas experimentais nas turmas com vagas.
`.trim();

    // 5. Salvar no banco de dados (studio_ai_reports)
    const { data: report, error: reportError } = await supabase
      .from('studio_ai_reports')
      .insert({
        studio_id: studioId,
        content: reportContent,
        metadata: {
          stats: {
            students: sStats.total,
            revenue: fStats.monthlyRevenue,
            classes: cStats.active,
            packages_count: lessonPackages.data?.length || 0
          }
        }
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // 6. Deletar relatórios antigos (manter apenas o mais recente)
    try {
      const { error: deleteError } = await supabase
        .from('studio_ai_reports')
        .delete()
        .eq('studio_id', studioId)
        .neq('id', report.id); // Deleta todos exceto o que acabamos de criar

      if (deleteError) logger.warn('⚠️ Erro ao limpar relatórios antigos:', deleteError);
    } catch (e) {
      logger.warn('⚠️ Falha silenciosa ao limpar relatórios antigos:', e);
    }

    logger.info(`📊 Relatório COMPLETO de Contexto IA gerado para estúdio ${studioId} (Antigos removidos)`);
    
    return NextResponse.json({ 
      success: true, 
      reportId: report.id,
      timestamp: report.created_at
    });

  } catch (error: any) {
    logger.error('💥 Erro ao gerar relatório de IA:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
