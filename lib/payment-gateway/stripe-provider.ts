import Stripe from 'stripe';
import type { CreateCheckoutParams, CreateCheckoutResult, PaymentMethod } from './types';

/**
 * Provedor Stripe com suporte a PIX para contas brasileiras.
 * PIX é habilitado automaticamente quando currency é BRL.
 * Requisitos Stripe: conta BR, 60 dias de histórico, BRL habilitado.
 */
export function createStripeCheckoutSession(
  stripe: Stripe,
  params: CreateCheckoutParams
): Promise<CreateCheckoutResult> {
  const methods = params.paymentMethods ?? ['card', 'pix'];
  const paymentMethodTypes = methods.map((m) => (m === 'pix' ? 'pix' : 'card'));

  return stripe.checkout.sessions
    .create({
      payment_method_types: paymentMethodTypes as ('card' | 'pix')[],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.description,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      ...(params.customerEmail && { customer_email: params.customerEmail }),
    })
    .then((session) => ({
      url: session.url!,
      sessionId: session.id,
    }));
}

/**
 * Retorna os métodos de pagamento recomendados para BRL.
 * Stripe PIX só aparece no Checkout se a conta for elegível (BR, 60 dias, etc).
 */
export function getStripePaymentMethodsForBRL(): ('card' | 'pix')[] {
  return ['card', 'pix'];
}
