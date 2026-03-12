// Utilitários para gerenciamento das configurações das APIs de IA
// SEGURANÇA: Este módulo é SERVER-ONLY. Nunca importe em componentes de cliente.
// Chaves de API NUNCA devem ser expostas ao browser via NEXT_PUBLIC_*.

export interface ApiKeys {
  openaiApiKey?: string
  geminiApiKey?: string
}

/**
 * Retorna chaves de API exclusivamente do servidor.
 * Chamadas client-side a APIs de IA devem passar pelo backend (API Routes).
 */
export function getApiKeys(): ApiKeys {
  if (typeof window !== 'undefined') {
    // Proteção: não executar no browser — nunca expor chaves ao cliente
    throw new Error('[api-config] getApiKeys() não pode ser chamado no cliente. Use uma API Route.')
  }
  return {
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GOOGLE_AI_API_KEY,
  }
}

export function validateApiKey(key: string, provider: 'openai' | 'gemini'): boolean {
  if (!key || key.trim().length === 0) {
    return false
  }

  if (provider === 'openai') {
    return key.startsWith('sk-') && key.length > 20
  } else if (provider === 'gemini') {
    return key.startsWith('AIza') && key.length > 20
  }

  return false
}