import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

const STATUS_REVERSE: Record<string, string> = {
  pending: 'open',
  in_progress: 'in_progress',
  completed: 'finished',
  cancelled: 'cancelled',
}

const STATUS_MAP: Record<string, string> = {
  open: 'pending',
  in_progress: 'in_progress',
  finished: 'completed',
  cancelled: 'cancelled',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .select(`
        *,
        customer:students(id, name, phone, email, address),
        professional:professionals!professional_id(id, name, phone)
      `)
      .eq('id', id)
      .eq('studio_id', studioId)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 })

    let observations: Record<string, any> = {}
    try { observations = JSON.parse(data.observations || '{}') } catch {}

    return NextResponse.json({
      ...data,
      status: STATUS_MAP[data.status] || data.status,
      observations_raw: observations,
      property_name: observations.property_name || '',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { studioId, studio_id, status, description, scheduled_date, assigned_to, professional_id, property_name } = body

    const sid = studioId || studio_id
    if (!sid) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const accessPatch = await checkStudioAccess(request, sid)
    if (!accessPatch.authorized) return accessPatch.response

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }

    if (status !== undefined) {
      updatePayload.status = STATUS_REVERSE[status] || status
      if (status === 'completed' || status === 'cancelled') {
        updatePayload.finished_at = new Date().toISOString()
      }
      if (status === 'in_progress') {
        updatePayload.opened_at = new Date().toISOString()
      }
    }
    if (description !== undefined) updatePayload.description = description
    if (scheduled_date !== undefined) updatePayload.scheduled_at = scheduled_date ? new Date(scheduled_date).toISOString() : null
    if (professional_id !== undefined) updatePayload.professional_id = professional_id

    if (property_name !== undefined || assigned_to !== undefined) {
      const { data: current } = await supabaseAdmin
        .from('service_orders')
        .select('observations')
        .eq('id', id)
        .single()
      let obs: Record<string, any> = {}
      try { obs = JSON.parse(current?.observations || '{}') } catch {}
      if (property_name !== undefined) obs.property_name = property_name
      if (assigned_to !== undefined) obs.assigned_to_name = assigned_to
      updatePayload.observations = JSON.stringify(obs)
    }

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .update(updatePayload)
      .eq('id', id)
      .eq('studio_id', sid)
      .select(`
        id, title, project_type, status, updated_at,
        customer:students(id, name),
        professional:professionals!professional_id(id, name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({
      ...data,
      status: STATUS_MAP[data.status] || data.status,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })

    const accessDel = await checkStudioAccess(request, studioId)
    if (!accessDel.authorized) return accessDel.response

    const now = new Date().toISOString()
    const { error } = await supabaseAdmin
      .from('service_orders')
      .update({ status: 'cancelled', finished_at: now, updated_at: now })
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
