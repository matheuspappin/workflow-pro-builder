import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Configuração ausente', 
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório na query string (?email=...)' }, { status: 400 })
    }

    const results: any = {
      email,
      tables: {}
    }

    // 1. Verificar users_internal
    const { data: internal, error: internalError } = await supabase
      .from('users_internal')
      .select('*, studio:studios(*)')
      .eq('email', email)
    
    results.tables.users_internal = { data: internal, error: internalError }

    // 2. Verificar teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('*, studio:studios(*)')
      .eq('email', email)
    
    results.tables.teachers = { data: teachers, error: teachersError }

    // 3. Verificar students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*, studio:studios(*)')
      .eq('email', email)
    
    results.tables.students = { data: students, error: studentsError }

    return NextResponse.json(results)

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
