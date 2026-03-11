import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

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

// GET: Lista saques do professor OU do estúdio (se studioId)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')

  const supabase = createSSRClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (studioId) {
    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response
    const { data, error } = await supabaseAdmin
      .from('teacher_withdrawals')
      .select('*, professionals(id, name, email)')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  }

  const { data: prof } = await supabaseAdmin
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!prof) return NextResponse.json({ error: 'Professor não encontrado' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('teacher_withdrawals')
    .select('*')
    .eq('professional_id', prof.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST: Solicitar saque (professor)
export async function POST(request: NextRequest) {
  const supabase = createSSRClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { amount, pix_key, pix_key_type } = body
  const validTypes = ['cpf', 'cnpj', 'email', 'phone', 'random']
  if (!amount || amount <= 0 || !pix_key?.trim() || !validTypes.includes(pix_key_type)) {
    return NextResponse.json({ error: 'amount, pix_key e pix_key_type obrigatórios' }, { status: 400 })
  }

  const { data: prof } = await supabaseAdmin
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!prof) return NextResponse.json({ error: 'Professor não encontrado' }, { status: 404 })

  const { data, error } = await supabaseAdmin.rpc('request_teacher_withdrawal', {
    p_professional_id: prof.id,
    p_amount: Number(amount),
    p_pix_key: pix_key.trim(),
    p_pix_key_type: pix_key_type,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (data && !(data as any).success) {
    return NextResponse.json({ error: (data as any).error || 'Erro ao solicitar saque' }, { status: 400 })
  }
  return NextResponse.json(data || { success: true })
}

// PATCH: Marcar saque como pago (estúdio - processo manual)
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { studioId, withdrawalId, status } = body
  if (!studioId || !withdrawalId) {
    return NextResponse.json({ error: 'studioId e withdrawalId obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const validStatus = ['completed', 'failed']
  if (!status || !validStatus.includes(status)) {
    return NextResponse.json({ error: 'status deve ser completed ou failed' }, { status: 400 })
  }

  const update: Record<string, unknown> = { status }
  if (status === 'completed') update.processed_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('teacher_withdrawals')
    .update(update)
    .eq('id', withdrawalId)
    .eq('studio_id', studioId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
