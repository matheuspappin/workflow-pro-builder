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
      return NextResponse.json({ error: 'Perfil de técnico não encontrado' }, { status: 404 })
    }

    const professionalIds = professionals.map(p => p.id)

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .select(`
        *,
        customer:students(id, name, phone, email, address),
        milestones:service_order_milestones(id, title, status, order_index, completed_at, category),
        comments:service_order_comments(id, content, created_at, is_internal)
      `)
      .eq('id', id)
      .in('professional_id', professionalIds)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'OS não encontrada ou sem permissão' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
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
      .select('id, studio_id')
      .eq('user_id', user.id)

    if (!professionals?.length) {
      return NextResponse.json({ error: 'Perfil de técnico não encontrado' }, { status: 404 })
    }

    const professionalIds = professionals.map(p => p.id)
    const professional = professionals[0]

    // Verificar que a OS pertence ao técnico
    const { data: existing } = await supabaseAdmin
      .from('service_orders')
      .select('id, status, studio_id, project_type')
      .eq('id', id)
      .in('professional_id', professionalIds)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'OS não encontrada ou sem permissão' }, { status: 404 })
    }

    const body = await request.json()
    const {
      status,
      observations,
      conformidade_score,
      checklist_updates,
      retirada_notes,
    } = body

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) {
      updatePayload.status = status
      if (status === 'in_progress') {
        updatePayload.opened_at = new Date().toISOString()
      }
      if (status === 'finished' || status === 'nao_conforme') {
        updatePayload.finished_at = new Date().toISOString()
      }
    }

    if (observations !== undefined) updatePayload.observations = observations
    if (conformidade_score !== undefined) updatePayload.conformidade_score = conformidade_score
    if (retirada_notes !== undefined) updatePayload.description = retirada_notes

    const { data: updated, error } = await supabaseAdmin
      .from('service_orders')
      .update(updatePayload)
      .eq('id', id)
      .in('professional_id', professionalIds)
      .select(`
        *,
        customer:students(id, name, phone),
        milestones:service_order_milestones(id, title, status, order_index, completed_at)
      `)
      .single()

    if (error) throw error

    // Atualizar checklist da vistoria
    if (checklist_updates && Array.isArray(checklist_updates)) {
      for (const item of checklist_updates) {
        await supabaseAdmin
          .from('service_order_milestones')
          .update({
            status: item.status,
            completed_at: item.status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', item.id)
          .eq('studio_id', existing.studio_id)
      }
    }

    // Registrar histórico
    if (status && status !== existing.status) {
      await supabaseAdmin.from('service_order_history').insert({
        studio_id: existing.studio_id,
        service_order_id: id,
        previous_status: existing.status,
        new_status: status,
        notes: observations || `Status atualizado pelo técnico`,
        changed_by: user.id,
      })
    }

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
