import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

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
        customer:students(id, name, phone, email),
        professional:professionals(id, name, phone),
        milestones:service_order_milestones(id, title, status, order_index, completed_at),
        comments:service_order_comments(id, content, is_internal, created_at, user_id),
        documents:service_order_documents(id, title, file_url, file_type, category)
      `)
      .eq('id', id)
      .eq('studio_id', studioId)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 })

    return NextResponse.json(data)
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
    const { studio_id, status, observations, professional_id, scheduled_at, priority, ...rest } = body

    if (!studio_id) {
      return NextResponse.json({ error: 'studio_id é obrigatório' }, { status: 400 })
    }

    const accessPatch = await checkStudioAccess(request, studio_id)
    if (!accessPatch.authorized) return accessPatch.response

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) updatePayload.status = status
    if (observations !== undefined) updatePayload.observations = observations
    if (professional_id !== undefined) updatePayload.professional_id = professional_id
    if (scheduled_at !== undefined) updatePayload.scheduled_at = scheduled_at
    if (priority !== undefined) updatePayload.priority = priority
    if (rest.title !== undefined) updatePayload.title = rest.title
    if (rest.description !== undefined) updatePayload.description = rest.description
    if (rest.customer_id !== undefined) updatePayload.customer_id = rest.customer_id
    if (rest.asset_ids !== undefined) updatePayload.asset_ids = rest.asset_ids
    if (rest.retirada_at !== undefined) updatePayload.retirada_at = rest.retirada_at

    // Se finalizando, registrar data
    if (status === 'finished' || status === 'cancelled') {
      updatePayload.finished_at = new Date().toISOString()
    }
    if (status === 'in_progress') {
      updatePayload.opened_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .update(updatePayload)
      .eq('id', id)
      .eq('studio_id', studio_id)
      .select(`
        *,
        customer:students(id, name, phone),
        professional:professionals(id, name)
      `)
      .single()

    if (error) throw error

    // Registrar histórico
    if (rest.previous_status && status) {
      await supabaseAdmin.from('service_order_history').insert({
        studio_id,
        service_order_id: id,
        previous_status: rest.previous_status,
        new_status: status,
        notes: observations || null,
        changed_by: rest.changed_by || null,
      })
    }

    return NextResponse.json(data)
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

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const accessDel = await checkStudioAccess(request, studioId)
    if (!accessDel.authorized) return accessDel.response

    // Soft delete: apenas cancela a OS
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
