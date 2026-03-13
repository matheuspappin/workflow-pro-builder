/**
 * Payment Gateway — abstração para pagamentos
 *
 * Provedores:
 * - Stripe: cartão + PIX (contas BR elegíveis)
 * - Asaas: planejado — cobranças PIX/boletos (futuro)
 * - Pagar.me: planejado — gateway BR alternativo (futuro)
 *
 * Variáveis de ambiente:
 * - STRIPE_SECRET_KEY: obrigatório para Stripe
 * - ASAAS_API_KEY: (futuro) para usar Asaas como fallback PIX
 * - PAGARME_API_KEY: (futuro) para Pagar.me
 */

export { createStripeCheckoutSession, getStripePaymentMethodsForBRL } from './stripe-provider';
export type { PaymentMethod, CreateCheckoutParams, CreateCheckoutResult, PaymentGateway } from './types';
