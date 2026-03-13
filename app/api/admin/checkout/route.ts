import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import logger from '@/lib/logger';
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin';
import { checkStudioAccess } from '@/lib/auth';

/**
 * Cria uma sessão de checkout do Stripe para planos (Studio -> Plataforma)
 * Suporta: system_plans (global) e verticalization_plans (por vertical)
 * Requer: super_admin (painel admin) OU acesso ao studioId (dono/admin do studio).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, studioId } = body;
    if (!planId || !studioId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const { isAdmin } = await checkSuperAdminDetailed();
    if (!isAdmin) {
      const access = await checkStudioAccess(req, studioId);
      if (!access.authorized) return access.response;
    }

    const { success_url, cancel_url, verticalizationSlug, billingInterval = 'monthly' } = body;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const defaultSuccess = `${baseUrl}/dashboard/configuracoes?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancel = `${baseUrl}/dashboard/configuracoes?canceled=true`;

    let plan: { id: string; name: string; price: number; description?: string };
    let planType: 'system_plan' | 'verticalization_plan' = 'system_plan';
    let verticalizationPlanId: string | null = null;

    if (verticalizationSlug) {
      // Buscar plano da verticalização (por UUID ou plan_id slug)
      const { data: vertical } = await supabaseAdmin
        .from('verticalizations')
        .select('id')
        .eq('slug', verticalizationSlug)
        .maybeSingle();

      if (!vertical) {
        return NextResponse.json({ error: 'Verticalização não encontrada' }, { status: 404 });
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
      const { data: vPlan, error: vPlanError } = await supabaseAdmin
        .from('verticalization_plans')
        .select('*')
        .eq('verticalization_id', vertical.id)
        .eq('status', 'active')
        .or(isUuid ? `id.eq.${planId}` : `plan_id.eq.${planId}`)
        .maybeSingle();

      if (vPlanError || !vPlan) {
        return NextResponse.json({ error: 'Plano não encontrado nesta verticalização' }, { status: 404 });
      }

      const vPrice = billingInterval === 'yearly' && vPlan.price_annual
        ? parseFloat(vPlan.price_annual)
        : parseFloat(vPlan.price);
      plan = { id: vPlan.plan_id, name: vPlan.name, price: vPrice, description: vPlan.description };
      planType = 'verticalization_plan';
      verticalizationPlanId = vPlan.id;
    } else {
      // Buscar plano global (system_plans)
      const { data: sp, error: planError } = await supabaseAdmin
        .from('system_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !sp) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
      }
      const spPrice = billingInterval === 'yearly' && sp.price_annual
        ? parseFloat(sp.price_annual)
        : parseFloat(sp.price);
      plan = { id: sp.id, name: sp.name, price: spPrice, description: sp.description };
    }

    // Criar fatura pendente
    const invoiceParams: Record<string, unknown> = {
      p_studio_id: studioId,
      p_amount: plan.price,
      p_currency: 'BRL',
      p_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_plan_id: plan.id,
    };
    if (verticalizationPlanId) {
      invoiceParams.p_verticalization_plan_id = verticalizationPlanId;
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .rpc('create_studio_invoice', invoiceParams);

    if (invoiceError) {
      logger.error('❌ Erro ao criar fatura do estúdio:', invoiceError);
      return NextResponse.json({ error: 'Erro ao gerar fatura' }, { status: 500 });
    }

    const metadata: Record<string, string> = {
      invoice_id: invoice.id,
      studio_id: studioId,
      plan_id: plan.id,
      type: planType,
      billing_interval: billingInterval,
    };
    if (verticalizationPlanId) {
      metadata.verticalization_plan_id = verticalizationPlanId;
    }

    const planLabel = billingInterval === 'yearly' ? `${plan.name} (Anual)` : plan.name;
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${planLabel} - Workflow AI`,
              description: plan.description || '',
            },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || defaultSuccess,
      cancel_url: cancel_url || defaultCancel,
      metadata,
    });

    logger.info(`💳 Checkout criado para estúdio ${studioId} (Plano: ${plan.id}, tipo: ${planType})`);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    logger.error('💥 Erro ao criar checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
