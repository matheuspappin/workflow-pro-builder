/**
 * Chaves de localStorage padronizadas para o ecossistema akaaicore.
 *
 * IMPORTANTE: Cada verticalização tem uma chave específica para contexto de usuário,
 * mas TODAS compartilham a mesma estrutura de dados:
 * { id, name, email, role, studio_id, studioId, studioName, studioSlug }
 *
 * A chave legada "danceflow_user" é mantida por retrocompatibilidade nas verticalizações
 * que já estavam em produção (fire-protection, estudio-de-danca).
 */

export const STORAGE_KEYS = {
  // Sessão de usuário por verticalização
  DANCEFLOW_USER: 'danceflow_user',       // fire-protection + estudio-de-danca (legado)
  AGROFLOW_USER: 'workflow_user',          // agroflowai
  WORKFLOW_USER: 'danceflow_user',         // workflow principal (alias do danceflow para retrocompat)

  // Estúdio/tenant ativo
  ACTIVE_STUDIO: 'workflow_pro_active_studio',

  // Preferências globais
  LANGUAGE: 'workflow_pro_lang',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/**
 * Retorna a chave de sessão correta para uma verticalização.
 */
export function getSessionKey(verticalization: 'fire-protection' | 'estudio-de-danca' | 'agroflowai' | 'default'): string {
  if (verticalization === 'agroflowai') return STORAGE_KEYS.AGROFLOW_USER
  return STORAGE_KEYS.DANCEFLOW_USER
}

/**
 * Lê o usuário da sessão local de uma verticalização.
 * Tenta a chave principal e o fallback legado.
 */
export function getLocalUser(verticalization: 'fire-protection' | 'estudio-de-danca' | 'agroflowai' | 'default'): Record<string, any> | null {
  if (typeof window === 'undefined') return null

  const key = getSessionKey(verticalization)
  const raw = localStorage.getItem(key)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Limpa a sessão local de uma verticalização.
 */
export function clearLocalUser(verticalization: 'fire-protection' | 'estudio-de-danca' | 'agroflowai' | 'default'): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(getSessionKey(verticalization))
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_STUDIO)
}
