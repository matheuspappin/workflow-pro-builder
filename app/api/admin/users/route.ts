import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger';

async function requireAdminRole(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('users_internal')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  return !!data && ['admin', 'super_admin'].includes(data.role)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await requireAdminRole(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: users, error } = await supabaseAdmin
      .from('users_internal')
      .select(`
        *,
        studio:studios (
          name
        )
      `)
      .order('created_at', { ascending: false })

    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        studio:studios (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error || studentError) {
      logger.warn('⚠️ Erro ao buscar usuários ou alunos:', error?.message || studentError?.message)
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
    logger.error('💥 Erro na API Admin Users:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabaseAdmin
      .from('users_internal')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Apenas super administradores podem criar usuários' }, { status: 403 })
    }

    const { name, email, password, role, studioId, status = 'active' } = await request.json()

    if (!name || !email || !password || !role || (role !== 'super_admin' && !studioId)) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes ou estúdio não selecionado para função não-global' }, { status: 400 })
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, studio_id: role === 'super_admin' ? null : studioId }
    })

    if (authError) {
      if (authError.message.includes('User already registered')) {
        return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 })
      }
      logger.error('💥 Erro ao criar usuário no Auth Supabase:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Inserir na tabela users_internal com o ID do auth.users
    const { data: newUser, error } = await supabaseAdmin
      .from('users_internal')
      .insert({
        id: authUser.user?.id, // Usar o ID retornado pela criação no auth.users
        name,
        email,
        phone: null, // Pode ser adicionado posteriormente
        role,
        studio_id: role === 'super_admin' ? null : studioId, // studio_id é nulo para super_admin
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
    logger.error('💥 Erro ao criar usuário admin:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
