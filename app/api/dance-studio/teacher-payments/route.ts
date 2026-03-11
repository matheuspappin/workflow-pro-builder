import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

// GET: Lista teacher_payment_entries
// studioId obrigatório | professionalId opcional | mine=true (professor vê só os seus)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')
  let professionalId = searchParams.get('professionalId')
  const status = searchParams.get('status') // pending, released, withdrawn
  const mine = searchParams.get('mine') === 'true'

  if (!studioId) return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  if (mine) {
    const { data: prof } = await supabaseAdmin
      .from('professionals')
      .select('id')
      .eq('user_id', access.userId)
      .eq('studio_id', studioId)
      .maybeSingle()
    if (prof) professionalId = prof.id
  }

  let q = supabaseAdmin
    .from('teacher_payment_entries')
    .select('*, professionals(id, name, email)')
    .eq('studio_id', studioId)
    .order('scheduled_date', { ascending: false })

  if (professionalId) q = q.eq('professional_id', professionalId)
  if (status) q = q.eq('status', status)

  const { data, error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Totais
  const pending = (data || []).filter((e: any) => e.status === 'pending').reduce((s: number, e: any) => s + Number(e.amount), 0)
  const released = (data || []).filter((e: any) => e.status === 'released').reduce((s: number, e: any) => s + Number(e.amount), 0)
  const withdrawn = (data || []).filter((e: any) => e.status === 'withdrawn').reduce((s: number, e: any) => s + Number(e.amount), 0)

  return NextResponse.json({
    entries: data || [],
    totals: { pending, released, withdrawn },
  })
}
