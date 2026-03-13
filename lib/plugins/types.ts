/**
 * Plugin Architecture — tipos para verticalizações (nichos)
 *
 * Cada nicho (dance, fire_protection, agroflowai) é um plugin que define:
 * - Config de cache de contexto AI
 * - Endpoint de chat
 * - Módulos de nav (via config/*-nav.ts)
 *
 * A config de rotas/auth está em config/verticalizations.ts
 */

export type NicheSlug = 'dance' | 'fire_protection' | 'agroflowai'

export interface NicheContextCacheConfig {
  /** Limite de conversas de treino no contexto */
  trainingLimit: number
  /** Incluir setting ai_model do studio */
  includeModelSetting: boolean
  /** Incluir leads (dance usa) */
  includeLeads: boolean
  /** Incluir inventário (dance usa) */
  includeInventory: boolean
}

export interface NichePlugin {
  /** Identificador do nicho (organization_settings.niche) */
  niche: NicheSlug
  /** Path da solução: /solutions/<basePath> */
  basePath: string
  /** Endpoint de chat AI */
  aiEndpoint: string
  /** Config do cache de contexto para AI */
  contextCache: NicheContextCacheConfig
}
