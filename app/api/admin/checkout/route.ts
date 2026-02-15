import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/logger';

/**
 * Cria uma sessão de checkout do Stripe para planos do sistema (Studio -> Plataforma)
 * SEMPRE usa a chave do Super Admin (configurada no .env)
 */
export async function POST(req: NextRequest) {
  try {
    const { planId, studioId } = await req.json();

    if (!planId || !studioId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Buscar detalhes do plano
    const { data: plan, error: planError } = await supabase
      .from('system_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    // 2. Criar registro de fatura pendente usando RPC (para ignorar RLS no servidor se necessário)
    const { data: invoice, error: invoiceError } = await supabase
      .rpc('create_studio_invoice', {
        p_studio_id: studioId,
        p_amount: parseFloat(plan.price),
        p_currency: 'BRL',
        p_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

    if (invoiceError) {
      logger.error('❌ Erro ao criar fatura do estúdio:', invoiceError);
      return NextResponse.json({ error: 'Erro ao gerar fatura' }, { status: 500 });
    }

    // 3. Criar a sessão no Stripe usando a conta MESTRE (configurada no .env)
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${plan.name} - Workflow AI`,
              description: plan.description,
            },
            unit_amount: Math.round(parseFloat(plan.price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/configuracoes?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/configuracoes?canceled=true`,
      metadata: {
        invoice_id: invoice.id,
        studio_id: studioId,
        plan_id: planId,
        type: 'system_plan'
      },
    });

    logger.info(`💳 Checkout MESTRE criado para estúdio ${studioId} (Plano: ${planId})`);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    logger.error('💥 Erro ao criar checkout session mestre:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
