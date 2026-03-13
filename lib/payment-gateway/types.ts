/**
 * Tipos para abstração de gateways de pagamento.
 * Permite trocar Stripe por Asaas/Pagar.me no futuro sem alterar as rotas.
 */

export type PaymentMethod = 'card' | 'pix';

export interface CreateCheckoutParams {
  amount: number; // em centavos
  currency: 'brl';
  description: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  paymentMethods?: PaymentMethod[];
  customerEmail?: string;
}

export interface CreateCheckoutResult {
  url: string;
  sessionId?: string;
}

export interface PaymentGateway {
  /** Nome do provedor (stripe, asaas, pagarme) */
  name: string;
  /** Cria sessão de checkout e retorna URL de redirecionamento */
  createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult>;
}
