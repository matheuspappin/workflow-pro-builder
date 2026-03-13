import type { NichePlugin } from './types'

export const dancePlugin: NichePlugin = {
  niche: 'dance',
  basePath: 'estudio-de-danca',
  aiEndpoint: '/api/gemini',
  contextCache: {
    trainingLimit: 8,
    includeModelSetting: true,
    includeLeads: true,
    includeInventory: true,
  },
}
