import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 30)
    const offset = (page - 1) * limit

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data, error, count } = await supabaseAdmin
      .from('service_orders')
      .select(`
        id, tracking_code, title, total_amount, discount_amount,
        payment_method, payment_status, paid_at, change_amount,
        created_at, finished_at,
        customer:students(id, name, phone),
        professional:professionals(id, name),
        items:service_order_items(id, description, item_type, quantity, unit_price, subtotal)
      `, { count: 'exact' })
      .eq('studio_id', studioId)
      .eq('project_type', 'pdv')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ sales: data || [], total: count ?? 0, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
