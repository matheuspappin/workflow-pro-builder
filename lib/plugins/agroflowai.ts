import type { NichePlugin } from './types'

export const agroflowaiPlugin: NichePlugin = {
  niche: 'agroflowai',
  basePath: 'agroflowai',
  aiEndpoint: '/api/agroflowai/ai/chat',
  contextCache: {
    trainingLimit: 6,
    includeModelSetting: false,
    includeLeads: false,
    includeInventory: false,
  },
}
