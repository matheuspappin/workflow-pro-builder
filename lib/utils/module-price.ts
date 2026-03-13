/**
 * Retorna o preço efetivo do módulo para o intervalo de cobrança.
 * @param module - Módulo com price, price_annual?, annual_discount_percent?
 * @param billingInterval - 'monthly' ou 'yearly'
 */
export function getModulePrice(
  module: { price: number; price_annual?: number | null; annual_discount_percent?: number | null },
  billingInterval: 'monthly' | 'yearly'
): number {
  if (billingInterval === 'monthly') return Number(module.price) || 0
  const discount = Number(module.annual_discount_percent ?? 17) / 100
  if (module.price_annual != null && module.price_annual > 0) {
    return Number(module.price_annual)
  }
  return Math.round((Number(module.price) || 0) * 12 * (1 - discount) * 100) / 100
}
