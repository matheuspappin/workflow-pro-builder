import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const customerId = searchParams.get('customerId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    let query = supabaseAdmin
      .from('agroflowai_notifications')
      .select('id, type, title, body, read, customer_id, created_at')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (customerId) {
      query = query.or(`customer_id.eq.${customerId},customer_id.is.null`)
    }
    if (unreadOnly) {
      query = query.eq('read', false)
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
    const { studioId, studio_id, customer_id, type, title, body: notifBody } = body

    const sid = studioId || studio_id
    if (!sid) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    if (!title) return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 })
    if (!notifBody) return NextResponse.json({ error: 'body é obrigatório' }, { status: 400 })

    const accessPost = await checkStudioAccess(request, sid)
    if (!accessPost.authorized) return accessPost.response

    const { data, error } = await supabaseAdmin
      .from('agroflowai_notifications')
      .insert({
        studio_id: sid,
        customer_id: customer_id || null,
        type: type || 'info',
        title,
        body: notifBody,
        read: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, studioId, studio_id, read, markAllRead, customerId } = body

    const sid = studioId || studio_id
    if (!sid) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })

    const accessPatch = await checkStudioAccess(request, sid)
    if (!accessPatch.authorized) return accessPatch.response

    if (markAllRead) {
      let query = supabaseAdmin
        .from('agroflowai_notifications')
        .update({ read: true })
        .eq('studio_id', sid)

      if (customerId) {
        query = query.or(`customer_id.eq.${customerId},customer_id.is.null`)
      }

      const { error } = await query
      if (error) throw error
      return NextResponse.json({ success: true, updated: 'all' })
    }

    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('agroflowai_notifications')
      .update({ read })
      .eq('id', id)
      .eq('studio_id', sid)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const studioId = searchParams.get('studioId')

    if (!studioId) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

    const accessDel = await checkStudioAccess(request, studioId)
    if (!accessDel.authorized) return accessDel.response

    const { error } = await supabaseAdmin
      .from('agroflowai_notifications')
      .delete()
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
