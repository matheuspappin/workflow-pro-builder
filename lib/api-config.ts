// Utilitários para gerenciamento das configurações das APIs de IA

export interface ApiKeys {
  openaiApiKey?: string
  geminiApiKey?: string
}

export function getApiKeys(): ApiKeys {
  // Tentar obter das variáveis de ambiente primeiro
  const envKeys = {
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GOOGLE_AI_API_KEY,
  }

  // Se as chaves não estiverem no ambiente, tentar do localStorage
  if (!envKeys.openaiApiKey || !envKeys.geminiApiKey) {
    try {
      if (typeof window !== 'undefined') {
        const storedKeys = localStorage.getItem("danceflow_api_keys")
        if (storedKeys) {
          const parsedKeys = JSON.parse(storedKeys)
          envKeys.openaiApiKey = envKeys.openaiApiKey || parsedKeys.openaiApiKey
          envKeys.geminiApiKey = envKeys.geminiApiKey || parsedKeys.geminiApiKey
        }
      }
    } catch (error) {
      console.error('Erro ao carregar chaves do localStorage:', error)
    }
  }

  return envKeys
}

export function setApiKeys(keys: ApiKeys): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem("danceflow_api_keys", JSON.stringify(keys))
  }
}

export function validateApiKey(key: string, provider: 'openai' | 'gemini'): boolean {
  if (!key || key.trim().length === 0) {
    return false
  }

  if (provider === 'openai') {
    // Chaves da OpenAI começam com 'sk-'
    return key.startsWith('sk-') && key.length > 20
  } else if (provider === 'gemini') {
    // Chaves do Google AI geralmente começam com 'AIza'
    return key.startsWith('AIza') && key.length > 20
  }

  return false
}