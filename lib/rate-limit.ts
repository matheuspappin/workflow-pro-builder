/**
 * Rate limiter para login/registro.
 * - Produção (UPSTASH_* definidos): Redis/Upstash – funciona entre múltiplas instâncias
 * - Desenvolvimento: fallback em memória por instância
 */

const WINDOW_MS = 60 * 1000 // 1 minuto
const MAX_ATTEMPTS = 10 // máx por janela

function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown'
  return `auth:${ip}`
}

// Fallback em memória (desenvolvimento ou quando Upstash não está configurado)
const memStore = new Map<string, { count: number; resetAt: number }>()

function memCleanup() {
  const now = Date.now()
  for (const [key, data] of memStore.entries()) {
    if (data.resetAt < now) memStore.delete(key)
  }
}

function memCheck(request: Request): { allowed: boolean; retryAfter?: number } {
  memCleanup()
  const key = getClientKey(request)
  const now = Date.now()
  const entry = memStore.get(key)

  if (!entry) {
    memStore.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  if (entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  entry.count++
  if (entry.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }
  return { allowed: true }
}

// Upstash Redis (produção)
async function upstashCheck(request: Request): Promise<{ allowed: boolean; retryAfter?: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return memCheck(request)
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')

    const redis = new Redis({ url, token })
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, `${WINDOW_MS / 1000} s`),
      analytics: true,
    })

    const key = getClientKey(request)
    const { success, limit, reset, remaining } = await ratelimit.limit(key)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return { allowed: false, retryAfter }
    }
    return { allowed: true }
  } catch (err) {
    // Em caso de erro no Redis, permite a requisição e usa fallback
    console.warn('[rate-limit] Upstash falhou, usando fallback em memória:', (err as Error)?.message)
    return memCheck(request)
  }
}

/**
 * Verifica rate limit para rotas de autenticação (login/registro).
 * Use UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN em produção.
 */
export async function checkAuthRateLimit(request: Request): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return upstashCheck(request)
  }
  return memCheck(request)
}
