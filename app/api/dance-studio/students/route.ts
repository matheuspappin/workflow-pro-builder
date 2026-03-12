import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import logger from '@/lib/logger'
import { checkStudioAccess } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const CreateStudentSchema = z.object({
  studioId: z.string().uuid('studioId deve ser um UUID válido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200).trim(),
  email: z.string().email('E-mail inválido').optional().nullable(),
  phone: z.string().min(8).max(20).optional().nullable(),
})

const UpdateStudentSchema = z.object({
  id: z.string().uuid('id deve ser um UUID válido'),
  studioId: z.string().uuid('studioId deve ser um UUID válido'),
  name: z.string().min(2).max(200).trim().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(8).max(20).optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  email_2: z.string().email().optional().nullable(),
  phone_1: z.string().max(20).optional().nullable(),
  phone_2: z.string().max(20).optional().nullable(),
  phone_3: z.string().max(20).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  language: z.string().max(10).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  email_subscriber_status: z.string().max(50).optional().nullable(),
  sms_subscriber_status: z.string().max(50).optional().nullable(),
  last_activity_description: z.string().max(500).optional().nullable(),
  last_activity_at: z.string().datetime().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  document: z.string().max(20).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
})

// POST /api/dance-studio/students
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = CreateStudentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { studioId, name, email, phone } = parsed.data

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data, error } = await supabase
      .from('students')
      .insert({ studio_id: studioId, name, email: email ?? null, phone: phone ?? null, status: 'active' })
      .select('id, name, email, phone, status')
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: unknown) {
    logger.error('❌ [DANCE-STUDIO/STUDENTS POST] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// PATCH /api/dance-studio/students
export async function PATCH(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = UpdateStudentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { id, studioId, ...fields } = parsed.data

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) updates[key] = value
  }

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
  } catch (error: unknown) {
    logger.error('❌ [DANCE-STUDIO/STUDENTS PATCH] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// GET /api/dance-studio/students?studioId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')

  if (!studioId) {
    return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
  }

  // Validação básica do UUID antes de qualquer query
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studioId)) {
    return NextResponse.json({ error: 'studioId inválido' }, { status: 400 })
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
  } catch (error: unknown) {
    logger.error('❌ [DANCE-STUDIO/STUDENTS] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
