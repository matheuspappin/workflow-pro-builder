import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

// Laudos são armazenados em service_orders com project_type = 'laudo'
// Status mapeados: open=draft, in_progress=review, approved=approved (observations), finished=issued
const STATUS_MAP: Record<string, string> = {
  open: 'draft',
  in_progress: 'review',
  finished: 'issued',
  cancelled: 'cancelled',
  approved: 'approved',
}

const STATUS_REVERSE: Record<string, string> = {
  draft: 'open',
  review: 'in_progress',
  issued: 'finished',
  cancelled: 'cancelled',
  approved: 'in_progress', // approved fica em review até emitir
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
        status,
        observations,
        created_at,
        finished_at,
        customer:students(id, name),
        professional:professionals!professional_id(id, name)
      `)
      .eq('studio_id', studioId)
      .eq('project_type', 'laudo')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      const dbStatus = STATUS_REVERSE[status] || status
      query = query.eq('status', dbStatus)
    }

    const { data, error } = await query
    if (error) throw error

    const mapped = (data || []).map((l: any) => {
      let meta: Record<string, any> = {}
      try { meta = JSON.parse(l.observations || '{}') } catch {}

      // status 'approved' fica salvo em metadata
      const rawStatus = meta.laudo_status || l.status
      const mappedStatus = STATUS_MAP[rawStatus] || rawStatus

      return {
        id: l.id,
        code: `LT-${l.id.slice(0, 6).toUpperCase()}`,
        title: l.title || 'Laudo Técnico',
        client: l.customer?.name || meta.client || '',
        client_id: l.customer?.id || null,
        property: meta.property || '',
        type: meta.laudo_type || 'car',
        status: mappedStatus,
        engineer: l.professional?.name || meta.engineer || '',
        professional_id: l.professional?.id || null,
        art: meta.art || '',
        date: new Date(l.created_at).toLocaleDateString('pt-BR'),
        issued_at: l.finished_at ? new Date(l.finished_at).toLocaleDateString('pt-BR') : null,
        description: l.description || '',
        created_at: l.created_at,
      }
    })

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
      title, client, client_id, customer_id,
      property, type = 'car',
      engineer, professional_id,
      art, description,
    } = body

    const sid = studioId || studio_id
    if (!sid) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 })
    }

    // Resolve customer_id
    let resolvedCustomerId = customer_id || client_id || null
    if (!resolvedCustomerId && client) {
      const { data: found } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('studio_id', sid)
        .ilike('name', `%${client}%`)
        .maybeSingle()
      resolvedCustomerId = found?.id || null
    }

    // Resolve professional_id
    let resolvedProfId = professional_id || null
    if (!resolvedProfId && engineer) {
      const { data: found } = await supabaseAdmin
        .from('professionals')
        .select('id')
        .eq('studio_id', sid)
        .ilike('name', `%${engineer}%`)
        .maybeSingle()
      resolvedProfId = found?.id || null
    }

    const observations = JSON.stringify({
      laudo_type: type,
      property: property || '',
      engineer: engineer || '',
      art: art || '',
      client: client || '',
      laudo_status: 'open', // draft initially
    })

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .insert({
        studio_id: sid,
        customer_id: resolvedCustomerId,
        professional_id: resolvedProfId,
        title,
        description: description || null,
        project_type: 'laudo',
        status: 'open',
        priority: 'normal',
        observations,
      })
      .select('id, title, status, created_at, observations, customer:students(id, name), professional:professionals!professional_id(id, name)')
      .single()

    if (error) throw error

    let meta: Record<string, any> = {}
    try { meta = JSON.parse(data.observations || '{}') } catch {}

    return NextResponse.json({
      id: data.id,
      code: `LT-${data.id.slice(0, 6).toUpperCase()}`,
      title: data.title,
      client: (data.customer as any)?.name || client || '',
      property: meta.property || '',
      type: meta.laudo_type || type,
      status: 'draft',
      engineer: (data.professional as any)?.name || engineer || '',
      art: meta.art || '',
      date: new Date(data.created_at).toLocaleDateString('pt-BR'),
      created_at: data.created_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
