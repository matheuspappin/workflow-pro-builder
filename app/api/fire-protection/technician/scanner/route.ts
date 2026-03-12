import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function createSSRClient(request: NextRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set() {},
      remove() {},
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Código é obrigatório' }, { status: 400 })
    }

    // Verificar profissional
    const { data: professionals } = await supabaseAdmin
      .from('professionals')
      .select('id, studio_id')
      .eq('user_id', user.id)

    if (!professionals?.length) {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 })
    }

    const studioIds = professionals.map((p) => p.studio_id).filter(Boolean)

    // Buscar por qr_code, id (UUID) ou name parcial
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)

    let query = supabaseAdmin
      .from('assets')
      .select(`
        id,
        name,
        type,
        location,
        status,
        expiration_date,
        qr_code,
        last_inspection_at,
        studio_id,
        student_id,
        customer:students(id, name, phone)
      `)
      .in('studio_id', studioIds)

    if (isUUID) {
      query = query.eq('id', code)
    } else {
      query = query.or(`qr_code.eq.${code},name.ilike.%${code}%`)
    }

    const { data: assets, error } = await query.limit(1)

    if (error) throw error
    if (!assets?.length) {
      return NextResponse.json({ error: 'Extintor não encontrado' }, { status: 404 })
    }

    return NextResponse.json(assets[0])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
