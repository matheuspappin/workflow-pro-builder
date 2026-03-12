// TTLs em segundos
export const CACHE_TTL = {
  AI_RESPONSE: 300,      // 5 min — respostas cacheáveis (ex: FAQ)
  STUDIO_KNOWLEDGE: 3600, // 1 hora — contexto do estúdio (alunos, config)
  AVAILABILITY: 1800,    // 30 min — disponibilidade de horários
  RATE_LIMIT: 60,        // 1 min — janela de rate limit
}

// Cache key generators
export const cacheKeys = {
  aiResponse: (studioId: string, msgHash: string) =>
    `ai_response:${studioId}:${msgHash}`,

  studioContext: (studioId: string) =>
    `studio_ctx:${studioId}`,

  availability: (studioId: string, date: string, professionalId?: string) =>
    `avail:${studioId}:${date}${professionalId ? `:${professionalId}` : ''}`,

  professionals: (studioId: string, serviceType?: string) =>
    `profs:${studioId}${serviceType ? `:${serviceType}` : ''}`,
}

// ─── Upstash Redis (produção / serverless) ────────────────────────────────────

function getUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url, token }
}

async function redisGet(key: string): Promise<string | null> {
  const cfg = getUpstash()
  if (!cfg) return null
  try {
    const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
      cache: 'no-store',
    })
    const json = await res.json() as { result: string | null }
    return json.result ?? null
  } catch {
    return null
  }
}

async function redisSetex(key: string, ttl: number, value: string): Promise<void> {
  const cfg = getUpstash()
  if (!cfg) return
  try {
    await fetch(`${cfg.url}/setex/${encodeURIComponent(key)}/${ttl}/${encodeURIComponent(value)}`, {
      method: 'GET', // Upstash REST usa GET para setex via URL
      headers: { Authorization: `Bearer ${cfg.token}` },
      cache: 'no-store',
    })
  } catch {
    // falha silenciosa — cache miss é aceitável
  }
}

async function redisDel(pattern: string): Promise<void> {
  const cfg = getUpstash()
  if (!cfg) return
  try {
    // Upstash suporta SCAN + DEL via pipeline
    const scanRes = await fetch(`${cfg.url}/scan/0/match/${encodeURIComponent(`*${pattern}*`)}/count/100`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
      cache: 'no-store',
    })
    const scanJson = await scanRes.json() as { result: [string, string[]] }
    const keys = scanJson.result?.[1] ?? []
    if (keys.length > 0) {
      await fetch(`${cfg.url}/del/${keys.map(encodeURIComponent).join('/')}`, {
        headers: { Authorization: `Bearer ${cfg.token}` },
        cache: 'no-store',
      })
    }
  } catch {
    // falha silenciosa
  }
}

// ─── Fallback em memória (desenvolvimento sem Upstash) ───────────────────────

const memoryCache = new Map<string, { data: string; expiry: number }>()

function memGet(key: string): string | null {
  const entry = memoryCache.get(key)
  if (!entry || entry.expiry < Date.now()) {
    memoryCache.delete(key)
    return null
  }
  return entry.data
}

function memSet(key: string, ttl: number, value: string): void {
  // Limpeza periódica quando cache cresce demais
  if (memoryCache.size > 500) {
    const now = Date.now()
    for (const [k, v] of memoryCache.entries()) {
      if (v.expiry < now) memoryCache.delete(k)
    }
  }
  memoryCache.set(key, { data: value, expiry: Date.now() + ttl * 1000 })
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Busca dado do cache (Redis em prod, memória em dev) ou executa fetcher.
 * Dados são serializados como JSON.
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.AI_RESPONSE
): Promise<T> {
  const useRedis = !!getUpstash()

  const raw = useRedis ? await redisGet(key) : memGet(key)
  if (raw !== null) {
    try {
      return JSON.parse(raw) as T
    } catch {
      // dado corrompido — recomputar
    }
  }

  const data = await fetcher()
  const serialized = JSON.stringify(data)

  if (useRedis) {
    await redisSetex(key, ttl, serialized)
  } else {
    memSet(key, ttl, serialized)
  }

  return data
}

/**
 * Armazena dado diretamente no cache sem fetcher.
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL.AI_RESPONSE
): Promise<void> {
  const serialized = JSON.stringify(data)
  if (getUpstash()) {
    await redisSetex(key, ttl, serialized)
  } else {
    memSet(key, ttl, serialized)
  }
}

/**
 * Invalida todas as chaves que contêm o padrão.
 * Em desenvolvimento: varre o Map local.
 * Em produção: usa SCAN do Upstash.
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (getUpstash()) {
    await redisDel(pattern)
  } else {
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) memoryCache.delete(key)
    }
  }
}

export async function cleanupCache(): Promise<void> {
  memoryCache.clear()
}
