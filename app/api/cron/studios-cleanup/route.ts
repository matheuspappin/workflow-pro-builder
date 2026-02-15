import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger';

/**
 * CRON JOB: Limpeza e Gerenciamento de Ciclo de Vida dos Estúdios
 * 
 * 1. Desativa estúdios com trial vencido e sem assinatura ativa.
 * 2. Exclui permanentemente estúdios que estão desativados há mais de 15 dias.
 * 
 * Este endpoint deve ser chamado por um serviço de CRON externo (ex: GitHub Actions, Vercel Cron).
 */
export async function GET() {
  try {
    const now = new Date().toISOString()
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()

    logger.info(`[CRON] Iniciando limpeza de estúdios: ${now}`)

    // 1. DESATIVAÇÃO: Estúdios com Trial vencido
    // Regra: trial_ends_at < agora E subscription_status não é 'active' E status é 'active'
    const { data: toDeactivate, error: deactivateError } = await supabase
      .from('studios')
      .update({ 
        status: 'inactive',
        updated_at: now 
      })
      .lt('trial_ends_at', now)
      .neq('subscription_status', 'active')
      .eq('status', 'active')
      .select('id, name')

    if (deactivateError) {
      logger.error('[CRON] Erro ao desativar estúdios:', deactivateError)
    } else if (toDeactivate?.length) {
      logger.info(`[CRON] ${toDeactivate.length} estúdios desativados por fim de trial.`)
    }

    // 2. EXCLUSÃO: Estúdios inativos há mais de 15 dias
    // Regra: status é 'inactive' E updated_at < 15 dias atrás E subscription_status não é 'active'
    // Nota: O ON DELETE CASCADE no schema cuidará de limpar todas as tabelas relacionadas.
    const { data: toDelete, error: deleteError } = await supabase
      .from('studios')
      .delete()
      .eq('status', 'inactive')
      .lt('updated_at', fifteenDaysAgo)
      .neq('subscription_status', 'active')
      .select('id, name')

    if (deleteError) {
      logger.error('[CRON] Erro ao excluir estúdios:', deleteError)
    } else if (toDelete?.length) {
      logger.info(`[CRON] ${toDelete.length} estúdios excluídos permanentemente por inatividade prolongada.`)
    }

    return NextResponse.json({
      success: true,
      deactivated: toDeactivate?.length || 0,
      deleted: toDelete?.length || 0,
      timestamp: now
    })

  } catch (error: any) {
    logger.error('[CRON] Erro fatal no job de limpeza:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
