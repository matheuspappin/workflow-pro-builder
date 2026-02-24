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

export async function GET(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const tipo = searchParams.get('tipo') // 'os' | 'vistoria' | 'all'

    // Buscar o registro de professional vinculado ao usuário
    const { data: professionals } = await supabaseAdmin
      .from('professionals')
      .select('id, studio_id, name')
      .eq('user_id', user.id)

    if (!professionals?.length) {
      return NextResponse.json([])
    }

    const professionalIds = professionals.map(p => p.id)

    let query = supabaseAdmin
      .from('service_orders')
      .select(`
        *,
        customer:students(id, name, phone, email, address),
        milestones:service_order_milestones(id, title, status, order_index, completed_at, category)
      `)
      .in('professional_id', professionalIds)
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'todos') {
      query = query.eq('status', statusFilter)
    }

    if (tipo === 'vistoria') {
      query = query.eq('project_type', 'vistoria')
    } else if (tipo === 'os') {
      query = query.neq('project_type', 'vistoria')
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
