// Utilitários para gerenciamento das configurações das APIs de IA
// IMPORTANTE: Chaves de API nunca devem ser armazenadas no cliente.
// Todas as chaves devem ser configuradas como variáveis de ambiente no servidor.

export interface ApiKeys {
  openaiApiKey?: string
  geminiApiKey?: string
}

const STORAGE_KEY = 'workflow_api_keys'

export function getApiKeys(): ApiKeys {
  // No servidor: variáveis de ambiente
  if (typeof window === 'undefined') {
    return {
      openaiApiKey: process.env.OPENAI_API_KEY,
      geminiApiKey: process.env.GOOGLE_AI_API_KEY,
    }
  }
  // No cliente: localStorage (configurações salvas pelo usuário)
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as ApiKeys
      return {
        openaiApiKey: parsed.openaiApiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        geminiApiKey: parsed.geminiApiKey || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
      }
    }
  } catch {
    // ignore
  }
  return {
    openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    geminiApiKey: process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
  }
}

export function setApiKeys(keys: ApiKeys): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  } catch {
    // ignore
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