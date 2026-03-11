import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function createSSRClient(request: NextRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (n: string) => request.cookies.get(n)?.value,
      set: () => undefined,
      remove: () => undefined,
    },
  })
}

// GET: Retorna PIX do professor logado
export async function GET(request: NextRequest) {
  const supabase = createSSRClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: prof } = await supabaseAdmin
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!prof) return NextResponse.json({ error: 'Professor não encontrado' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('teacher_payout_settings')
    .select('*')
    .eq('professional_id', prof.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || null)
}

// PUT: Salva/atualiza PIX do professor
export async function PUT(request: NextRequest) {
  const supabase = createSSRClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { pix_key, pix_key_type } = body
  const validTypes = ['cpf', 'cnpj', 'email', 'phone', 'random']
  if (!pix_key?.trim() || !validTypes.includes(pix_key_type)) {
    return NextResponse.json({ error: 'pix_key e pix_key_type (cpf|cnpj|email|phone|random) obrigatórios' }, { status: 400 })
  }

  const { data: prof } = await supabaseAdmin
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!prof) return NextResponse.json({ error: 'Professor não encontrado' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('teacher_payout_settings')
    .upsert({
      professional_id: prof.id,
      pix_key: pix_key.trim(),
      pix_key_type,
      is_verified: false,
    }, { onConflict: 'professional_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
