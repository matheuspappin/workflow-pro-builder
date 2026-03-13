/**
 * Plugin Architecture — verticalizações
 *
 * Cada nicho é um plugin com config de AI, cache e rotas.
 * Evita copy-paste entre dance, fire_protection e agroflowai.
 */

export { getPlugin, getPluginByBasePath, getAllPlugins } from './registry'
export { dancePlugin } from './dance'
export { fireProtectionPlugin } from './fire-protection'
export { agroflowaiPlugin } from './agroflowai'
export type { NichePlugin, NicheSlug, NicheContextCacheConfig } from './types'
