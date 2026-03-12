import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
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

    const access = await checkStudioAccess(request, studio_id)
    if (!access.authorized) return access.response

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
