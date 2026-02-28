import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const refId = searchParams.get('refId')
    const refType = searchParams.get('refType')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response
    if (!refId) return NextResponse.json({ error: 'refId é obrigatório' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('agroflowai_documents')
      .select('*')
      .eq('studio_id', studioId)
      .eq('ref_id', refId)
      .order('created_at', { ascending: false })

    if (error) {
      // Table may not exist yet
      if (error.code === '42P01') return NextResponse.json([])
      throw error
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioId, studio_id, refId, refType, fileName, fileUrl, fileType, fileSize, uploadedBy } = body

    const sid = studioId || studio_id
    const access = await checkStudioAccess(request, sid)
    if (!access.authorized) return access.response
    if (!refId || !fileName || !fileUrl) {
      return NextResponse.json({ error: 'refId, fileName e fileUrl são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('agroflowai_documents')
      .insert({
        studio_id: sid,
        ref_id: refId,
        ref_type: refType || 'os',
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType || 'application/octet-stream',
        file_size_kb: fileSize || 0,
        uploaded_by: uploadedBy || null,
      })
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

    if (!id || !studioId) return NextResponse.json({ error: 'id e studioId são obrigatórios' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('agroflowai_documents')
      .delete()
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
