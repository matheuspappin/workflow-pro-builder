import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

/** GET - Busca uma sessão por ID */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studio_id')
    if (!studioId) return NextResponse.json({ error: 'studio_id obrigatório' }, { status: 400 })

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .eq('studio_id', studioId)
      .eq('source', 'fire_protection')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro' }, { status: 500 })
  }
}

/** DELETE - Remove uma sessão */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studio_id')
    if (!studioId) return NextResponse.json({ error: 'studio_id obrigatório' }, { status: 400 })

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('studio_id', studioId)
      .eq('source', 'fire_protection')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro' }, { status: 500 })
  }
}
