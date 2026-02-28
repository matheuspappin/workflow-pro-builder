import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

function mapStatusToDb(s: string): string {
  if (s === 'ativo') return 'active'
  if (s === 'vencido') return 'suspended'
  return 'active' // pendente -> active
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data: student, error: fetchError } = await supabaseAdmin
      .from('students')
      .select('id, studio_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!student?.studio_id) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    const access = await checkStudioAccess(request, student.studio_id)
    if (!access.authorized) return access.response

    const updates: Record<string, unknown> = {}
    if (body.nome != null) updates.name = String(body.nome).trim()
    if (body.telefone != null) updates.phone = body.telefone === '' ? null : String(body.telefone).trim()
    if (body.email != null) updates.email = String(body.email).trim()
    if (body.endereco != null) updates.address = body.endereco === '' ? null : String(body.endereco).trim()
    if (body.status != null) updates.status = mapStatusToDb(String(body.status))
    if (body.cnpj != null) updates.cpf_cnpj = body.cnpj === '' ? null : String(body.cnpj).trim()

    // metadata: cidade, contato, uf
    const metaUpdates: Record<string, unknown> = {}
    if (body.cidade != null) metaUpdates.cidade = String(body.cidade).trim() || null
    if (body.contato != null) metaUpdates.contact_name = String(body.contato).trim() || null
    if (body.uf != null) metaUpdates.uf = String(body.uf).trim() || null

    if (Object.keys(metaUpdates).length > 0) {
      const { data: existing } = await supabaseAdmin
        .from('students')
        .select('metadata')
        .eq('id', id)
        .single()
      const currentMeta = (existing?.metadata as Record<string, unknown>) || {}
      updates.metadata = { ...currentMeta, ...metaUpdates }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: student, error: fetchError } = await supabaseAdmin
      .from('students')
      .select('id, studio_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!student?.studio_id) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    const access = await checkStudioAccess(request, student.studio_id)
    if (!access.authorized) return access.response

    // Desvincular: set studio_id to null
    const { error } = await supabaseAdmin
      .from('students')
      .update({ studio_id: null })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Cliente desvinculado com sucesso.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
