import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

const STATUS_REVERSE: Record<string, string> = {
  draft: 'open',
  review: 'in_progress',
  approved: 'in_progress',
  issued: 'finished',
  cancelled: 'cancelled',
}

const STATUS_MAP: Record<string, string> = {
  open: 'draft',
  in_progress: 'review',
  finished: 'issued',
  cancelled: 'cancelled',
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { studioId, studio_id, status, art, engineer } = body

    const sid = studioId || studio_id
    if (!sid) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })

    const access = await checkStudioAccess(request, sid)
    if (!access.authorized) return access.response

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }

    if (status !== undefined) {
      updatePayload.status = STATUS_REVERSE[status] || status
      if (status === 'issued') {
        updatePayload.finished_at = new Date().toISOString()
      }
    }

    // Update metadata fields (art, engineer)
    if (art !== undefined || engineer !== undefined) {
      const { data: current } = await supabaseAdmin
        .from('service_orders')
        .select('observations')
        .eq('id', id)
        .eq('studio_id', sid)
        .single()

      let obs: Record<string, any> = {}
      try { obs = JSON.parse(current?.observations || '{}') } catch {}
      if (art !== undefined) obs.art = art
      if (engineer !== undefined) obs.engineer = engineer
      if (status !== undefined) obs.laudo_status = STATUS_REVERSE[status] || status
      updatePayload.observations = JSON.stringify(obs)
    } else if (status !== undefined) {
      // Update laudo_status in observations too
      const { data: current } = await supabaseAdmin
        .from('service_orders')
        .select('observations')
        .eq('id', id)
        .eq('studio_id', sid)
        .single()

      let obs: Record<string, any> = {}
      try { obs = JSON.parse(current?.observations || '{}') } catch {}
      obs.laudo_status = STATUS_REVERSE[status] || status
      updatePayload.observations = JSON.stringify(obs)
    }

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .update(updatePayload)
      .eq('id', id)
      .eq('studio_id', sid)
      .select('id, title, status, updated_at, observations')
      .single()

    if (error) throw error

    let meta: Record<string, any> = {}
    try { meta = JSON.parse(data.observations || '{}') } catch {}

    return NextResponse.json({
      id: data.id,
      status: meta.laudo_status ? STATUS_MAP[meta.laudo_status] || meta.laudo_status : STATUS_MAP[data.status] || data.status,
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

    const { error } = await supabaseAdmin
      .from('service_orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
