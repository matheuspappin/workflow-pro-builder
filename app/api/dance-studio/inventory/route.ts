import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkStudioAccess } from '@/lib/auth'
import logger from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * GET /api/dance-studio/inventory?studioId=...
 * Retorna produtos ativos para PDV (sem guardModule - usa checkStudioAccess)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')
  const sku = searchParams.get('sku')

  if (!studioId) {
    return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    if (sku) {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('studio_id', studioId)
        .eq('sku', sku)
        .eq('status', 'active')
        .maybeSingle()

      if (error) throw error
      return NextResponse.json(product)
    }

    const [productsRes, pendingOSRes] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('studio_id', studioId)
        .eq('status', 'active')
        .order('name', { ascending: true }),
      supabase
        .from('service_orders')
        .select(`
          id, tracking_code, total_amount, status, customer_id,
          customer:students(id, name)
        `)
        .eq('studio_id', studioId)
        .eq('payment_status', 'pending')
        .in('status', ['finished', 'in_progress', 'open'])
        .order('created_at', { ascending: false }),
    ])

    if (productsRes.error) throw productsRes.error

    const products = productsRes.data || []
    const totalItems = products.reduce((acc, p) => acc + p.quantity, 0)
    const totalCostValue = products.reduce((acc, p) => acc + p.quantity * (p.cost_price || 0), 0)
    const totalSalesValue = products.reduce((acc, p) => acc + p.quantity * (p.selling_price || 0), 0)

    return NextResponse.json({
      products,
      stats: {
        totalItems,
        totalCostValue,
        totalSalesValue,
        potentialProfit: totalSalesValue - totalCostValue,
      },
      pendingOS: pendingOSRes.data || [],
    })
  } catch (error: unknown) {
    logger.error('❌ [DANCE-STUDIO/INVENTORY] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar inventário' },
      { status: 500 }
    )
  }
}
