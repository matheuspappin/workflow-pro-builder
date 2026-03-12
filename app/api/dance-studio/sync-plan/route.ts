import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'
import logger from '@/lib/logger'

/**
 * POST /api/dance-studio/sync-plan
 * Sincroniza o plano do estúdio a partir da última fatura paga.
 * Usado quando o webhook/verify falharam e o plano exibido não corresponde às faturas.
 * Não requer auth de super admin - qualquer estúdio pode sincronizar seu próprio plano.
 */
export async function POST(req: NextRequest) {
  try {
    const { studioId } = await req.json()
    if (!studioId || typeof studioId !== 'string') {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(req, studioId)
    if (!access.authorized) return access.response

    const { data, error } = await supabaseAdmin.rpc('sync_studio_plan_from_latest_invoice', {
      p_studio_id: studioId,
    })
    if (error) {
      const isFunctionMissing =
        error.message?.toLowerCase().includes('function') &&
        (error.message?.includes('does not exist') || error.message?.includes('not found'))
      if (isFunctionMissing) {
        return syncPlanFallback(studioId)
      }
      logger.error('❌ Erro ao sincronizar plano a partir da fatura:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Erro ao sincronizar plano' },
        { status: 500 }
      )
    }

    const result = data as { success?: boolean; message?: string; plan_id?: string } | null
    if (!result || !result.success) {
      return NextResponse.json({
        success: false,
        error: result?.message || 'Não foi possível sincronizar o plano',
      })
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Plano sincronizado com sucesso',
      plan_id: result.plan_id,
    })
  } catch (error: any) {
    logger.error('💥 Erro ao sincronizar plano:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

/** Fallback: sincroniza quando a RPC não existe (migration não aplicada) */
async function syncPlanFallback(studioId: string) {
  try {
    const { data: invoices } = await supabaseAdmin
      .from('studio_invoices')
      .select('id, amount, plan_id')
      .eq('studio_id', studioId)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(1)

    const invoice = invoices?.[0]
    if (!invoice) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma fatura paga encontrada',
      })
    }

    let planId = invoice.plan_id
    if (!planId) {
      const { data: plans } = await supabaseAdmin
        .from('system_plans')
        .select('id, price')
        .eq('status', 'active')
        .gt('price', 0)

      const amount = Number(invoice.amount)
      const match = plans?.find((p) => Math.abs(Number(p.price) - amount) < 0.5)
      if (!match) {
        return NextResponse.json({
          success: false,
          error: `Não foi possível identificar o plano pela fatura (valor: R$ ${amount.toFixed(2)})`,
        })
      }
      planId = match.id

      await supabaseAdmin
        .from('studio_invoices')
        .update({ plan_id: planId })
        .eq('id', invoice.id)
    }

    const { error: updateError } = await supabaseAdmin
      .from('studios')
      .update({
        plan: planId,
        subscription_status: 'active',
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', studioId)

    if (updateError) {
      logger.error('❌ Erro ao atualizar estúdio:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    // Sincronizar enabled_modules com os módulos do plano (quando migration 101 não aplicada)
    const { data: planData } = await supabaseAdmin
      .from('system_plans')
      .select('modules')
      .eq('id', planId)
      .maybeSingle()
    if (planData?.modules && typeof planData.modules === 'object' && Object.keys(planData.modules).length > 0) {
      await supabaseAdmin
        .from('organization_settings')
        .update({
          enabled_modules: planData.modules,
          updated_at: new Date().toISOString(),
        })
        .eq('studio_id', studioId)
    }

    return NextResponse.json({
      success: true,
      message: 'Plano sincronizado com sucesso',
      plan_id: planId,
    })
  } catch (e: any) {
    logger.error('💥 Erro no fallback sync:', e)
    return NextResponse.json(
      { success: false, error: e.message || 'Erro ao sincronizar' },
      { status: 500 }
    )
  }
}
