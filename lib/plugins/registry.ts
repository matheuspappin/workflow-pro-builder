/**
 * Registry de plugins por nicho.
 * Adicionar novo plugin aqui e em lib/ai-router.ts (AI_ENDPOINTS).
 */

import type { NichePlugin, NicheSlug } from './types'
import { dancePlugin } from './dance'
import { fireProtectionPlugin } from './fire-protection'
import { agroflowaiPlugin } from './agroflowai'

const PLUGINS: Record<NicheSlug, NichePlugin> = {
  dance: dancePlugin,
  fire_protection: fireProtectionPlugin,
  agroflowai: agroflowaiPlugin,
}

export function getPlugin(niche: NicheSlug): NichePlugin {
  const p = PLUGINS[niche]
  if (!p) throw new Error(`Plugin não registrado: ${niche}`)
  return p
}

export function getPluginByBasePath(basePath: string): NichePlugin | undefined {
  return Object.values(PLUGINS).find((p) => p.basePath === basePath)
}

export function getAllPlugins(): NichePlugin[] {
  return Object.values(PLUGINS)
}
