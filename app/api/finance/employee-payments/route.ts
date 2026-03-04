import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'
import logger from '@/lib/logger'

/**
 * GET - Lista profissionais (técnicos, engenheiros) com comissões pendentes e valores já pagos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const referenceMonth = searchParams.get('referenceMonth') // YYYY-MM

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const month = referenceMonth || new Date().toISOString().slice(0, 7)

    // 1. Comissões pendentes de OS
    const { data: pendingOrders } = await supabaseAdmin
      .from('service_orders')
      .select('id, tracking_code, total_amount, professional_commission_value, professional_commission_status, professional_id, finished_at')
      .eq('studio_id', studioId)
      .in('professional_commission_status', ['pending', 'approved'])
      .gt('professional_commission_value', 0)
      .not('professional_id', 'is', null)

    const { data: paidRecords } = await supabaseAdmin
      .from('employee_payments')
      .select('professional_id, amount, paid_at, source_type')
      .eq('studio_id', studioId)
      .eq('reference_month', month)

    // 3. Montar lista de profissionais: do estúdio + com OS pendentes + com pagamentos
    const { data: profByStudio } = await supabaseAdmin
      .from('professionals')
      .select('id, name, phone, email, professional_type')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('name', { ascending: true })

    const profIdsFromOrders = (pendingOrders || []).map((o: any) => o.professional_id).filter(Boolean)
    const profIdsFromPayments = (paidRecords || []).map((r: any) => r.professional_id).filter(Boolean)
    const allIds = [...new Set([...profIdsFromOrders, ...profIdsFromPayments])]
    const missingIds = allIds.filter((id: string) => !(profByStudio || []).some((p: any) => p.id === id))
    let extraProfs: any[] = []
    if (missingIds.length > 0) {
      const { data } = await supabaseAdmin.from('professionals').select('id, name, phone, email, professional_type').in('id', missingIds).eq('status', 'active')
      extraProfs = data || []
    }
    const professionals = [...(profByStudio || []), ...extraProfs].sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))

    // Agregar por profissional
    const professionalMap: Record<string, {
      id: string
      name: string
      phone?: string
      email?: string
      professional_type: string
      pendingCommission: number
      pendingOrders: any[]
      paidThisMonth: number
      payments: any[]
    }> = {}

    for (const p of professionals || []) {
      professionalMap[p.id] = {
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.email,
        professional_type: p.professional_type,
        pendingCommission: 0,
        pendingOrders: [],
        paidThisMonth: 0,
        payments: [],
      }
    }

    // Agregar comissões pendentes
    for (const o of pendingOrders || []) {
      if (o.professional_id && professionalMap[o.professional_id]) {
        const val = Number(o.professional_commission_value || 0)
        professionalMap[o.professional_id].pendingCommission += val
        professionalMap[o.professional_id].pendingOrders.push({
          id: o.id,
          tracking_code: o.tracking_code,
          total_amount: o.total_amount,
          commission_value: val,
          status: o.professional_commission_status,
          finished_at: o.finished_at,
        })
      }
    }

    // Agregar pagamentos já feitos
    for (const pay of paidRecords || []) {
      if (pay.professional_id && professionalMap[pay.professional_id]) {
        professionalMap[pay.professional_id].paidThisMonth += Number(pay.amount || 0)
        professionalMap[pay.professional_id].payments.push(pay)
      }
    }

    const result = Object.values(professionalMap)

    return NextResponse.json({ professionals: result, referenceMonth: month })
  } catch (error: any) {
    logger.error('[finance/employee-payments] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST - Registrar pagamento a funcionário
 * Body: { professional_id, amount, reference_month?, source_type?, payment_method?, notes?, service_order_ids? }
 * Se service_order_ids for passado, marca as OS como paid e opcionalmente cria employee_payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studioId,
      professional_id,
      amount,
      reference_month,
      source_type = 'mixed',
      payment_method,
      notes,
      service_order_ids,
    } = body

    if (!studioId || !professional_id || amount == null) {
      return NextResponse.json({ error: 'studioId, professional_id e amount são obrigatórios' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const month = reference_month || new Date().toISOString().slice(0, 7)
    const value = Number(amount)

    if (value <= 0) {
      return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 })
    }

    // 1. Se service_order_ids for passado, atualizar status das OS para paid
    if (service_order_ids && Array.isArray(service_order_ids) && service_order_ids.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('service_orders')
        .update({ professional_commission_status: 'paid' })
        .eq('studio_id', studioId)
        .eq('professional_id', professional_id)
        .in('id', service_order_ids)

      if (updateError) throw updateError
    }

    // 2. Inserir registro em employee_payments
    const { data: payment, error: insertError } = await supabaseAdmin
      .from('employee_payments')
      .insert({
        studio_id: studioId,
        professional_id,
        reference_month: month,
        amount: value,
        source_type: source_type || 'mixed',
        payment_method: payment_method || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ success: true, payment })
  } catch (error: any) {
    logger.error('[finance/employee-payments] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
