import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data: prof, error: fetchError } = await supabaseAdmin
      .from('professionals')
      .select('id, studio_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!prof?.studio_id) return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 })

    const access = await checkStudioAccess(request, prof.studio_id)
    if (!access.authorized) return access.response

    const updates: Record<string, unknown> = {}
    if (body.name != null) updates.name = String(body.name).trim()
    if (body.phone != null) updates.phone = body.phone === '' ? null : String(body.phone).trim()
    if (body.email != null) updates.email = String(body.email).trim()
    if (body.professional_registration != null) updates.professional_registration = body.professional_registration === '' ? null : String(body.professional_registration).trim()
    if (body.address != null) updates.address = body.address === '' ? null : String(body.address).trim()
    if (body.specialties != null) {
      updates.specialties = Array.isArray(body.specialties)
        ? body.specialties.map((s: unknown) => String(s))
        : body.specialties ? [String(body.specialties)] : []
    }

    const { data: updated, error } = await supabaseAdmin
      .from('professionals')
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

    const { data: prof, error: fetchError } = await supabaseAdmin
      .from('professionals')
      .select('id, studio_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!prof?.studio_id) return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 })

    const access = await checkStudioAccess(request, prof.studio_id)
    if (!access.authorized) return access.response

    const { error } = await supabaseAdmin
      .from('professionals')
      .update({ status: 'inactive', studio_id: null })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Técnico desvinculado com sucesso.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
