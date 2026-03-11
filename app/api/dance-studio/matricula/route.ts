import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type InviteRole = 'student' | 'teacher'

async function resolveCode(code: string, role: InviteRole = 'student'): Promise<{ studio_id: string; studio_name: string } | null> {
  const supabase = getAdmin()
  const { data: allSettings } = await supabase
    .from('organization_settings')
    .select('studio_id, theme_config')
    .eq('niche', 'dance')

  let matchedStudioId: string | null = null
  const codeKey = role === 'teacher' ? 'teacher_invite_code' : 'student_invite_code'

  for (const row of allSettings || []) {
    const codes = row.theme_config?.invite_codes || {}
    if (codes[codeKey] === code) {
      matchedStudioId = row.studio_id
      break
    }
  }

  if (!matchedStudioId) return null

  const { data: studio } = await supabase
    .from('studios')
    .select('id, name')
    .eq('id', matchedStudioId)
    .maybeSingle()

  return { studio_id: matchedStudioId, studio_name: studio?.name || 'Estúdio de Dança' }
}

// GET /api/dance-studio/matricula?code=XXXX&role=student|teacher — resolve código para info do estúdio (público)
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
  } catch (error: any) {
    logger.error('❌ [MATRICULA GET] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/dance-studio/matricula — submissão pública de pré-matrícula (sem auth)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, email, phone, modality } = body

    if (!code || !name?.trim()) {
      return NextResponse.json({ error: 'Código e nome são obrigatórios' }, { status: 400 })
    }

    const normalizedCode = String(code).trim().toUpperCase()
    const result = await resolveCode(normalizedCode)
    if (!result) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 404 })
    }

    const supabase = getAdmin()
    const notes = [
      modality ? `Modalidade: ${modality}` : null,
      'Origem: formulário de pré-matrícula online',
    ].filter(Boolean).join(' | ')

    const { data, error } = await supabase
      .from('leads')
      .insert({
        studio_id: result.studio_id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes,
        stage: 'interested',
      })
      .select('id, name, email, phone, stage')
      .single()

    if (error) throw error

    return NextResponse.json(
      { success: true, lead: data, studio_name: result.studio_name },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error('❌ [MATRICULA POST] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
