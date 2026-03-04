import { supabaseAdmin } from '@/lib/supabase-admin'

let cachedMaintenanceMode: boolean | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 30_000 // 30 segundos de cache

/**
 * Verifica se o sistema está em modo manutenção.
 * 1. Prioridade: env var MAINTENANCE_MODE (sem DB call)
 * 2. Fallback: flag no banco (admin_system_logs com source='system/maintenance')
 * 
 * Resultado é cacheado por 30s para evitar queries excessivas no middleware.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  // 1. Env var (instantâneo, sem DB)
  if (process.env.MAINTENANCE_MODE === 'true') return true
  if (process.env.MAINTENANCE_MODE === 'false') return false

  // 2. Cache check
  const now = Date.now()
  if (cachedMaintenanceMode !== null && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedMaintenanceMode
  }

  // 3. DB check (runtime toggle pelo Super Admin)
  try {
    const { data } = await supabaseAdmin
      .from('admin_system_logs')
      .select('message')
      .eq('source', 'system/maintenance')
      .eq('type', 'info')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    cachedMaintenanceMode = data?.message === 'ON'
    cacheTimestamp = now
    return cachedMaintenanceMode
  } catch {
    return false
  }
}

/**
 * Ativa ou desativa o modo manutenção via banco de dados.
 * Chamado pelo Super Admin.
 */
export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await supabaseAdmin
    .from('admin_system_logs')
    .insert({
      type: 'info',
      source: 'system/maintenance',
      message: enabled ? 'ON' : 'OFF',
      metadata: { enabled, toggledAt: new Date().toISOString() },
    })

  // Invalida cache imediatamente
  cachedMaintenanceMode = enabled
  cacheTimestamp = Date.now()
}
