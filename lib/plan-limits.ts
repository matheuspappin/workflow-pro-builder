/**
 * Definições de limites para os planos do Workflow AI
 */

export interface PlanLimits {
  name: string;
  price: number;
  maxStudents: number;
  maxProfessionals: number; // Alterado de maxTeachers para maxProfessionals
  hasWhatsApp: boolean;
  hasAI: boolean;
  hasFinance: boolean;
  hasMultiUnit: boolean;
  hasPOS: boolean;
  hasInventory: boolean;
  hasGamification: boolean;
  hasLeads: boolean;
  hasScanner: boolean;
  hasMarketplace: boolean;
  hasERP: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  gratuito: {
    name: "Gratuito",
    price: 0,
    maxStudents: 10,
    maxProfessionals: 1, // Alterado de maxTeachers para maxProfessionals
    hasWhatsApp: false,
    hasAI: false,
    hasFinance: true,
    hasMultiUnit: false,
    hasPOS: false,
    hasInventory: false,
    hasGamification: false,
    hasLeads: false,
    hasScanner: false,
    hasMarketplace: false,
    hasERP: false,
  },
  pro: {
    name: "Pro",
    price: 97,
    maxStudents: 100,
    maxProfessionals: 5, // Alterado de maxTeachers para maxProfessionals
    hasWhatsApp: true,
    hasAI: true,
    hasFinance: true,
    hasMultiUnit: false,
    hasPOS: true,
    hasInventory: true,
    hasGamification: false,
    hasLeads: true,
    hasScanner: true,
    hasMarketplace: false,
    hasERP: false,
  },
  "pro-plus": {
    name: "Pro+",
    price: 197,
    maxStudents: 500,
    maxProfessionals: 15, // Alterado de maxTeachers para maxProfessionals
    hasWhatsApp: true,
    hasAI: true,
    hasFinance: true,
    hasMultiUnit: false,
    hasPOS: true,
    hasInventory: true,
    hasGamification: true,
    hasLeads: true,
    hasScanner: true,
    hasMarketplace: true,
    hasERP: false,
  },
  // "pro+" é alias para "pro-plus" — normalizado em isLimitReached()
  enterprise: {
    name: "Enterprise",
    price: 397,
    maxStudents: 1000000,
    maxProfessionals: 1000000, // Alterado de maxTeachers para maxProfessionals
    hasWhatsApp: true,
    hasAI: true,
    hasFinance: true,
    hasMultiUnit: true,
    hasPOS: true,
    hasInventory: true,
    hasGamification: true,
    hasLeads: true,
    hasScanner: true,
    hasMarketplace: true,
    hasERP: true,
  },
};

/** Objeto retornado por normalizePlanForDisplay para exibição na UI */
export interface PlanDisplay {
  name: string
  description?: string
  price: number
  max_students: number
  max_teachers: number
  has_whatsapp: boolean
  has_ai: boolean
  has_finance: boolean
  has_multi_unit: boolean
  has_pos: boolean
  hasPOS: boolean
  has_inventory: boolean
  hasInventory: boolean
  has_gamification: boolean
  hasGamification: boolean
  has_leads: boolean
  hasLeads: boolean
  has_scanner: boolean
  hasScanner: boolean
  has_marketplace: boolean
  hasMarketplace: boolean
  has_erp: boolean
  hasERP: boolean
}

/** Mapeamento module key -> [has_snake, hasCamel] */
const MODULE_TO_HAS: Record<string, [string, string]> = {
  whatsapp: ['has_whatsapp', 'hasWhatsApp'],
  ai_chat: ['has_ai', 'hasAI'],
  financial: ['has_finance', 'hasFinance'],
  multi_unit: ['has_multi_unit', 'hasMultiUnit'],
  pos: ['has_pos', 'hasPOS'],
  inventory: ['has_inventory', 'hasInventory'],
  gamification: ['has_gamification', 'hasGamification'],
  leads: ['has_leads', 'hasLeads'],
  scanner: ['has_scanner', 'hasScanner'],
  marketplace: ['has_marketplace', 'hasMarketplace'],
  erp: ['has_erp', 'hasERP'],
}

/**
 * Normaliza um plano do banco (com modules JSONB ou colunas has_*) para exibição.
 * Retorna objeto com has_whatsapp, has_ai, has_pos, hasPOS, etc.
 */
export function normalizePlanForDisplay(plan: Record<string, unknown> | null, planId?: string): PlanDisplay {
  if (!plan) {
    const normId = (planId || 'gratuito').toLowerCase().replace('pro+', 'pro-plus')
    const fallback = PLAN_LIMITS[normId] || PLAN_LIMITS.gratuito
    return {
      ...fallback,
      name: fallback.name,
      max_students: fallback.maxStudents,
      max_teachers: fallback.maxProfessionals,
      has_whatsapp: fallback.hasWhatsApp,
      has_ai: fallback.hasAI,
      has_finance: fallback.hasFinance,
      has_multi_unit: fallback.hasMultiUnit,
      has_pos: fallback.hasPOS,
      hasPOS: fallback.hasPOS,
      has_inventory: fallback.hasInventory,
      hasInventory: fallback.hasInventory,
      has_gamification: fallback.hasGamification,
      hasGamification: fallback.hasGamification,
      has_leads: fallback.hasLeads,
      hasLeads: fallback.hasLeads,
      has_scanner: fallback.hasScanner,
      hasScanner: fallback.hasScanner,
      has_marketplace: fallback.hasMarketplace,
      hasMarketplace: fallback.hasMarketplace,
      has_erp: fallback.hasERP,
      hasERP: fallback.hasERP,
    }
  }

  const modules = (plan.modules as Record<string, boolean>) || {}
  const out: Record<string, unknown> = { ...plan }

  for (const [modKey, [snakeKey, camelKey]] of Object.entries(MODULE_TO_HAS)) {
    const val = modules[modKey]
    if (val !== undefined) {
      if (out[snakeKey] === undefined || out[snakeKey] === null) out[snakeKey] = val
      if (out[camelKey] === undefined || out[camelKey] === null) out[camelKey] = val
    }
  }

  return out as unknown as PlanDisplay
}

/**
 * Verifica se um estúdio atingiu o limite de um recurso
 * @param currentCount Quantidade atual do recurso
 * @param plan Nome do plano (gratuito, pro, pro+, enterprise)
 * @param resource Nome do recurso (maxStudents, maxProfessionals)
 */
export function isLimitReached(
  currentCount: number,
  plan: string = 'gratuito',
  resource: keyof PlanLimits
): boolean {
  let normalizedPlan = plan.toLowerCase();
  // Normalizar aliases de plano
  if (normalizedPlan === 'pro+') normalizedPlan = 'pro-plus';
  const limits = PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.gratuito;
  const limit = limits[resource];
  
  if (typeof limit === 'number') {
    return currentCount >= limit;
  }
  
  return false;
}
