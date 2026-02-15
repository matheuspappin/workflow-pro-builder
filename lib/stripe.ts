import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Inicializamos o Stripe apenas se a chave estiver presente para evitar erros durante o build do Next.js
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia' as any,
      appInfo: {
        name: 'Workflow AI',
        version: '0.1.0',
      },
    })
  : null;

// Helper para garantir que o Stripe está configurado antes de usar
export function getStripe() {
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY is missing. Please configure it in your environment variables.');
  }
  return stripe;
}
