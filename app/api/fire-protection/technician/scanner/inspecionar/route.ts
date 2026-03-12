import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set() {},
        remove() {},
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { asset_id, observations, status = 'ok' } = body

    if (!asset_id) {
      return NextResponse.json({ error: 'asset_id é obrigatório' }, { status: 400 })
    }

    const { data: professionals } = await supabaseAdmin
      .from('professionals')
      .select('id, studio_id, name')
      .eq('user_id', user.id)

    if (!professionals?.length) {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 })
    }

    const professional = professionals[0]

    // Buscar o asset para verificar existência
    const { data: asset } = await supabaseAdmin
      .from('assets')
      .select('id, studio_id, name, student_id')
      .eq('id', asset_id)
      .single()

    if (!asset) {
      return NextResponse.json({ error: 'Extintor não encontrado' }, { status: 404 })
    }

    // Verificar que o asset pertence ao studio do técnico
    const studioIds = professionals.map((p: { studio_id: string }) => p.studio_id).filter(Boolean)
    if (!studioIds.includes(asset.studio_id)) {
      return NextResponse.json({ error: 'Extintor de outro studio' }, { status: 403 })
    }

    // Atualizar data da última vistoria no asset
    await supabaseAdmin
      .from('assets')
      .update({
        last_inspection_at: new Date().toISOString(),
        status: status,
      })
      .eq('id', asset_id)

    // Criar OS de vistoria rápida se não existir uma aberta para este asset
    const { data: existingOS } = await supabaseAdmin
      .from('service_orders')
      .select('id')
      .eq('studio_id', asset.studio_id)
      .eq('customer_id', asset.student_id)
      .eq('project_type', 'vistoria')
      .in('status', ['open', 'in_progress'])
      .limit(1)

    if (!existingOS?.length) {
      await supabaseAdmin.from('service_orders').insert({
        studio_id: asset.studio_id,
        customer_id: asset.student_id || null,
        professional_id: professional.id,
        title: `Vistoria Rápida — ${asset.name}`,
        project_type: 'vistoria',
        vistoria_type: 'Vistoria por QR Code',
        status: 'finished',
        observations: observations || `Vistoria registrada via scanner pelo técnico ${professional.name}`,
        opened_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: `Vistoria do extintor "${asset.name}" registrada com sucesso.`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar vistoria'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
