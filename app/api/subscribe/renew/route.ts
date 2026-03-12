import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'
import logger from '@/lib/logger'

/**
 * Cria sessão de checkout para renovação de assinatura (estúdio inativo/trial expirado).
 * Verifica que o usuário autenticado é o dono do estúdio antes de criar o checkout.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { studioId, planId = 'pro' } = await req.json()

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    // Verificar que o usuário é o dono do estúdio (permite estúdio inativo)
    const { data: studio, error: studioError } = await supabaseAdmin
      .from('studios')
      .select('id, owner_id, verticalization_id')
      .eq('id', studioId)
      .maybeSingle()

    if (studioError || !studio) {
      return NextResponse.json({ error: 'Estúdio não encontrado' }, { status: 404 })
    }

    if (studio.owner_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão para renovar este estúdio' }, { status: 403 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const successUrl = `${baseUrl}/dashboard/configuracoes?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/subscription-expired?canceled=true`

    let plan: { id: string; name: string; price: number; description?: string } | undefined
    let planType: 'system_plan' | 'verticalization_plan' = 'system_plan'
    let verticalizationPlanId: string | null = null

    if (studio.verticalization_id) {
      const { data: vert } = await supabaseAdmin
        .from('verticalizations')
        .select('id, slug')
        .eq('id', studio.verticalization_id)
        .maybeSingle()

      if (vert) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId)
        const { data: vPlan, error: vPlanError } = await supabaseAdmin
          .from('verticalization_plans')
          .select('*')
          .eq('verticalization_id', vert.id)
          .eq('status', 'active')
          .or(isUuid ? `id.eq.${planId}` : `plan_id.eq.${planId}`)
          .maybeSingle()

        if (!vPlanError && vPlan) {
          plan = { id: vPlan.plan_id, name: vPlan.name, price: parseFloat(vPlan.price), description: vPlan.description }
          planType = 'verticalization_plan'
          verticalizationPlanId = vPlan.id
        }
      }
    }

    if (!plan) {
      const { data: sp, error: planError } = await supabaseAdmin
        .from('system_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle()

      if (planError || !sp) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
      }
      plan = { id: sp.id, name: sp.name, price: parseFloat(sp.price), description: sp.description }
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    const invoiceParams: Record<string, unknown> = {
      p_studio_id: studioId,
      p_amount: plan.price,
      p_currency: 'BRL',
      p_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_plan_id: plan.id,
    }
    if (verticalizationPlanId) {
      invoiceParams.p_verticalization_plan_id = verticalizationPlanId
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin.rpc('create_studio_invoice', invoiceParams)

    if (invoiceError) {
      logger.error('❌ Erro ao criar fatura na renovação:', invoiceError)
      return NextResponse.json({ error: 'Erro ao gerar fatura' }, { status: 500 })
    }

    const metadata: Record<string, string> = {
      invoice_id: invoice.id,
      studio_id: studioId,
      plan_id: plan.id,
      type: planType,
    }
    if (verticalizationPlanId) {
      metadata.verticalization_plan_id = verticalizationPlanId
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${plan.name} - Workflow AI`,
              description: plan.description || '',
            },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    })

    logger.info(`🔄 Renovação: checkout criado para estúdio ${studioId} por user ${user.id}`)
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    logger.error('💥 Erro ao criar renovação:', error)
    return NextResponse.json({ error: error.message || 'Erro ao processar renovação' }, { status: 500 })
  }
}
