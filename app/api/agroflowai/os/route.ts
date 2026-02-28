import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

// Tipos de OS ambientais mapeados como project_type no service_orders
const AGRO_OS_TYPES = ['laudo_car', 'vistoria_ndvi', 'regularizacao', 'licenciamento', 'monitoramento', 'outro', 'environmental_os']

const STATUS_MAP: Record<string, string> = {
  open: 'pending',
  in_progress: 'in_progress',
  finished: 'completed',
  cancelled: 'cancelled',
}

const STATUS_REVERSE: Record<string, string> = {
  pending: 'open',
  in_progress: 'in_progress',
  completed: 'finished',
  cancelled: 'cancelled',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const status = searchParams.get('status')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    let query = supabaseAdmin
      .from('service_orders')
      .select(`
        id,
        title,
        description,
        project_type,
        status,
        priority,
        scheduled_at,
        created_at,
        observations,
        customer:students(id, name, phone, email),
        professional:professionals!professional_id(id, name)
      `)
      .eq('studio_id', studioId)
      .in('project_type', AGRO_OS_TYPES)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      const dbStatus = STATUS_REVERSE[status] || status
      query = query.eq('status', dbStatus)
    }

    const { data, error } = await query
    if (error) throw error

    const mapped = (data || []).map((os: any) => ({
      id: os.id,
      code: `OS-${os.id.slice(0, 6).toUpperCase()}`,
      client_name: os.customer?.name || 'Cliente',
      client_id: os.customer?.id || null,
      property_name: (() => {
        try { return JSON.parse(os.observations || '{}').property_name || '' } catch { return '' }
      })(),
      type: os.project_type || 'outro',
      status: STATUS_MAP[os.status] || os.status,
      assigned_to: os.professional?.name || null,
      professional_id: os.professional?.id || null,
      scheduled_date: os.scheduled_at
        ? new Date(os.scheduled_at).toLocaleDateString('pt-BR')
        : null,
      description: os.description || '',
      created_at: os.created_at,
    }))

    return NextResponse.json(mapped)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studioId, studio_id,
      client_name, client_id, customer_id,
      property_name, type = 'outro',
      description, scheduled_date,
      assigned_to, professional_id,
    } = body

    const sid = studioId || studio_id
    const access = await checkStudioAccess(request, sid)
    if (!access.authorized) return access.response

    // Resolve customer_id via nome se não vier id
    let resolvedCustomerId = customer_id || client_id || null
    if (!resolvedCustomerId && client_name) {
      const { data: found } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('studio_id', sid)
        .ilike('name', `%${client_name}%`)
        .maybeSingle()
      resolvedCustomerId = found?.id || null
    }

    // Resolve professional_id via nome se não vier id
    let resolvedProfId = professional_id || null
    if (!resolvedProfId && assigned_to) {
      const { data: found } = await supabaseAdmin
        .from('professionals')
        .select('id')
        .eq('studio_id', sid)
        .ilike('name', `%${assigned_to}%`)
        .maybeSingle()
      resolvedProfId = found?.id || null
    }

    const observations = JSON.stringify({
      property_name: property_name || '',
      assigned_to_name: assigned_to || '',
    })

    const title = client_name
      ? `${client_name}${property_name ? ` — ${property_name}` : ''}`
      : 'Nova OS Ambiental'

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .insert({
        studio_id: sid,
        customer_id: resolvedCustomerId,
        professional_id: resolvedProfId,
        title,
        description: description || null,
        project_type: AGRO_OS_TYPES.includes(type) ? type : 'outro',
        scheduled_at: scheduled_date ? new Date(scheduled_date).toISOString() : null,
        status: 'open',
        priority: 'normal',
        observations,
      })
      .select(`
        id, title, project_type, status, scheduled_at, created_at, observations,
        customer:students(id, name),
        professional:professionals!professional_id(id, name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({
      id: data.id,
      code: `OS-${data.id.slice(0, 6).toUpperCase()}`,
      client_name: (data.customer as any)?.name || client_name || '',
      property_name: property_name || '',
      type: data.project_type,
      status: 'pending',
      assigned_to: (data.professional as any)?.name || assigned_to || null,
      scheduled_date: scheduled_date || null,
      created_at: data.created_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
