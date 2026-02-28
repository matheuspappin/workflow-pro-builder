import { supabaseAdmin } from '@/lib/supabase-admin'

type LogType = 'error' | 'warning' | 'success' | 'info'

/**
 * Escreve um log no painel admin. Use em API routes e Server Actions.
 * Os logs aparecem em /admin/logs.
 */
export async function logAdmin(
  type: LogType,
  source: string,
  message: string,
  opts?: { studio?: string; metadata?: Record<string, unknown> }
) {
  try {
    await supabaseAdmin.from('admin_system_logs').insert({
      type,
      source,
      message,
      studio: opts?.studio ?? null,
      metadata: opts?.metadata ?? {},
    })
  } catch (err) {
    console.error('[admin-logs] Falha ao gravar log:', err)
  }
}
