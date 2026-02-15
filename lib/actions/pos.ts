'use server';

import { createClient } from '@/lib/supabase/server';
import { getPaymentRequirement, getPaymentStrategy } from '@/lib/strategies/payment';
import { PaymentItem, PaymentResult } from '@/lib/strategies/payment/types';

export async function processPosPayment(
  studioId: string, 
  studentId: string | null, 
  items: PaymentItem[], 
  paymentMethod: string
): Promise<PaymentResult> {
  const supabase = await createClient();
  
  // 1. Get the Business Model
  let model = await getPaymentRequirement(studioId, supabase);

  // Override strategy based on payment method selection
  // If the user selected a monetary payment method, we force the MONETARY strategy
  // regardless of the studio's default business model.
  const monetaryMethods = ['cash', 'money', 'dinheiro', 'card', 'credit_card', 'debit_card', 'pix'];
  if (monetaryMethods.includes(paymentMethod?.toLowerCase())) {
    model = 'MONETARY';
  }
  
  // 2. Get the Strategy
  const strategy = getPaymentStrategy(model, supabase);
  
  // 3. Prepare Context
  const context = {
    studioId,
    studentId,
    items,
    paymentMethod,
  };

  // 4. Validate
  const isValid = await strategy.validate(context);
  if (!isValid) {
    return { 
      success: false, 
      message: model === 'CREDIT' ? 'Saldo insuficiente de créditos.' : 'Erro na validação do pagamento.' 
    };
  }

  // 5. Process
  return await strategy.process(context);
}

export async function getStudioBusinessModel(studioId: string) {
  const supabase = await createClient();
  return await getPaymentRequirement(studioId, supabase);
}
