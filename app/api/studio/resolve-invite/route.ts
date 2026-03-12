import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type InviteRole = 'student' | 'teacher'

/**
 * Resolve invite code to studio (generic - all niches).
 * Used by register page to show studio name and validate code before signup.
 */
async function resolveCode(code: string, role: InviteRole = 'student'): Promise<{ studio_id: string; studio_name: string } | null> {
  const codeKey = role === 'teacher' ? 'teacher_invite_code' : 'student_invite_code'

  const { data: allSettings } = await supabaseAdmin
    .from('organization_settings')
    .select('studio_id, theme_config')

  for (const row of allSettings || []) {
    const codes = row.theme_config?.invite_codes || {}
    if (codes[codeKey] === code) {
      const { data: studio } = await supabaseAdmin
        .from('studios')
        .select('id, name')
        .eq('id', row.studio_id)
        .maybeSingle()

      return {
        studio_id: row.studio_id,
        studio_name: studio?.name || 'Estabelecimento',
      }
    }
  }

  return null
}

// GET /api/studio/resolve-invite?code=XXXX&role=student|teacher — resolve código para info do estúdio (público)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.trim().toUpperCase()
  const role = (searchParams.get('role') || 'student') as InviteRole

  if (!code || code.length < 4) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
  }

  try {
    const inviteRole: InviteRole = role === 'teacher' ? 'teacher' : 'student'
    const result = await resolveCode(code, inviteRole)
    if (!result) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('[studio/resolve-invite]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
