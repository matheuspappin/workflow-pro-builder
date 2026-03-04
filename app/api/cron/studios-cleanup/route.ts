import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger';
import { logAdmin } from '@/lib/admin-logs';

/**
 * CRON JOB: Limpeza e Gerenciamento de Ciclo de Vida dos Estúdios
 * 
 * 1. Desativa estúdios com trial vencido e sem assinatura ativa.
 * 2. Exclui permanentemente estúdios que estão desativados há mais de 15 dias.
 * 
 * Este endpoint deve ser chamado por um serviço de CRON externo (ex: GitHub Actions, Vercel Cron).
 * Requer CRON_SECRET no header Authorization: Bearer <CRON_SECRET>
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

    const now = new Date().toISOString()
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()

    logger.info(`[CRON] Iniciando limpeza de estúdios: ${now}`)

    // 1. DESATIVAÇÃO: Estúdios com Trial vencido
    // Regra: trial_ends_at < agora E subscription_status = 'trialing' E status = 'active'
    // NOTA: Usa eq('trialing') em vez de neq('active') para não afetar studios com subscription_status NULL (legados)
    const { data: toDeactivate, error: deactivateError } = await supabaseAdmin
      .from('studios')
      .update({ 
        status: 'inactive',
        updated_at: now 
      })
      .lt('trial_ends_at', now)
      .eq('subscription_status', 'trialing')
      .eq('status', 'active')
      .select('id, name')

    if (deactivateError) {
      logger.error('[CRON] Erro ao desativar estúdios:', deactivateError)
      await logAdmin('error', 'cron/studios-cleanup', `Erro ao desativar estúdios: ${deactivateError.message}`)
    } else if (toDeactivate?.length) {
      logger.info(`[CRON] ${toDeactivate.length} estúdios desativados por fim de trial.`)
      await logAdmin('warning', 'cron/studios-cleanup', `${toDeactivate.length} estúdios desativados por fim de trial`, { metadata: { studios: toDeactivate.map(s => ({ id: s.id, name: s.name })) } })
    }

    // 2. EXCLUSÃO: Estúdios inativos há mais de 15 dias
    // Regra: status é 'inactive' E updated_at < 15 dias atrás E subscription_status não é 'active'
    // Nota: O ON DELETE CASCADE no schema cuidará de limpar todas as tabelas relacionadas.
    const { data: toDelete, error: deleteError } = await supabaseAdmin
      .from('studios')
      .delete()
      .eq('status', 'inactive')
      .lt('updated_at', fifteenDaysAgo)
      .neq('subscription_status', 'active')
      .select('id, name')

    if (deleteError) {
      logger.error('[CRON] Erro ao excluir estúdios:', deleteError)
      await logAdmin('error', 'cron/studios-cleanup', `Erro ao excluir estúdios inativos: ${deleteError.message}`)
    } else if (toDelete?.length) {
      logger.info(`[CRON] ${toDelete.length} estúdios excluídos permanentemente por inatividade prolongada.`)
      await logAdmin('warning', 'cron/studios-cleanup', `${toDelete.length} estúdios excluídos permanentemente (inativos >15 dias)`, { metadata: { studios: toDelete.map(s => ({ id: s.id, name: s.name })) } })
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
