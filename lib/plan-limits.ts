/**
 * Definições de limites para os planos do Workflow AI
 */

export interface PlanLimits {
  name: string;
  price: number;
  maxStudents: number;
  maxTeachers: number;
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
    maxTeachers: 1,
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
    maxTeachers: 5,
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
  "pro+": {
    name: "Pro+",
    price: 197,
    maxStudents: 500,
    maxTeachers: 15,
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
  enterprise: {
    name: "Enterprise",
    price: 397,
    maxStudents: 1000000,
    maxTeachers: 1000000,
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

/**
 * Verifica se um estúdio atingiu o limite de um recurso
 * @param currentCount Quantidade atual do recurso
 * @param plan Nome do plano (gratuito, pro, pro+, enterprise)
 * @param resource Nome do recurso (maxStudents, maxTeachers)
 */
export function isLimitReached(
  currentCount: number,
  plan: string = 'gratuito',
  resource: keyof PlanLimits
): boolean {
  const normalizedPlan = plan.toLowerCase();
  const limits = PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.gratuito;
  const limit = limits[resource];
  
  if (typeof limit === 'number') {
    return currentCount >= limit;
  }
  
  return false;
}
