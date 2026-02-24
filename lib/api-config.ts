// Utilitários para gerenciamento das configurações das APIs de IA
// IMPORTANTE: Chaves de API nunca devem ser armazenadas no cliente.
// Todas as chaves devem ser configuradas como variáveis de ambiente no servidor.

export interface ApiKeys {
  openaiApiKey?: string
  geminiApiKey?: string
}

export function getApiKeys(): ApiKeys {
  // Chaves são obtidas exclusivamente das variáveis de ambiente (servidor)
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