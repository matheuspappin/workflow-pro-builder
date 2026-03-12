import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { emitNfeForPackagePurchase } from '@/lib/actions/nfe-emit-package-purchase'
import logger from '@/lib/logger'

/**
 * CRON JOB: Processamento assíncrono da fila de emissão de NF-e.
 *
 * Configurar no vercel.json:
 *   { "path": "/api/cron/process-nfe-queue", "schedule": "* /2 * * * *" }
 *
 * Requer CRON_SECRET no header Authorization: Bearer <CRON_SECRET>
 */
export const maxDuration = 60

type QueueItem = {
  id: string
  studio_id: string
  payload: { payment_id: string; studio_id: string }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Busca até 5 itens da fila atomicamente — SKIP LOCKED evita duplo processamento
  const { data: items, error: dequeueError } = await supabaseAdmin
    .rpc('dequeue_nfe_batch', { p_batch_size: 5 })

  if (dequeueError) {
    logger.error({ err: dequeueError }, '[nfe-queue] Erro ao buscar itens da fila')
    return NextResponse.json({ error: 'Falha ao acessar fila' }, { status: 500 })
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ processed: 0, message: 'Fila vazia' })
  }

  const results = await Promise.allSettled(
    (items as QueueItem[]).map(async (item) => {
      const { payment_id, studio_id } = item.payload

      if (!payment_id || !studio_id) {
        await supabaseAdmin.rpc('resolve_nfe_queue_item', {
          p_queue_id: item.id,
          p_success: false,
          p_error: 'Payload inválido: payment_id ou studio_id ausente',
        })
        throw new Error('Payload inválido')
      }

      const result = await emitNfeForPackagePurchase(payment_id, studio_id)

      if (result.success) {
        await supabaseAdmin.rpc('resolve_nfe_queue_item', {
          p_queue_id: item.id,
          p_success: true,
        })
        logger.info({ queueId: item.id, invoiceNumber: result.invoiceNumber }, '[nfe-queue] NFe emitida')
      } else {
        await supabaseAdmin.rpc('resolve_nfe_queue_item', {
          p_queue_id: item.id,
          p_success: false,
          p_error: result.error ?? 'Erro desconhecido',
        })
        throw new Error(result.error ?? 'Emissão falhou')
      }
    })
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  logger.info({ total: items.length, succeeded, failed }, '[nfe-queue] Batch processado')

  return NextResponse.json({ processed: items.length, succeeded, failed })
}
