import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const limit = Number(searchParams.get('limit') ?? 20)

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .select(`
        *,
        customer:students(id, name, phone),
        professional:professionals(id, name),
        items:service_order_items(
          id, description, item_type, quantity, unit_price, subtotal
        )
      `)
      .eq('studio_id', studioId)
      .eq('project_type', 'pdv')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studio_id,
      customer_id,
      seller_id,
      items,            // Array de { id, name, item_type, quantity, unit_price }
      payment_method,   // 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | null para pendente
      amount_paid,      // Valor recebido (para calcular troco)
      discount_amount = 0,
      observations,
      schedule_reminder, // { type: 'payment_pending' | 'follow_up', days: number }
    } = body

    if (!studio_id || !items?.length) {
      return NextResponse.json({ error: 'studio_id e items são obrigatórios' }, { status: 400 })
    }

    const accessPost = await checkStudioAccess(request, studio_id)
    if (!accessPost.authorized) return accessPost.response

    // Calcular totais
    const totalItems = items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0)
    const totalAmount = Math.max(0, totalItems - discount_amount)
    const changeAmount = Math.max(0, (amount_paid ?? 0) - totalAmount)

    // Criar OS com project_type = 'pdv'
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('service_orders')
      .insert({
        studio_id,
        customer_id: customer_id || null,
        professional_id: seller_id || null,
        seller_id: seller_id || null,
        project_type: 'pdv',
        title: `Venda PDV — ${new Date().toLocaleDateString('pt-BR')}`,
        description: observations || null,
        status: 'finished',
        payment_method: (payment_method && payment_method !== 'pagar_depois') ? payment_method : null,
        payment_status: (payment_method && payment_method !== 'pagar_depois') ? 'paid' : 'pending',
        paid_at: (payment_method && payment_method !== 'pagar_depois') ? new Date().toISOString() : null,
        amount_paid: amount_paid || totalAmount,
        discount_amount,
        change_amount: changeAmount,
        total_products: items.filter((i: any) => i.item_type === 'product')
          .reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0),
        total_services: items.filter((i: any) => i.item_type === 'service')
          .reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0),
        total_amount: totalAmount,
        finished_at: new Date().toISOString(),
      })
      .select('id, tracking_code, total_amount, payment_method, change_amount')
      .single()

    if (saleError) throw saleError

    // Inserir itens da venda
    const orderItems = items.map((item: any) => ({
      studio_id,
      service_order_id: sale.id,
      item_type: item.item_type,
      description: item.name,
      product_id: item.item_type === 'product' && !item.is_default ? item.id : null,
      service_id: item.item_type === 'service' && !item.is_default ? item.id : null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('service_order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Criar lembrete agendado se solicitado
    if (schedule_reminder?.type && customer_id && schedule_reminder.days > 0) {
      const scheduledAt = new Date()
      scheduledAt.setDate(scheduledAt.getDate() + schedule_reminder.days)
      await supabaseAdmin.from('sale_reminders').insert({
        studio_id,
        service_order_id: sale.id,
        customer_id,
        reminder_type: schedule_reminder.type,
        scheduled_at: scheduledAt.toISOString(),
        channel: 'whatsapp',
      })
    }

    // Dar baixa no estoque de produtos (apenas produtos reais do studio, não defaults)
    const realProducts = items.filter((i: any) => i.item_type === 'product' && !i.is_default)
    for (const product of realProducts) {
      await supabaseAdmin
        .from('stock_movements')
        .insert({
          studio_id,
          product_id: product.id,
          type: 'exit',
          quantity: product.quantity,
          reason: 'Venda PDV',
          reference_id: sale.id,
        })
      await supabaseAdmin
        .from('products')
        .update({ current_stock: supabaseAdmin.rpc('greatest', { a: 0, b: 0 }) })
        .eq('id', product.id)
        .eq('studio_id', studio_id)
    }

    return NextResponse.json({
      ...sale,
      items,
      total_amount: totalAmount,
      discount_amount,
      change_amount: changeAmount,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
