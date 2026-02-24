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

export async function POST(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const {
      studio_id,
      service_order_id,
      customer_id,
      quantity,
      agent_type,
      capacity,
      is_our_extinguisher = false, // "nosso extintor" = sem cliente, nosso estoque
    } = body

    if (!studio_id || !quantity || quantity < 1 || quantity > 200) {
      return NextResponse.json({
        error: 'studio_id e quantity (1-200) são obrigatórios',
      }, { status: 400 })
    }

    // Verificar permissão
    const studioIdFromMeta = user.user_metadata?.studio_id
    const { data: ownedStudio } = await supabaseAdmin
      .from('studios')
      .select('id')
      .eq('id', studio_id)
      .eq('owner_id', user.id)
      .maybeSingle()
    const { data: professional } = await supabaseAdmin
      .from('professionals')
      .select('studio_id')
      .eq('user_id', user.id)
      .eq('studio_id', studio_id)
      .eq('status', 'active')
      .maybeSingle()

    const hasAccess = ownedStudio || professional || studioIdFromMeta === studio_id
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const student_id = is_our_extinguisher ? null : (customer_id || null)
    const typeStr = [agent_type, capacity].filter(Boolean).join(' ')

    const assets: Array<{ studio_id: string; student_id: string | null; name: string; type: string | null; agent_type: string | null; capacity: string | null; qr_code: string }> = []

    for (let i = 0; i < quantity; i++) {
      const qr_code = crypto.randomUUID()
      const suffix = quantity > 1 ? ` #${i + 1}` : ''
      const name = typeStr
        ? `Extintor ${typeStr}${suffix}`
        : `Extintor${suffix}`
      assets.push({
        studio_id,
        student_id,
        name,
        type: typeStr || null,
        agent_type: agent_type || null,
        capacity: capacity || null,
        qr_code,
      })
    }

    const { data: created, error } = await supabaseAdmin
      .from('assets')
      .insert(assets)
      .select('id, name, qr_code, agent_type, capacity')

    if (error) throw error

    const assetIds = (created || []).map((a: { id: string }) => a.id)

    // Vincular à OS se informada
    if (service_order_id && assetIds.length > 0) {
      await supabaseAdmin
        .from('service_orders')
        .update({
          asset_ids: assetIds,
          retirada_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', service_order_id)
        .eq('studio_id', studio_id)
    }

    return NextResponse.json({
      success: true,
      count: created?.length || 0,
      assets: created || [],
      asset_ids: assetIds,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar extintores em massa'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
