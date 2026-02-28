import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

/** GET - Lista sessões de chat do Fire Protection */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studio_id')
    if (!studioId) {
      return NextResponse.json({ error: 'studio_id obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title, updated_at')
      .eq('studio_id', studioId)
      .eq('source', 'fire_protection')
      .gte('updated_at', fifteenDaysAgo.toISOString())
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message, sessions: [] }, { status: 200 })
    }
    return NextResponse.json({ sessions: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro', sessions: [] }, { status: 200 })
  }
}

/** POST - Salva ou atualiza sessão */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studio_id: studioId, id, title, messages } = body
    if (!studioId) {
      return NextResponse.json({ error: 'studio_id obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const messagesJson = Array.isArray(messages) ? messages : []
    const payload: Record<string, unknown> = {
      studio_id: studioId,
      source: 'fire_protection',
      title: title || (messagesJson.find((m: any) => m.role === 'user') as any)?.content?.substring(0, 40) || 'Nova Conversa',
      messages: messagesJson,
      updated_at: new Date().toISOString(),
    }
    if (id) payload.id = id

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro' }, { status: 500 })
  }
}
