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

// GET: Retorna o código de convite do studio do usuário autenticado (admin/owner)
export async function GET(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Buscar o studio do usuário (owner_id)
    const { data: studio, error } = await supabaseAdmin
      .from('studios')
      .select('id, name, technician_invite_code')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!studio) {
      return NextResponse.json({ error: 'Studio não encontrado' }, { status: 404 })
    }

    // Se não tiver invite_code ainda, gerar um
    if (!studio.technician_invite_code) {
      const newCode = studio.id.replace(/-/g, '').substring(0, 8).toUpperCase()
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('studios')
        .update({ technician_invite_code: newCode })
        .eq('id', studio.id)
        .select('id, name, technician_invite_code')
        .single()

      if (updateError) throw updateError
      return NextResponse.json({ studio: updated, invite_code: newCode })
    }

    return NextResponse.json({
      studio: { id: studio.id, name: studio.name },
      invite_code: studio.technician_invite_code,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: Regenerar o código de convite do studio
export async function POST(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: studio, error: findError } = await supabaseAdmin
      .from('studios')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (findError) throw findError
    if (!studio) return NextResponse.json({ error: 'Studio não encontrado' }, { status: 404 })

    // Gerar novo código aleatório de 8 chars
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let newCode = ''
    for (let i = 0; i < 8; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const { error: updateError } = await supabaseAdmin
      .from('studios')
      .update({ technician_invite_code: newCode })
      .eq('id', studio.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, invite_code: newCode })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
