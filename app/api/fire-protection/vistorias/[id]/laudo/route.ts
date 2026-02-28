import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { pdf_base64, studio_id } = body

    if (!studio_id) {
      return NextResponse.json({ error: 'studio_id é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studio_id)
    if (!access.authorized) return access.response

    if (!pdf_base64 || typeof pdf_base64 !== 'string') {
      return NextResponse.json({ error: 'PDF em base64 é obrigatório' }, { status: 400 })
    }

    const base64Data = pdf_base64.replace(/^data:application\/pdf;base64,/, '').trim()
    const buffer = Buffer.from(base64Data, 'base64')

    const bucket = 'arquiteto upload'
    const filePath = `laudos/${id}/${Date.now()}-laudo-avcb.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath)

    const { data: vistoria, error: updateError } = await supabaseAdmin
      .from('service_orders')
      .update({
        laudo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('studio_id', studio_id)
      .select('id, laudo_url')
      .single()

    if (updateError) throw updateError
    if (!vistoria) return NextResponse.json({ error: 'Vistoria não encontrada' }, { status: 404 })

    return NextResponse.json({ success: true, laudo_url: vistoria.laudo_url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar laudo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
