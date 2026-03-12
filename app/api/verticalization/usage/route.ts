import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

/**
 * GET /api/verticalization/usage?studioId=xxx&slug=fire-protection
 * Retorna plan, students/teachers count e invoices para a verticalização.
 * Usa tabelas apropriadas por vertical (fire: customers+technicians, agroflowai: similar, dance: students+teachers).
 */
export async function GET(req: NextRequest) {
  try {
    const studioId = req.nextUrl.searchParams.get('studioId')
    const slug = req.nextUrl.searchParams.get('slug')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(req, studioId)
    if (!access.authorized) return access.response

    const { data: studio } = await supabaseAdmin
      .from('studios')
      .select('plan')
      .eq('id', studioId)
      .maybeSingle()

    const plan = studio?.plan || 'gratuito'

    let students = 0
    let teachers = 0

    if (slug === 'fire-protection') {
      const [studentsRes, professionalsRes] = await Promise.all([
        supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('studio_id', studioId),
        supabaseAdmin.from('professionals').select('*', { count: 'exact', head: true }).eq('studio_id', studioId).eq('status', 'active'),
      ])
      students = studentsRes.count ?? 0
      teachers = professionalsRes.count ?? 0
    } else if (slug === 'agroflowai') {
      const [studentsRes, professionalsRes] = await Promise.all([
        supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('studio_id', studioId),
        supabaseAdmin.from('professionals').select('*', { count: 'exact', head: true }).eq('studio_id', studioId).eq('status', 'active'),
      ])
      students = studentsRes.count ?? 0
      teachers = professionalsRes.count ?? 0
    } else {
      const [studentsRes, teachersRes] = await Promise.all([
        supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('studio_id', studioId),
        supabaseAdmin.from('teachers').select('*', { count: 'exact', head: true }).eq('studio_id', studioId).eq('status', 'active'),
      ])
      students = studentsRes.count ?? 0
      teachers = teachersRes.count ?? 0
    }

    return NextResponse.json({
      students,
      teachers,
      plan,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
