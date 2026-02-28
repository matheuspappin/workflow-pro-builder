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
      // Busca turmas em que o aluno está matriculado (apenas do studio atual)
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          enrolled_at,
          class:classes(
            id, name, dance_style, level, schedule, status, studio_id,
            teacher:professionals(id, name)
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')

      if (error) throw error

      const classes = (enrollments || [])
        .filter((e: any) => e.class && e.class.studio_id === studioId)
        .map((e: any) => ({
          enrollmentId: e.id,
          enrolledAt: e.enrolled_at,
          ...e.class,
          teacherName: e.class.teacher?.name ?? 'Não definido',
          scheduleSummary: buildScheduleSummary(e.class.schedule ?? []),
        }))

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
      query = query.eq('teacher_id', teacherId)
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
