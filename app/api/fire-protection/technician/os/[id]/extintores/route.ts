import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function createSSRClient(request: NextRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set() {},
      remove() {},
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: professionals } = await supabaseAdmin
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)

    if (!professionals?.length) {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 })
    }

    const professionalIds = professionals.map(p => p.id)

    const { data: os, error: osError } = await supabaseAdmin
      .from('service_orders')
      .select('id, asset_ids, customer_id, title')
      .eq('id', id)
      .in('professional_id', professionalIds)
      .single()

    if (osError || !os) {
      return NextResponse.json({ error: 'OS não encontrada ou sem permissão' }, { status: 404 })
    }

    const assetIds = (os.asset_ids as string[] | null) || []
    if (assetIds.length === 0) {
      return NextResponse.json({ assets: [], os: { id: os.id, title: os.title } })
    }

    const { data: assets, error } = await supabaseAdmin
      .from('assets')
      .select(`
        id, name, qr_code, agent_type, capacity,
        status, location, expiration_date,
        evolution_status, current_service_order_id,
        student_id,
        student:students(id, name, phone)
      `)
      .in('id', assetIds)

    if (error) throw error

    return NextResponse.json({
      assets: assets || [],
      os: { id: os.id, title: os.title, customer_id: os.customer_id },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
