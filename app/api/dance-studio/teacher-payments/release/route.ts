import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

// POST: Liberar pagamentos em lote
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { studioId, entryIds } = body
  if (!studioId || !Array.isArray(entryIds) || entryIds.length === 0) {
    return NextResponse.json({ error: 'studioId e entryIds obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const { data, error } = await supabaseAdmin.rpc('release_teacher_payments', {
    p_entry_ids: entryIds,
    p_released_by: access.userId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || { success: true })
}
