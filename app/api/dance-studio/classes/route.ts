import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'
import { checkStudioAccess } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function buildScheduleSummary(schedule: any[]): string {
  if (!Array.isArray(schedule) || schedule.length === 0) return 'Sem horário'
  return schedule
    .map((s: any) => `${DAY_NAMES[s.day_of_week] ?? '?'} ${s.start_time ?? ''}`)
    .join(', ')
}

// POST /api/dance-studio/classes
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { studioId, name, dance_style, level: rawLevel, teacher_id, schedule } = body
  const VALID_LEVELS = ['beginner', 'intermediate', 'advanced']
  const level = rawLevel && VALID_LEVELS.includes(rawLevel) ? rawLevel : null

  if (!studioId || !name) {
    return NextResponse.json({ error: 'studioId e name são obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data, error } = await supabase
      .from('classes')
      .insert({
        studio_id: studioId,
        name,
        dance_style: dance_style || null,
        level: level || null,
        professional_id: teacher_id || null,
        schedule: schedule || [],
        status: 'active',
      })
      .select('id, name, dance_style, level, schedule, status')
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/CLASSES POST] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/dance-studio/classes?studioId=...&teacherId=...&studentId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')
  const teacherId = searchParams.get('teacherId')   // filtra por professor
  const studentId = searchParams.get('studentId')   // filtra por aluno (matrículas)

  if (!studioId) {
    return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    if (studentId) {
      // 1. Busca matrículas (enrollments) do aluno neste studio
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, class_id, enrollment_date, created_at')
        .eq('student_id', studentId)
        .eq('studio_id', studioId)
        .eq('status', 'active')

      if (enrollError) throw enrollError

      const classIds = (enrollments || []).map((e: any) => e.class_id).filter(Boolean)
      const enrollmentByClass = new Map((enrollments || []).map((e: any) => [e.class_id, e]))

      // 2. Se não houver enrollments, fallback: busca classes via attendance (reservas/presenças)
      let classIdsToFetch = classIds
      if (classIdsToFetch.length === 0) {
        const { data: attendances } = await supabase
          .from('attendance')
          .select('class_id')
          .eq('student_id', studentId)
          .eq('studio_id', studioId)
        const seen = new Set<string>()
        classIdsToFetch = (attendances || [])
          .map((a: any) => a.class_id)
          .filter((id: string) => id && !seen.has(id) && seen.add(id))
      }

      if (classIdsToFetch.length === 0) {
        return NextResponse.json({ classes: [] })
      }

      // 3. Busca dados completos das turmas (com professor)
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id, name, dance_style, level, schedule, status, studio_id,
          professional:professionals(id, name)
        `)
        .in('id', classIdsToFetch)
        .eq('studio_id', studioId)
        .eq('status', 'active')

      if (classesError) throw classesError

      const classes = (classesData || []).map((cls: any) => {
        const enrollment = enrollmentByClass.get(cls.id)
        const { professional, ...clsRest } = cls
        return {
          ...clsRest,
          enrollmentId: enrollment?.id,
          enrolledAt: enrollment?.enrollment_date || enrollment?.created_at,
          teacherName: professional?.name ?? 'Não definido',
          scheduleSummary: buildScheduleSummary(cls.schedule ?? []),
        }
      })

      return NextResponse.json({ classes })
    }

    // Busca turmas do estúdio (com filtro opcional por professor)
    let query = supabase
      .from('classes')
      .select(`
        id, name, dance_style, level, schedule, status, max_students, created_at,
        teacher:professionals(id, name),
        enrollments(count)
      `)
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('name')

    if (teacherId) {
      query = query.eq('professional_id', teacherId)
    }

    const { data: classes, error } = await query

    if (error) throw error

    const result = (classes || []).map((cls: any) => ({
      ...cls,
      teacherName: cls.teacher?.name ?? 'Não definido',
      enrolledCount: cls.enrollments?.[0]?.count ?? 0,
      scheduleSummary: buildScheduleSummary(cls.schedule ?? []),
    }))

    return NextResponse.json({ classes: result })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/CLASSES] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/dance-studio/classes — atualizar turma
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, studioId, name, dance_style, level: rawLevel, teacher_id, schedule, max_students, description } = body
  const VALID_LEVELS = ['beginner', 'intermediate', 'advanced']
  const level = rawLevel && VALID_LEVELS.includes(rawLevel) ? rawLevel : null

  if (!id || !studioId) {
    return NextResponse.json({ error: 'id e studioId são obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (dance_style !== undefined) updates.dance_style = dance_style
  if (level !== undefined) updates.level = level || null
  if (teacher_id !== undefined) updates.professional_id = teacher_id || null
  if (schedule !== undefined) updates.schedule = schedule || []
  if (max_students !== undefined) updates.max_students = max_students
  if (description !== undefined) updates.description = description || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .eq('studio_id', studioId)
      .select('id, name, dance_style, level, schedule, status, max_students, description')
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })

    return NextResponse.json(data)
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/CLASSES PATCH] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
