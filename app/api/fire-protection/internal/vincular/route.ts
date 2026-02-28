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

const CODE_COLUMNS: Record<string, string> = {
  seller: 'seller_invite_code',
  finance: 'finance_invite_code',
  receptionist: 'reception_invite_code',
}

// POST: Vincular usuário interno (seller/finance/receptionist) via código
export async function POST(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const role = (body.role || 'seller') as string
    const inviteCode = (body.invite_code || '').trim().toUpperCase()

    if (!['seller', 'finance', 'receptionist'].includes(role)) {
      return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
    }
    if (!inviteCode || inviteCode.length < 4) {
      return NextResponse.json({ error: 'Código de convite inválido' }, { status: 400 })
    }

    const col = CODE_COLUMNS[role]
    const { data: studio, error: studioError } = await supabaseAdmin
      .from('studios')
      .select('id, name')
      .eq(col, inviteCode)
      .maybeSingle()

    if (studioError) throw studioError
    if (!studio) {
      return NextResponse.json({ error: 'Empresa não encontrada. Verifique o código informado.' }, { status: 404 })
    }

    const { data: existing } = await supabaseAdmin
      .from('users_internal')
      .select('id, studio_id')
      .eq('id', user.id)
      .maybeSingle()

    if (existing) {
      if (existing.studio_id === studio.id) {
        return NextResponse.json({ error: 'Você já está vinculado a esta empresa.' }, { status: 409 })
      }
      const { error: updateError } = await supabaseAdmin
        .from('users_internal')
        .update({ studio_id: studio.id })
        .eq('id', user.id)
      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('users_internal')
        .insert({
          id: user.id,
          studio_id: studio.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          role,
          status: 'active',
        })
      if (insertError) throw insertError
    }

    await supabase.auth.updateUser({
      data: { studio_id: studio.id, role },
    })

    return NextResponse.json({
      success: true,
      message: `Vinculado com sucesso à empresa ${studio.name}`,
      studio: { id: studio.id, name: studio.name },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
