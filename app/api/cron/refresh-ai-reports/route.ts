import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateStudioAiReport } from '@/lib/reports/generate-studio-ai-report'
import logger from '@/lib/logger'

/**
 * CRON: Atualiza relatórios de contexto da IA (studio_ai_reports) para estúdios ativos
 * Chamado diariamente para manter a Catarina com dados atualizados
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

    const { data: studios, error } = await supabaseAdmin
      .from('studios')
      .select('id, name')
      .eq('status', 'active')
      .limit(50)

    if (error) {
      logger.error('[CRON] refresh-ai-reports: Erro ao buscar estúdios:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const list = studios || []
    let success = 0
    let failed = 0

    for (const s of list) {
      const result = await generateStudioAiReport(s.id)
      if (result.success) {
        success++
        logger.info(`[CRON] Relatório IA gerado: ${s.name} (${s.id})`)
      } else {
        failed++
        logger.warn(`[CRON] Falha ao gerar relatório para ${s.name}:`, result.error)
      }
    }

    logger.info(`[CRON] refresh-ai-reports concluído: ${success} ok, ${failed} falhas`)
    return NextResponse.json({ success: true, processed: list.length, ok: success, failed })
  } catch (e: any) {
    logger.error('[CRON] refresh-ai-reports erro:', e)
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
