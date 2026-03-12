import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const status = searchParams.get('status')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    let query = supabaseAdmin
      .from('service_orders')
      .select(`
        *,
        customer:students(id, name, phone),
        professional:professionals(id, name)
      `)
      .eq('studio_id', studioId)
      .neq('project_type', 'vistoria')
      .order('created_at', { ascending: false })

    if (status && status !== 'todos') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
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
      studio_id, customer_id, professional_id,
      title, description, observations,
      project_type = 'common', scheduled_at, priority = 'normal',
    } = body

    if (!studio_id || !title) {
      return NextResponse.json({ error: 'studio_id e title são obrigatórios' }, { status: 400 })
    }

    const accessPost = await checkStudioAccess(request, studio_id)
    if (!accessPost.authorized) return accessPost.response

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .insert({
        studio_id,
        customer_id: customer_id || null,
        professional_id: professional_id || null,
        title,
        description,
        observations,
        project_type,
        scheduled_at: scheduled_at || null,
        priority,
        status: 'open',
      })
      .select(`
        *,
        customer:students(id, name, phone),
        professional:professionals(id, name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
