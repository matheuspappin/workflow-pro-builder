import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { action, studentId, classId, date, status, notes, studioId } = await request.json()

    if (!action || !studentId || !classId || !studioId) {
      return NextResponse.json(
        { error: 'Ação, ID do aluno, ID da turma e studioId são obrigatórios' },
        { status: 400 }
      )
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const today = date || new Date().toISOString().split('T')[0]

    switch (action) {
      case 'update_attendance':
        // Atualizar ou inserir registro de presença
        const { data: existingAttendance, error: checkError } = await supabaseAdmin
          .from('attendance')
          .select('*')
          .eq('studio_id', studioId)
          .eq('student_id', studentId)
          .eq('class_id', classId)
          .eq('date', today)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError
        }

        const attendanceData = {
          studio_id: studioId,
          student_id: studentId,
          class_id: classId,
          date: today,
          status: status || 'absent',
          notes: notes || 'Cancelamento via Chat IA'
        }

        let result
        if (existingAttendance) {
          // Atualizar registro existente
          const { data, error } = await supabaseAdmin
            .from('attendance')
            .update({
              ...attendanceData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAttendance.id)
            .eq('studio_id', studioId)
            .select()
            .single()

          if (error) throw error
          result = data
        } else {
          // Criar novo registro
          const { data, error } = await supabaseAdmin
            .from('attendance')
            .insert(attendanceData)
            .select()
            .single()

          if (error) throw error
          result = data
        }

        return NextResponse.json({
          success: true,
          message: 'Presença atualizada com sucesso',
          data: result
        })

      case 'get_attendance':
        // Buscar presença de hoje
        const { data: attendance, error: getError } = await supabaseAdmin
          .from('attendance')
          .select(`
            *,
            students:student_id(name, email),
            classes:class_id(name, dance_style)
          `)
          .eq('studio_id', studioId)
          .eq('student_id', studentId)
          .eq('class_id', classId)
          .eq('date', today)
          .single()

        if (getError && getError.code !== 'PGRST116') {
          throw getError
        }

        return NextResponse.json({
          success: true,
          data: attendance || null
        })

      case 'list_student_classes':
        // Listar aulas do aluno para hoje
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const { data: studentClasses, error: classesError } = await supabaseAdmin
          .from('enrollments')
          .select(`
            *,
            classes:class_id(
              id,
              name,
              dance_style,
              schedule
            )
          `)
          .eq('student_id', studentId)
          .eq('studio_id', studioId)
          .eq('status', 'active')

        if (classesError) throw classesError

        // Filtrar aulas de hoje baseado no schedule
        const todayClasses = studentClasses?.filter(enrollment => {
          if (!enrollment.classes?.schedule) return false

          const schedule = Array.isArray(enrollment.classes.schedule)
            ? enrollment.classes.schedule
            : [enrollment.classes.schedule]

          const today = new Date().getDay() // 0 = Domingo, 1 = Segunda, etc.
          return schedule.some((s: any) => s.day_of_week === today)
        }) || []

        return NextResponse.json({
          success: true,
          data: todayClasses
        })

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    logger.error('Erro na API de attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')
    const studioId = searchParams.get('studioId')

    if (!studentId || !classId || !studioId) {
      return NextResponse.json(
        { error: 'ID do aluno, ID da turma e studioId são obrigatórios' },
        { status: 400 }
      )
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const targetDate = date || new Date().toISOString().split('T')[0]

    const { data: attendance, error } = await supabaseAdmin
      .from('attendance')
      .select(`
        *,
        students:student_id(name, email),
        classes:class_id(name, dance_style)
      `)
      .eq('studio_id', studioId)
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('date', targetDate)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: attendance || null
    })

  } catch (error: any) {
    logger.error('Erro ao buscar attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}