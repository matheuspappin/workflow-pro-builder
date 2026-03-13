import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';
import logger from '@/lib/logger';

/**
 * Cria uma sessão de checkout do Stripe para mensalidades de alunos
 */
export async function POST(req: NextRequest) {
  try {
    const { invoiceId, amount, description, studentId, studioId, type = 'student_payment' } = await req.json();

    if (!invoiceId || !amount || !studentId || !studioId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Buscar se o estúdio tem chaves próprias de Stripe
    const { data: studioKeys } = await supabase
      .from('studio_api_keys')
      .select('*')
      .eq('studio_id', studioId)
      .eq('service_name', 'stripe')
      .maybeSingle();

    let stripeClient;
    
    // Se o estúdio tiver sua própria Secret Key (salva como api_key), criamos um cliente específico
    if (studioKeys?.api_key) {
      logger.info(`💳 Usando Stripe do Admin (Estúdio: ${studioId}) - Chave personalizada`);
      stripeClient = new Stripe(studioKeys.api_key, {
        apiVersion: '2025-01-27.acacia' as any,
        typescript: true,
      });
    } else {
      logger.info(`💳 Usando Stripe Global do Workflow AI (Fallback)`);
      stripeClient = getStripe();
    }

    // 2. Criar a sessão no Stripe (card + PIX para contas BR elegíveis)
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: type === 'package' ? description : `Mensalidade - ${description || 'Estúdio de Dança'}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/payments?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/payments?canceled=true`,
      metadata: {
        invoice_id: invoiceId,
        student_id: studentId,
        studio_id: studioId,
        type: type // 'student_payment' ou 'package'
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    logger.error('💥 Erro ao criar checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
