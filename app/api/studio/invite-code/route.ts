import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function resolveStudioId(userId: string, studioIdMeta?: string): Promise<string | null> {
  if (studioIdMeta) return studioIdMeta

  const { data } = await supabaseAdmin
    .from('studios')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  return data?.id ?? null
}

async function ensureOrganizationSettings(studioId: string) {
  const { data: existing } = await supabaseAdmin
    .from('organization_settings')
    .select('id')
    .eq('studio_id', studioId)
    .maybeSingle()

  if (!existing) {
    const { data: studio } = await supabaseAdmin
      .from('studios')
      .select('niche')
      .eq('id', studioId)
      .maybeSingle()
    const niche = studio?.niche || 'dance'
    await supabaseAdmin.from('organization_settings').insert({
      studio_id: studioId,
      niche,
      theme_config: {},
    })
  }
}

// GET: Retorna os códigos de convite do estúdio (provider e client)
export async function GET(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const studioId = await resolveStudioId(user.id, user.user_metadata?.studio_id)
    if (!studioId) {
      return NextResponse.json({ error: 'Estúdio não encontrado' }, { status: 404 })
    }

    await ensureOrganizationSettings(studioId)

    const { data: orgSettings } = await supabaseAdmin
      .from('organization_settings')
      .select('theme_config')
      .eq('studio_id', studioId)
      .maybeSingle()

    const themeConfig: Record<string, any> = orgSettings?.theme_config || {}
    const inviteCodes: Record<string, string> = themeConfig.invite_codes || {}

    let teacherCode = inviteCodes.teacher_invite_code
    let studentCode = inviteCodes.student_invite_code
    let changed = false

    if (!teacherCode) { teacherCode = generateCode(); changed = true }
    if (!studentCode) { studentCode = generateCode(); changed = true }

    if (changed) {
      const updatedThemeConfig = {
        ...themeConfig,
        invite_codes: { ...inviteCodes, teacher_invite_code: teacherCode, student_invite_code: studentCode },
      }
      await supabaseAdmin
        .from('organization_settings')
        .update({ theme_config: updatedThemeConfig })
        .eq('studio_id', studioId)
    }

    return NextResponse.json({
      teacher_invite_code: teacherCode,
      student_invite_code: studentCode,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('[studio/invite-code GET]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: Regenera um código específico (type: 'teacher' | 'student')
export async function POST(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const type: 'teacher' | 'student' = body.type === 'student' ? 'student' : 'teacher'

    const studioId = await resolveStudioId(user.id, user.user_metadata?.studio_id)
    if (!studioId) return NextResponse.json({ error: 'Estúdio não encontrado' }, { status: 404 })

    await ensureOrganizationSettings(studioId)

    const { data: orgSettings } = await supabaseAdmin
      .from('organization_settings')
      .select('theme_config')
      .eq('studio_id', studioId)
      .maybeSingle()

    const themeConfig: Record<string, any> = orgSettings?.theme_config || {}
    const inviteCodes: Record<string, string> = themeConfig.invite_codes || {}

    const newCode = generateCode()
    const field = type === 'teacher' ? 'teacher_invite_code' : 'student_invite_code'
    inviteCodes[field] = newCode

    const updatedThemeConfig = { ...themeConfig, invite_codes: inviteCodes }
    const { error: updateError } = await supabaseAdmin
      .from('organization_settings')
      .update({ theme_config: updatedThemeConfig })
      .eq('studio_id', studioId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, [field]: newCode, invite_code: newCode })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('[studio/invite-code POST]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
