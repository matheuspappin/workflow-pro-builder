import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

// GET: Retorna configuração de compensação do estúdio
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')
  if (!studioId) return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  let { data: org } = await supabaseAdmin
    .from('organization_settings')
    .select('theme_config')
    .eq('studio_id', studioId)
    .eq('niche', 'dance')
    .maybeSingle()

  if (!org) {
    const fallback = await supabaseAdmin
      .from('organization_settings')
      .select('theme_config')
      .eq('studio_id', studioId)
      .maybeSingle()
    org = fallback.data
  }

  const themeConfig = org?.theme_config || {}
  const amount = Number(themeConfig.teacher_compensation_amount) || 0
  const overrides = themeConfig.teacher_compensation_overrides || {}
  const paymentSchedule = themeConfig.teacher_payment_schedule || 'manual' // manual | weekly | monthly
  const paymentDayOfMonth = Number(themeConfig.teacher_payment_day_of_month) || 5

  return NextResponse.json({ amount, overrides, paymentSchedule, paymentDayOfMonth })
}

// PUT: Atualiza configuração de compensação
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { studioId, amount, overrides, paymentSchedule, paymentDayOfMonth } = body
  if (!studioId) return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  let { data: org } = await supabaseAdmin
    .from('organization_settings')
    .select('id, theme_config, niche')
    .eq('studio_id', studioId)
    .eq('niche', 'dance')
    .maybeSingle()

  if (!org) {
    const fallback = await supabaseAdmin
      .from('organization_settings')
      .select('id, theme_config, niche')
      .eq('studio_id', studioId)
      .maybeSingle()
    org = fallback.data
  }

  const themeConfig = org?.theme_config || {}
  const updated = {
    ...themeConfig,
    teacher_compensation_amount: amount !== undefined ? Number(amount) : (themeConfig.teacher_compensation_amount ?? 0),
    teacher_compensation_overrides: overrides ?? themeConfig.teacher_compensation_overrides ?? {},
    teacher_payment_schedule: paymentSchedule ?? themeConfig.teacher_payment_schedule ?? 'manual',
    teacher_payment_day_of_month: paymentDayOfMonth ?? themeConfig.teacher_payment_day_of_month ?? 5,
  }

  let q = supabaseAdmin.from('organization_settings').update({ theme_config: updated }).eq('studio_id', studioId)
  if (org?.niche) q = q.eq('niche', org.niche)
  const { error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, amount: updated.teacher_compensation_amount })
}
