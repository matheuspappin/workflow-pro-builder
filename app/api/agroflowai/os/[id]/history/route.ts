import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    const { data, error } = await supabaseAdmin
      .from('agroflowai_os_history')
      .select('id, event_type, content, old_value, new_value, author_name, created_at')
      .eq('os_id', id)
      .eq('studio_id', studioId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { studioId, content, authorName, authorId } = body

    if (!studioId || !content?.trim()) {
      return NextResponse.json({ error: 'studioId e content são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('agroflowai_os_history')
      .insert({
        studio_id: studioId,
        os_id: id,
        event_type: 'comment',
        content: content.trim(),
        author_name: authorName || 'Equipe',
        author_id: authorId || null,
      })
      .select('id, event_type, content, author_name, created_at')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
