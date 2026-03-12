/**
 * Faixas de profissionais por estúdio.
 * Usado quando o plano é Personalizado (sem gratuito/pro/enterprise).
 * O cliente escolhe a faixa no registro ou em Configurações.
 */

export interface ProfessionalTier {
  id: string
  /** Ex: "1-10", "11-20", "21-50" */
  labelKey: string
  /** Limite máximo de profissionais nesta faixa */
  limit: number
  /** Preço mensal em reais */
  price: number
  /** Descrição curta */
  description?: string
}

export const PROFESSIONAL_TIERS: ProfessionalTier[] = [
  { id: '1-10', labelKey: 'tier_1_10', limit: 10, price: 97, description: 'Até 10 profissionais' },
  { id: '11-20', labelKey: 'tier_11_20', limit: 20, price: 197, description: 'Até 20 profissionais' },
  { id: '21-50', labelKey: 'tier_21_50', limit: 50, price: 397, description: 'Até 50 profissionais' },
]

export const DEFAULT_PROFESSIONALS_TIER = '1-10'

export function getTierById(id: string): ProfessionalTier | undefined {
  return PROFESSIONAL_TIERS.find(t => t.id === id)
}

export function getTierLimit(tierId: string | null | undefined): number {
  const tier = getTierById(tierId || DEFAULT_PROFESSIONALS_TIER)
  return tier?.limit ?? 10
}
