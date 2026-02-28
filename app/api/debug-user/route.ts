import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' || process.env.DEBUG_MODE !== 'true') {
    return NextResponse.json({ error: 'Endpoint não disponível' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: internalUser } = await supabaseAdmin
      .from('users_internal')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!internalUser || internalUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso restrito a super administradores' }, { status: 403 })
    }

    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório na query string (?email=...)' }, { status: 400 })
    }

    const results: any = { email, tables: {} }

    const { data: internal, error: internalError } = await supabaseAdmin
      .from('users_internal')
      .select('id, name, email, role, studio_id, status, created_at')
      .eq('email', email)

    results.tables.users_internal = { data: internal, error: internalError }

    const { data: teachers, error: teachersError } = await supabaseAdmin
      .from('teachers')
      .select('id, name, email, professional_type, studio_id, status')
      .eq('email', email)

    results.tables.teachers = { data: teachers, error: teachersError }

    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, name, email, studio_id, status')
      .eq('email', email)

    results.tables.students = { data: students, error: studentsError }

    return NextResponse.json(results)

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
