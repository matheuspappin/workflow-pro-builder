// Cache configuration
const CACHE_TTL = {
  AI_RESPONSE: 300, // 5 minutos
  STUDIO_KNOWLEDGE: 3600, // 1 hora
  AVAILABILITY: 1800, // 30 minutos
  RATE_LIMIT: 60 // 1 minuto
}

// In-memory cache fallback when Redis is not available
const memoryCache = new Map<string, { data: any; expiry: number }>()

// Cache key generators
export const cacheKeys = {
  aiResponse: (message: string, provider: string) => 
    `ai_response:${provider}:${Buffer.from(message).toString('base64').substring(0, 32)}`,
  
  studioKnowledge: (studioId: string) => 
    `studio_knowledge:${studioId}`,
  
  availability: (studioId: string, date: string, professionalId?: string) =>
    `availability:${studioId}:${date}${professionalId ? `:${professionalId}` : ''}`,
  
  professionals: (studioId: string, serviceType?: string) =>
    `professionals:${studioId}${serviceType ? `:${serviceType}` : ''}`
}

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.AI_RESPONSE
): Promise<T> {
  try {
    // Try Redis first if available
    const Redis = await import('ioredis').catch(() => {
      // ioredis not available, continue with memory cache
      return null
    })
    if (Redis) {
      return await getCachedDataRedis(key, fetcher, ttl, Redis)
    }
  } catch (error) {
    console.warn('Redis not available, using memory cache:', error)
  }
  
  // Fallback to memory cache
  return await getCachedDataMemory(key, fetcher, ttl)
}

async function getCachedDataRedis<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  Redis: any
): Promise<T> {
  // Redis implementation would go here
  // For now, fallback to memory cache
  return await getCachedDataMemory(key, fetcher, ttl)
}

async function getCachedDataMemory<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const now = Date.now()
  const cached = memoryCache.get(key)
  
  // Check if cache is valid
  if (cached && cached.expiry > now) {
    return cached.data as T
  }
  
  // Fetch and cache new data
  const data = await fetcher()
  memoryCache.set(key, {
    data,
    expiry: now + (ttl * 1000)
  })
  
  // Cleanup expired entries periodically
  if (memoryCache.size > 1000) {
    for (const [cacheKey, value] of memoryCache.entries()) {
      if (value.expiry <= now) {
        memoryCache.delete(cacheKey)
      }
    }
  }
  
  return data
}

export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL.AI_RESPONSE
): Promise<void> {
  const now = Date.now()
  memoryCache.set(key, {
    data,
    expiry: now + (ttl * 1000)
  })
}

export async function invalidateCache(pattern: string): Promise<void> {
  const now = Date.now()
  for (const [key, value] of memoryCache.entries()) {
    if (key.includes(pattern) || value.expiry <= now) {
      memoryCache.delete(key)
    }
  }
}

// Rate limiting helper
export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  window: number = CACHE_TTL.RATE_LIMIT
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const cached = memoryCache.get(key)
  
  let current = 0
  let windowStart = now
  
  if (cached && cached.expiry > now) {
    current = cached.data.current || 0
    windowStart = cached.data.windowStart || now
  }
  
  // Reset if window expired
  if (now - windowStart > window * 1000) {
    current = 0
    windowStart = now
  }
  
  current++
  
  memoryCache.set(key, {
    data: { current, windowStart },
    expiry: windowStart + (window * 1000)
  })
  
  const allowed = current <= limit
  const remaining = Math.max(0, limit - current)
  
  return { allowed, remaining }
}

// Cleanup function for graceful shutdown
export async function cleanupCache(): Promise<void> {
  memoryCache.clear()
}
