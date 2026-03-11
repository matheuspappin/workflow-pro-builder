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

// GET /api/dance-studio/enrollments?classId=...&date=YYYY-MM-DD
// Retorna alunos matriculados numa turma + status de presença do dia
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('classId')
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  if (!classId) {
    return NextResponse.json({ error: 'classId obrigatório' }, { status: 400 })
  }

  const supabase = getAdmin()

  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('studio_id')
    .eq('id', classId)
    .single()

  if (classError || !classData?.studio_id) {
    return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })
  }

  const access = await checkStudioAccess(request, classData.studio_id)
  if (!access.authorized) return access.response

  try {
    const [enrollResult, attResult] = await Promise.all([
      supabase
        .from('enrollments')
        .select('id, student_id, students(id, name, phone, status)')
        .eq('class_id', classId)
        .eq('status', 'active'),
      supabase
        .from('attendance')
        .select('id, student_id, status, updated_at')
        .eq('class_id', classId)
        .eq('date', date),
    ])

    if (enrollResult.error) throw enrollResult.error

    const attendanceMap: Record<string, any> = {}
    for (const a of attResult.data || []) {
      attendanceMap[a.student_id] = a
    }

    const students = (enrollResult.data || []).map((e: any) => {
      const s = e.students || {}
      const att = attendanceMap[e.student_id]
      return {
        enrollmentId: e.id,
        studentId: e.student_id,
        name: s.name ?? 'Aluno',
        phone: s.phone ?? '',
        photoUrl: '',
        studentStatus: s.status ?? 'active',
        attendanceId: att?.id ?? null,
        attendanceStatus: att?.status ?? null, // null = sem registro ainda
        checkedInAt: att?.updated_at ?? null,
      }
    })

    return NextResponse.json({ students, date })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/ENROLLMENTS] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/dance-studio/enrollments — salva presença de um aluno
export async function POST(request: NextRequest) {
  try {
    const { studentId, classId, studioId, date, status, attendanceId } = await request.json()

    if (!studentId || !classId || !studioId) {
      return NextResponse.json({ error: 'studentId, classId e studioId são obrigatórios' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const targetDate = date || new Date().toISOString().split('T')[0]
    const supabase = getAdmin()

    if (attendanceId) {
      // Atualiza registro existente
      const { error } = await supabase
        .from('attendance')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', attendanceId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // Cria novo registro
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        student_id: studentId,
        class_id: classId,
        studio_id: studioId,
        date: targetDate,
        status: status || 'absent',
      }, { onConflict: 'student_id,class_id,date' })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, attendanceId: data.id })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/ENROLLMENTS POST] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
