'use server'

import { getStripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

interface CheckoutItem {
  name: string
  amount: number // em centavos
  quantity: number
}

interface CheckoutSessionParams {
  items: CheckoutItem[]
  customerEmail: string
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession({
  items,
  customerEmail,
  successUrl,
  cancelUrl,
}: CheckoutSessionParams) {
  // Esta função cria uma sessão de checkout no Stripe.
  // Ela recebe uma lista de itens, o e-mail do cliente e URLs de sucesso/cancelamento.
  // O Stripe processa o pagamento e redireciona o usuário para as URLs especificadas.
  // Em caso de erro, um log é gerado e uma exceção é lançada.
  try {
    const stripe = getStripe()

    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY in your .env file.')
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.name,
        },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
    })

    return { url: session.url }
  } catch (error: any) {
    logger.error('Erro ao criar sessão de checkout Stripe:', error)
    throw new Error(`Falha ao criar sessão de checkout: ${error.message}`)
  }
}
