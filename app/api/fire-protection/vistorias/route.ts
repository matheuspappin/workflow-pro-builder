import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

const CHECKLIST_PADRAO = [
  { title: 'Extintores dentro do prazo de validade', order_index: 0 },
  { title: 'Extintores com carga adequada e lacres intactos', order_index: 1 },
  { title: 'Sinalização de emergência visível e legível', order_index: 2 },
  { title: 'Saídas de emergência desobstruídas', order_index: 3 },
  { title: 'Iluminação de emergência funcionando', order_index: 4 },
  { title: 'Sistema de hidrantes com pressão adequada', order_index: 5 },
  { title: 'Mangueiras de incêndio em bom estado', order_index: 6 },
  { title: 'Detectores de fumaça / calor funcionando', order_index: 7 },
  { title: 'Alarme de incêndio testado e funcionando', order_index: 8 },
  { title: 'Planta de emergência visível e atualizada', order_index: 9 },
  { title: 'Rotas de fuga sinalizadas corretamente', order_index: 10 },
  { title: 'Sprinklers sem obstruções e funcionando', order_index: 11 },
]

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
        professional:professionals(id, name),
        milestones:service_order_milestones(id, title, status, order_index, completed_at)
      `)
      .eq('studio_id', studioId)
      .eq('project_type', 'vistoria')
      .order('scheduled_at', { ascending: true, nullsFirst: false })
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
      vistoria_type, description, scheduled_at,
      with_checklist = true,
    } = body

    if (!studio_id || !vistoria_type) {
      return NextResponse.json({ error: 'studio_id e vistoria_type são obrigatórios' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studio_id)
    if (!access.authorized) return access.response

    const { data: vistoria, error } = await supabaseAdmin
      .from('service_orders')
      .insert({
        studio_id,
        customer_id: customer_id || null,
        professional_id: professional_id || null,
        title: vistoria_type,
        vistoria_type,
        description,
        project_type: 'vistoria',
        scheduled_at: scheduled_at || null,
        status: 'open',
        priority: 'normal',
      })
      .select(`
        *,
        customer:students(id, name, phone),
        professional:professionals(id, name)
      `)
      .single()

    if (error) throw error

    // Criar checklist padrão automaticamente
    if (with_checklist && vistoria) {
      const checklistItems = CHECKLIST_PADRAO.map((item) => ({
        studio_id,
        service_order_id: vistoria.id,
        title: item.title,
        order_index: item.order_index,
        status: 'pending',
        category: 'vistoria',
      }))

      await supabaseAdmin.from('service_order_milestones').insert(checklistItems)
    }

    return NextResponse.json(vistoria)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
