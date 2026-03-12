import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PROFESSIONAL_TIERS, getTierById, DEFAULT_PROFESSIONALS_TIER } from '@/config/professional-tiers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function createSSRClient(request: NextRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set() {},
      remove() {},
    },
  })
}

async function resolveStudioId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('studios')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()
  return data?.id ?? null
}

// GET: Retorna a faixa atual e o limite de profissionais
export async function GET(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const studioId = user.user_metadata?.studio_id || await resolveStudioId(user.id)
    if (!studioId) return NextResponse.json({ error: 'Estúdio não encontrado' }, { status: 404 })

    const { data: orgSettings } = await supabaseAdmin
      .from('organization_settings')
      .select('theme_config')
      .eq('studio_id', studioId)
      .maybeSingle()

    const tierId = orgSettings?.theme_config?.professionals_tier || DEFAULT_PROFESSIONALS_TIER
    const tier = getTierById(tierId)

    const { count } = await supabaseAdmin
      .from('professionals')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .eq('status', 'active')

    return NextResponse.json({
      tierId,
      tier: tier || getTierById(DEFAULT_PROFESSIONALS_TIER),
      limit: tier?.limit ?? 10,
      currentCount: count ?? 0,
      tiers: PROFESSIONAL_TIERS,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('[studio/professionals-tier GET]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH: Atualiza a faixa de profissionais
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const studioId = user.user_metadata?.studio_id || await resolveStudioId(user.id)
    if (!studioId) return NextResponse.json({ error: 'Estúdio não encontrado' }, { status: 404 })

    const body = await request.json()
    const tierId = body.tierId || body.professionals_tier

    if (!tierId || !getTierById(tierId)) {
      return NextResponse.json({ error: 'Faixa inválida' }, { status: 400 })
    }

    const { data: orgSettings } = await supabaseAdmin
      .from('organization_settings')
      .select('theme_config')
      .eq('studio_id', studioId)
      .maybeSingle()

    const themeConfig = (orgSettings?.theme_config as Record<string, unknown>) || {}
    const updated = { ...themeConfig, professionals_tier: tierId }

    const { error } = await supabaseAdmin
      .from('organization_settings')
      .update({ theme_config: updated })
      .eq('studio_id', studioId)

    if (error) throw error

    const tier = getTierById(tierId)
    return NextResponse.json({
      success: true,
      tierId,
      limit: tier?.limit ?? 10,
      tier,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('[studio/professionals-tier PATCH]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
