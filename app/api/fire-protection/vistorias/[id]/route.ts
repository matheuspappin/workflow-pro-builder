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
        milestones:service_order_milestones(id, title, status, order_index, completed_at, category),
        comments:service_order_comments(id, content, is_internal, created_at),
        documents:service_order_documents(id, title, file_url, file_type)
      `)
      .eq('id', id)
      .eq('studio_id', studioId)
      .eq('project_type', 'vistoria')
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Vistoria não encontrada' }, { status: 404 })

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
    const {
      studio_id,
      status,
      observations,
      conformidade_score,
      checklist_updates,
      professional_id,
      scheduled_at,
      previous_status,
    } = body

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
    if (conformidade_score !== undefined) updatePayload.conformidade_score = conformidade_score
    if (professional_id !== undefined) updatePayload.professional_id = professional_id
    if (scheduled_at !== undefined) updatePayload.scheduled_at = scheduled_at

    if (status === 'in_progress') {
      updatePayload.opened_at = new Date().toISOString()
    }
    if (status === 'finished' || status === 'nao_conforme' || status === 'cancelled') {
      updatePayload.finished_at = new Date().toISOString()
    }

    const { data: vistoria, error } = await supabaseAdmin
      .from('service_orders')
      .update(updatePayload)
      .eq('id', id)
      .eq('studio_id', studio_id)
      .select(`
        *,
        customer:students(id, name, phone),
        professional:professionals(id, name),
        milestones:service_order_milestones(id, title, status, order_index, completed_at)
      `)
      .single()

    if (error) throw error

    // Atualizar itens do checklist individualmente
    if (checklist_updates && Array.isArray(checklist_updates)) {
      for (const item of checklist_updates) {
        await supabaseAdmin
          .from('service_order_milestones')
          .update({
            status: item.status,
            completed_at: item.status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', item.id)
          .eq('studio_id', studio_id)
      }
    }

    // Registrar no histórico
    if (previous_status && status) {
      await supabaseAdmin.from('service_order_history').insert({
        studio_id,
        service_order_id: id,
        previous_status,
        new_status: status,
        notes: observations || null,
      })
    }

    return NextResponse.json(vistoria)
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

    const { error } = await supabaseAdmin
      .from('service_orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('studio_id', studioId)
      .eq('project_type', 'vistoria')

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
