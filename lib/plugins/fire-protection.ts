import type { NichePlugin } from './types'

export const fireProtectionPlugin: NichePlugin = {
  niche: 'fire_protection',
  basePath: 'fire-protection',
  aiEndpoint: '/api/fire-protection/ai/chat',
  contextCache: {
    trainingLimit: 6,
    includeModelSetting: true,
    includeLeads: false,
    includeInventory: false,
  },
}
