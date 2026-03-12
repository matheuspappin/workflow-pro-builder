import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { checkStudioAccess } from '@/lib/auth'

/**
 * GET /api/dance-studio/usage?studioId=xxx
 * Retorna students, teachers, plan e planName do estúdio.
 * Usa supabaseAdmin para bypassar RLS (estúdios podem ter políticas restritivas).
 */
export async function GET(req: NextRequest) {
  try {
    const studioId = req.nextUrl.searchParams.get('studioId')
    if (!studioId) {
      return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(req, studioId)
    if (!access.authorized) return access.response

    const [studentsRes, teachersRes, studioRes] = await Promise.all([
      supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('studio_id', studioId),
      supabaseAdmin.from('teachers').select('*', { count: 'exact', head: true }).eq('studio_id', studioId).eq('status', 'active'),
      supabaseAdmin.from('studios').select('plan, verticalization_plan_id').eq('id', studioId).maybeSingle(),
    ])

    const plan = studioRes.data?.plan || 'gratuito'
    let planName: string = PLAN_LIMITS.gratuito.name

    if (studioRes.data?.verticalization_plan_id) {
      const { data: vp } = await supabaseAdmin
        .from('verticalization_plans')
        .select('name')
        .eq('id', studioRes.data.verticalization_plan_id)
        .maybeSingle()
      planName = vp?.name ?? planName
    } else if (studioRes.data?.plan) {
      const normId = ['starter', 'free'].includes(studioRes.data.plan.toLowerCase())
        ? 'gratuito'
        : studioRes.data.plan === 'pro+' ? 'pro-plus' : studioRes.data.plan
      planName = PLAN_LIMITS[normId]?.name ?? null
      if (!planName) {
        const { data: sp } = await supabaseAdmin.from('system_plans').select('name').eq('id', studioRes.data.plan).maybeSingle()
        planName = sp?.name ?? studioRes.data.plan
      }
    }

    return NextResponse.json({
      students: studentsRes.count ?? 0,
      teachers: teachersRes.count ?? 0,
      plan,
      planName,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
