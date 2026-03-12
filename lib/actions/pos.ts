'use server';

import { createClient } from '@/lib/supabase/server';
import { getPaymentRequirement, getPaymentStrategy } from '@/lib/strategies/payment';
import { PaymentItem, PaymentResult } from '@/lib/strategies/payment/types';
import { getStripe } from '@/lib/stripe';

export async function processPosPayment(
  studioId: string, 
  studentId: string | null, 
  items: PaymentItem[], 
  paymentMethod: string
): Promise<PaymentResult> {
  const supabase = await createClient();
  
  // 1. Get the Business Model
  let model = await getPaymentRequirement(studioId, supabase);

  // Se o método for explicitamente crédito, forçar CREDIT
  if (paymentMethod?.toLowerCase() === 'credit') {
    model = 'CREDIT';
  }
  // Se o método for dinheiro, pix ou cartão, é MONETARY
  else if (['cash', 'money', 'dinheiro', 'card', 'credit_card', 'debit_card', 'pix'].includes(paymentMethod?.toLowerCase())) {
    model = 'MONETARY';
  }

  // Se não tem studentId, não pode ser CREDIT (crédito exige um aluno para debitar)
  if (!studentId && model === 'CREDIT') {
    return {
      success: false,
      message: 'Venda a crédito exige um cliente selecionado. Para venda avulsa, use um método de pagamento monetário.'
    };
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

export async function createPosStripeSession(
  studioId: string,
  studentId: string | null,
  items: PaymentItem[],
  method: 'card' | 'pix',
  origin: string,
  returnPath: string = '/dashboard/vendas'
) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe não configurado");

  const supabase = await createClient();
  
  // Buscar informações do estúdio para o sucesso/erro
  const { data: studio } = await supabase
    .from('studios')
    .select('name, slug')
    .eq('id', studioId)
    .single();

  const totalAmount = items.reduce((acc, item) => acc + (item.priceInCurrency * item.quantity), 0);

  // Criar itens para o Stripe
  const lineItems = items.map(item => ({
    price_data: {
      currency: 'brl',
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(item.priceInCurrency * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: method === 'pix' ? ['pix'] : ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${origin}${returnPath}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${returnPath}?canceled=true`,
    metadata: {
      studio_id: studioId,
      student_id: studentId || '',
      type: 'pos_sale',
      items_json: JSON.stringify(items.map(i => ({ id: i.id, quantity: i.quantity, type: i.type, name: i.name, price: i.priceInCurrency }))),
      payment_method: method
    },
  });

  return { url: session.url };
}

export async function getStudioBusinessModel(studioId: string) {
  const supabase = await createClient();
  return await getPaymentRequirement(studioId, supabase);
}

/** Taxa de conversão R$ → créditos: MIN(price/lessons_count) dos pacotes ativos. Fallback: 70 */
export async function getPdvCreditConversionRate(studioId: string): Promise<number> {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from('lesson_packages')
    .select('price, lessons_count')
    .eq('studio_id', studioId)
    .eq('is_active', true);

  if (packages?.length) {
    const rates = packages.map(p => (p.price || 0) / Math.max(1, p.lessons_count || 1));
    return Math.min(...rates);
  }

  const { data: setting } = await supabase
    .from('studio_settings')
    .select('setting_value')
    .eq('studio_id', studioId)
    .eq('setting_key', 'pdv_credit_reais_per_unit')
    .maybeSingle();

  return setting?.setting_value ? parseFloat(setting.setting_value) : 70;
}

/** Saldo de créditos do aluno para exibir no PDV */
export async function getStudentCredits(studentId: string, studioId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('student_lesson_credits')
    .select('remaining_credits')
    .eq('student_id', studentId)
    .eq('studio_id', studioId)
    .maybeSingle();

  return Number(data?.remaining_credits ?? 0);
}
