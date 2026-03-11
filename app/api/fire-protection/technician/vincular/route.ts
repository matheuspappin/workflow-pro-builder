import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isProfessionalsLimitReachedForStudio } from '@/lib/studio-limits'

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

// GET: Retorna o vínculo atual do técnico com empresa
export async function GET(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: professional, error } = await supabaseAdmin
      .from('professionals')
      .select('id, name, studio_id, status, professional_type, company_name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error

    if (!professional || !professional.studio_id) {
      return NextResponse.json({ linked: false })
    }

    // Buscar dados do studio vinculado
    const { data: studio } = await supabaseAdmin
      .from('studios')
      .select('id, name, technician_invite_code')
      .eq('id', professional.studio_id)
      .maybeSingle()

    return NextResponse.json({
      linked: true,
      professional_id: professional.id,
      studio: studio ? {
        id: studio.id,
        name: studio.name,
        invite_code: studio.technician_invite_code,
      } : null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: Vincular técnico a uma empresa via código de convite
export async function POST(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const inviteCode = (body.invite_code || '').trim().toUpperCase()

    if (!inviteCode || inviteCode.length < 4) {
      return NextResponse.json({ error: 'Código de convite inválido' }, { status: 400 })
    }

    // Buscar studio pelo código
    const { data: studio, error: studioError } = await supabaseAdmin
      .from('studios')
      .select('id, name, technician_invite_code')
      .eq('technician_invite_code', inviteCode)
      .maybeSingle()

    if (studioError) throw studioError
    if (!studio) {
      return NextResponse.json({ error: 'Empresa não encontrada. Verifique o código informado.' }, { status: 404 })
    }

    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Técnico'
    const userEmail = user.email || ''

    // Verificar se já existe um registro ativo para este usuário neste studio
    const { data: existing } = await supabaseAdmin
      .from('professionals')
      .select('id, status, studio_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      if (existing.studio_id === studio.id && existing.status === 'active') {
        return NextResponse.json({ error: 'Você já está vinculado a esta empresa.' }, { status: 409 })
      }
      // Atualizar registro existente para o novo studio
      const { error: updateError } = await supabaseAdmin
        .from('professionals')
        .update({
          studio_id: studio.id,
          company_name: studio.name,
          status: 'active',
          name: userName,
          email: userEmail,
        })
        .eq('id', existing.id)

      if (updateError) throw updateError
    } else {
      const { count } = await supabaseAdmin
        .from('professionals')
        .select('*', { count: 'exact', head: true })
        .eq('studio_id', studio.id)
        .eq('status', 'active')
      if (await isProfessionalsLimitReachedForStudio(studio.id, count ?? 0)) {
        return NextResponse.json({ error: 'A empresa atingiu o limite de profissionais para o plano atual.' }, { status: 403 })
      }
      // Criar novo registro de professional
      const { error: insertError } = await supabaseAdmin
        .from('professionals')
        .insert({
          studio_id: studio.id,
          user_id: user.id,
          name: userName,
          email: userEmail,
          phone: user.user_metadata?.phone || null,
          professional_type: 'technician',
          company_name: studio.name,
          status: 'active',
        })

      if (insertError) throw insertError
    }

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

// DELETE: Desvincular técnico da empresa atual
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { error } = await supabaseAdmin
      .from('professionals')
      .update({ status: 'inactive', studio_id: null })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Desvinculado da empresa com sucesso.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
