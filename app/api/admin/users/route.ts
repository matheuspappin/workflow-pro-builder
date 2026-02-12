import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: users, error } = await supabase
      .from('users_internal')
      .select(`
        *,
        studio:studios (
          name
        )
      `)
      .order('created_at', { ascending: false })

    const { data: students, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        studio:studios (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error || studentError) {
      console.warn('⚠️ Erro ao buscar usuários ou alunos:', error?.message || studentError?.message)
      return NextResponse.json([])
    }

    // Formatar para o frontend unindo as duas listas
    const formattedInternal = (users || []).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "N/A",
      role: user.role,
      studio: user.studio?.name || "Desconhecido",
      status: user.status,
      lastLogin: user.updated_at,
      type: 'internal'
    }))

    const formattedStudents = (students || []).map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone || "N/A",
      role: 'student',
      studio: student.studio?.name || "Desconhecido",
      status: student.status,
      lastLogin: student.updated_at,
      type: 'student'
    }))

    const allUsers = [...formattedInternal, ...formattedStudents]

    return NextResponse.json(allUsers)
  } catch (error: any) {
    console.error('💥 Erro na API Admin Users:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, studioId, status = 'active' } = await request.json()

    if (!name || !email || !password || !role || !studioId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const { data: newUser, error } = await supabase
      .from('users_internal')
      .insert({
        name,
        email,
        password,
        role,
        studio_id: studioId,
        status
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true, user: newUser })
  } catch (error: any) {
    console.error('💥 Erro ao criar usuário admin:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
