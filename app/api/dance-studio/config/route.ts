import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'
import { normalizeModules } from '@/config/modules'

/**
 * GET /api/dance-studio/config?studioId=xxx
 * Retorna enabled_modules do organization_settings do estúdio.
 * Controlado 100% pelo admin via planos (system_plans / verticalization_plans).
 * Protegido por checkStudioAccess.
 */
export async function GET(req: NextRequest) {
  try {
    const studioId = req.nextUrl.searchParams.get('studioId')
    const access = await checkStudioAccess(req, studioId)
    if (!access.authorized) return access.response

    const { data: settings, error } = await supabaseAdmin
      .from('organization_settings')
      .select('enabled_modules')
      .eq('studio_id', studioId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // enabled_modules vem do plano (sincronizado via admin)
    const raw = settings?.enabled_modules ?? {}
    const enabledModules = normalizeModules(raw)

    return NextResponse.json({
      enabledModules,
      planControlled: true,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
