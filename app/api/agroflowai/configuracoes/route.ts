import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data: studio, error: studioError } = await supabaseAdmin
      .from('studios')
      .select('id, name')
      .eq('id', studioId)
      .single()

    if (studioError || !studio) {
      return NextResponse.json({ error: 'Studio não encontrado' }, { status: 404 })
    }

    const { data: settings } = await supabaseAdmin
      .from('organization_settings')
      .select('enabled_modules, theme_config')
      .eq('studio_id', studioId)
      .single()

    let businessInfo: Record<string, string> = {}
    try { businessInfo = (settings?.theme_config as any)?.business_info || {} } catch {}

    return NextResponse.json({
      name: studio.name || '',
      email: businessInfo.email || '',
      phone: businessInfo.phone || '',
      cnpj: businessInfo.cnpj || '',
      address: businessInfo.address || '',
      crea_responsible: businessInfo.crea_responsible || '',
      responsible_name: businessInfo.responsible_name || '',
      website: businessInfo.website || '',
      modules: settings?.enabled_modules || {},
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioId, empresa, modules } = body

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    if (empresa) {
      // Atualiza nome no studios
      if (empresa.name) {
        await supabaseAdmin
          .from('studios')
          .update({ name: empresa.name, updated_at: new Date().toISOString() })
          .eq('id', studioId)
      }

      // Atualiza dados extras no theme_config.business_info
      const { data: current } = await supabaseAdmin
        .from('organization_settings')
        .select('theme_config')
        .eq('studio_id', studioId)
        .single()

      let themeConfig: Record<string, any> = {}
      try { themeConfig = (current?.theme_config as any) || {} } catch {}

      themeConfig.business_info = {
        email: empresa.email || '',
        phone: empresa.phone || '',
        cnpj: empresa.cnpj || '',
        address: empresa.address || '',
        crea_responsible: empresa.crea_responsible || '',
        responsible_name: empresa.responsible_name || '',
        website: empresa.website || '',
      }

      await supabaseAdmin
        .from('organization_settings')
        .update({ theme_config: themeConfig, updated_at: new Date().toISOString() })
        .eq('studio_id', studioId)
    }

    if (modules) {
      const { data: current } = await supabaseAdmin
        .from('organization_settings')
        .select('enabled_modules')
        .eq('studio_id', studioId)
        .single()

      const updated = { ...(current?.enabled_modules || {}), ...modules }

      await supabaseAdmin
        .from('organization_settings')
        .update({ enabled_modules: updated, updated_at: new Date().toISOString() })
        .eq('studio_id', studioId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
