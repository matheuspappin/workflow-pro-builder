/**
 * CRON: Healthcheck do worker PHP de NF-e.
 * Dispara alerta (admin_logs + email opcional) quando o serviço está indisponível.
 *
 * Configurar no vercel.json (diário):
 *   { "path": "/api/cron/fiscal-health", "schedule": "0 8 * * *" }
 *
 * Requer CRON_SECRET no header Authorization: Bearer <CRON_SECRET>
 * Opcional: FISCAL_ALERT_EMAIL para receber alertas por email
 */

import { NextRequest, NextResponse } from 'next/server'
import { logAdmin } from '@/lib/admin-logs'
import { sendEmail } from '@/lib/email'
import logger from '@/lib/logger'

const FISCAL_WORKER_URL = process.env.FISCAL_WORKER_URL
const FISCAL_ALERT_EMAIL = process.env.FISCAL_ALERT_EMAIL

export const maxDuration = 30

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!FISCAL_WORKER_URL) {
    return NextResponse.json({ status: 'skipped', reason: 'FISCAL_WORKER_URL não configurado' })
  }

  const healthUrl = `${FISCAL_WORKER_URL.replace(/\/$/, '')}/health`
  const serviceKey = process.env.FISCAL_SERVICE_KEY

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (serviceKey) headers['X-Fiscal-Service-Key'] = serviceKey

    const res = await fetch(healthUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = (await res.json()) as { status?: string; service?: string }
    if (data?.status !== 'ok') {
      throw new Error('Resposta inválida do health check')
    }

    logger.info('[fiscal-health] Worker NF-e OK')
    return NextResponse.json({ status: 'ok', service: data.service })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    logger.error({ err }, '[fiscal-health] Worker NF-e indisponível')

    await logAdmin('error', 'cron/fiscal-health', `Worker NF-e indisponível: ${message}`, {
      metadata: { url: healthUrl, error: message },
    })

    if (FISCAL_ALERT_EMAIL) {
      await sendEmail({
        to: FISCAL_ALERT_EMAIL,
        subject: '[Workflow AI] Alerta: Worker NF-e indisponível',
        html: `
          <p>O healthcheck do worker de emissão NF-e falhou.</p>
          <p><strong>URL:</strong> ${healthUrl}</p>
          <p><strong>Erro:</strong> ${message}</p>
          <p>Verifique os logs em /admin/logs e a disponibilidade do microserviço PHP.</p>
        `,
      })
    }

    return NextResponse.json(
      { status: 'error', message: 'Worker NF-e indisponível', error: message },
      { status: 503 }
    )
  }
}
