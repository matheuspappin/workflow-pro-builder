import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { query, table, filters, limit } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query é obrigatória' },
        { status: 400 }
      )
    }

    logger.info('🔍 Executando query:', query, { table, filters, limit })

    let result

    // Queries predefinidas seguras
    switch (query) {
      case 'get_student_details':
        result = await supabase
          .from('students')
          .select('*')
          .eq('id', filters?.id)
          .single()
        break

      case 'get_recent_students':
        result = await supabase
          .from('students')
          .select('id, name, email, phone, enrollment_date, status')
          .order('enrollment_date', { ascending: false })
          .limit(limit || 10)
        break

      case 'get_active_teachers':
        result = await supabase
          .from('teachers')
          .select('id, name, email, specialties, hourly_rate, hire_date')
          .eq('status', 'active')
          .order('hire_date', { ascending: false })
        break

      case 'get_classes_with_students':
        result = await supabase
          .from('classes')
          .select(`
            id, name, dance_style, level, max_students, current_students,
            teachers:teacher_id(name),
            enrollments:enrollments(count)
          `)
          .eq('status', 'active')
        break

      case 'get_student_financial':
        result = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', filters?.studentId)
          .order('due_date', { ascending: false })
          .limit(limit || 12)
        break

      case 'get_recent_sessions':
        result = await supabase
          .from('sessions')
          .select(`
            id, scheduled_date, status, content_taught, attendance_count,
            classes:classes(name, dance_style),
            teachers:actual_teacher_id(name)
          `)
          .order('scheduled_date', { ascending: false })
          .limit(limit || 5)
        break

      case 'search_students':
        const searchTerm = filters?.search || ''
        result = await supabase
          .from('students')
          .select('id, name, email, phone, status')
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .limit(limit || 20)
        break

      default:
        return NextResponse.json(
          { error: 'Query não reconhecida' },
          { status: 400 }
        )
    }

    if (result.error) {
      logger.error('Erro na query:', result.error)
      return NextResponse.json(
        { error: 'Erro ao executar query', details: result.error.message },
        { status: 500 }
      )
    }

    logger.info('✅ Query executada com sucesso, retornando dados')

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0
    })

  } catch (error) {
    logger.error('Erro na API de query:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}