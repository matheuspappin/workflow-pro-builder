import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action, studentId, classId, date, status, notes } = await request.json()

    if (!action || !studentId || !classId) {
      return NextResponse.json(
        { error: 'Ação, ID do aluno e ID da turma são obrigatórios' },
        { status: 400 }
      )
    }

    const today = date || new Date().toISOString().split('T')[0]

    switch (action) {
      case 'update_attendance':
        // Atualizar ou inserir registro de presença
        const { data: existingAttendance, error: checkError } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentId)
          .eq('class_id', classId)
          .eq('date', today)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError
        }

        const attendanceData = {
          student_id: studentId,
          class_id: classId,
          date: today,
          status: status || 'absent',
          notes: notes || 'Cancelamento via Chat IA'
        }

        let result
        if (existingAttendance) {
          // Atualizar registro existente
          const { data, error } = await supabase
            .from('attendance')
            .update({
              ...attendanceData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAttendance.id)
            .select()
            .single()

          if (error) throw error
          result = data
        } else {
          // Criar novo registro
          const { data, error } = await supabase
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
        const { data: attendance, error: getError } = await supabase
          .from('attendance')
          .select(`
            *,
            students:student_id(name, email),
            classes:class_id(name, dance_style)
          `)
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

        const { data: studentClasses, error: classesError } = await supabase
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
    console.error('Erro na API de attendance:', error)
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

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'ID do aluno e ID da turma são obrigatórios' },
        { status: 400 }
      )
    }

    const targetDate = date || new Date().toISOString().split('T')[0]

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select(`
        *,
        students:student_id(name, email),
        classes:class_id(name, dance_style)
      `)
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
    console.error('Erro ao buscar attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}