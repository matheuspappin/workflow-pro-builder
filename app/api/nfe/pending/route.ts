import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { guardModule } from '@/lib/modules-server'

/**
 * API NF-e — Lista itens pendentes de emissão
 * Módulo fiscal independente — agrega service_orders (PDV), erp_orders e package_purchase (compra de créditos DanceFlow)
 */
export async function GET(request: NextRequest) {
  try {
    const { studioId } = await guardModule('fiscal')

    const { searchParams } = new URL(request.url)
    const sid = searchParams.get('studioId') || studioId
    if (!sid || sid !== studioId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // 1. Pendentes de service_orders (PDV) — pagas, sem nota em financial_notes
    const { data: emittedSO } = await supabaseAdmin
      .from('financial_notes')
      .select('source_id')
      .eq('studio_id', sid)
      .eq('source_type', 'service_order')
      .eq('status', 'emitted')

    const emittedSOIds = new Set((emittedSO || []).map((n: any) => n.source_id))

    // PDV (project_type='pdv') + OS comuns pagas (project_type='common' - Estúdio de Dança)
    const { data: pendingSO } = await supabaseAdmin
      .from('service_orders')
      .select('id, tracking_code, title, total_amount, discount_amount, payment_status, paid_at, created_at, customer:students(id, name, phone, email)')
      .eq('studio_id', sid)
      .in('project_type', ['pdv', 'common'])
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(100)

    const serviceOrders = (pendingSO || []).filter((o: any) => !emittedSOIds.has(o.id)).map((o: any) => ({
      id: o.id,
      source_type: 'service_order' as const,
      external_id: o.tracking_code || o.id?.slice(0, 8),
      customer_name: (() => {
        const c = Array.isArray(o.customer) ? o.customer[0] : o.customer
        return c?.name || 'Cliente'
      })(),
      total_amount: Number(o.total_amount || 0) - Number(o.discount_amount || 0),
      status: o.payment_status,
      created_at: o.created_at,
    }))

    // 2. Pendentes de erp_orders — paid/shipped, sem nota em invoices
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('order_id')
      .eq('studio_id', sid)

    const emittedOrderIds = new Set((invoices || []).map((i: any) => i.order_id))

    const { data: pendingOrders } = await supabaseAdmin
      .from('erp_orders')
      .select('id, external_id, customer_name, total_amount, status, created_at')
      .eq('studio_id', sid)
      .in('status', ['paid', 'shipped'])
      .order('created_at', { ascending: true })
      .limit(100)

    const erpOrders = (pendingOrders || []).filter((o: any) => !emittedOrderIds.has(o.id)).map((o: any) => ({
      id: o.id,
      source_type: 'erp_order' as const,
      external_id: o.external_id || o.id?.slice(0, 8),
      customer_name: o.customer_name || 'Cliente',
      total_amount: Number(o.total_amount || 0),
      status: o.status,
      created_at: o.created_at,
    }))

    // 3. Pendentes de package_purchase (compra de créditos DanceFlow) — pagos, sem nota em financial_notes
    const { data: emittedPkg } = await supabaseAdmin
      .from('financial_notes')
      .select('source_id')
      .eq('studio_id', sid)
      .eq('source_type', 'package_purchase')
      .eq('status', 'emitted')

    const emittedPkgIds = new Set((emittedPkg || []).map((n: any) => n.source_id))

    const { data: pendingPayments } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        amount,
        description,
        created_at,
        student:students(id, name)
      `)
      .eq('studio_id', sid)
      .eq('payment_source', 'package_purchase')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(100)

    const packagePurchases = (pendingPayments || [])
      .filter((p: any) => !emittedPkgIds.has(p.id))
      .map((p: any) => {
        const student = Array.isArray(p.student) ? p.student[0] : p.student
        return {
          id: p.id,
          source_type: 'package_purchase' as const,
          external_id: p.id?.slice(0, 8),
          customer_name: student?.name || 'Cliente',
          total_amount: Number(p.amount || 0),
          status: 'paid',
          created_at: p.created_at,
        }
      })

    const pending = [...serviceOrders, ...erpOrders, ...packagePurchases].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ success: true, pending })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar pendentes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
