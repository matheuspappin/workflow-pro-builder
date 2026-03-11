import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'
import { checkStudioAccess } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// POST /api/dance-studio/students
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { studioId, name, email, phone } = body

  if (!studioId || !name) {
    return NextResponse.json({ error: 'studioId e name são obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data, error } = await supabase
      .from('students')
      .insert({ studio_id: studioId, name, email: email || null, phone: phone || null, status: 'active' })
      .select('id, name, email, phone, status')
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/STUDENTS POST] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/dance-studio/students — atualizar aluno (inclui todos os campos CRM)
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const {
    id, studioId, name, email, phone, status,
    first_name, last_name, email_2, phone_1, phone_2, phone_3,
    tags, source, language, category, company, address,
    email_subscriber_status, sms_subscriber_status,
    last_activity_description, last_activity_at,
    birth_date, document, metadata,
  } = body

  if (!id || !studioId) {
    return NextResponse.json({ error: 'id e studioId são obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (email !== undefined) updates.email = email ?? null
  if (phone !== undefined) updates.phone = phone ?? null
  if (status !== undefined && ['active', 'inactive', 'suspended'].includes(status)) updates.status = status
  if (first_name !== undefined) updates.first_name = first_name ?? null
  if (last_name !== undefined) updates.last_name = last_name ?? null
  if (email_2 !== undefined) updates.email_2 = email_2 ?? null
  if (phone_1 !== undefined) updates.phone_1 = phone_1 ?? null
  if (phone_2 !== undefined) updates.phone_2 = phone_2 ?? null
  if (phone_3 !== undefined) updates.phone_3 = phone_3 ?? null
  if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : null
  if (source !== undefined) updates.source = source ?? null
  if (language !== undefined) updates.language = language ?? null
  if (category !== undefined) updates.category = category ?? null
  if (company !== undefined) updates.company = company ?? null
  if (address !== undefined) updates.address = address ?? null
  if (email_subscriber_status !== undefined) updates.email_subscriber_status = email_subscriber_status ?? null
  if (sms_subscriber_status !== undefined) updates.sms_subscriber_status = sms_subscriber_status ?? null
  if (last_activity_description !== undefined) updates.last_activity_description = last_activity_description ?? null
  if (last_activity_at !== undefined) updates.last_activity_at = last_activity_at ?? null
  if (birth_date !== undefined) updates.birth_date = birth_date ?? null
  if (document !== undefined) updates.document = document ?? null
  if (metadata !== undefined && typeof metadata === 'object') updates.metadata = metadata

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .eq('studio_id', studioId)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

    return NextResponse.json(data)
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/STUDENTS PATCH] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/dance-studio/students?studioId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')

  if (!studioId) {
    return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('studio_id', studioId)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(students || [])
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/STUDENTS] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
