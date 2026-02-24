import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userId = user.id

    // Buscar student pelo id (students.id = auth.users.id)
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, studio_id, name, email, phone')
      .eq('id', userId)
      .maybeSingle()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const studioId = student.studio_id

    // Buscar extintores (assets) do cliente
    const { data: assets } = await supabaseAdmin
      .from('assets')
      .select('id, name, type, expiration_date, status, location')
      .eq('studio_id', studioId)
      .eq('student_id', userId)

    const now = new Date()
    const in30Days = new Date(now)
    in30Days.setDate(in30Days.getDate() + 30)

    const ativos = (assets || []).filter((a) => a.status === 'ok' || !a.status).length
    const aVencer = (assets || []).filter((a) => {
      const exp = a.expiration_date ? new Date(a.expiration_date) : null
      return exp && exp > now && exp <= in30Days
    }).length
    const vencidos = (assets || []).filter((a) => {
      const exp = a.expiration_date ? new Date(a.expiration_date) : null
      return exp && exp <= now
    }).length

    // Buscar vistorias do cliente
    const { data: vistorias } = await supabaseAdmin
      .from('service_orders')
      .select('id, status')
      .eq('studio_id', studioId)
      .eq('customer_id', userId)
      .eq('project_type', 'vistoria')

    const concluidas = (vistorias || []).filter((v) => v.status === 'finished').length

    // Buscar dados do estúdio (nome, telefone se existir em settings ou metadata)
    let studioContact: { phone?: string; name?: string } = {}
    const { data: studio } = await supabaseAdmin
      .from('studios')
      .select('name')
      .eq('id', studioId)
      .maybeSingle()
    studioContact.name = studio?.name

    try {
      const { data: orgSettings } = await supabaseAdmin
        .from('organization_settings')
        .select('theme_config')
        .eq('studio_id', studioId)
        .maybeSingle()
      const config = (orgSettings?.theme_config as Record<string, unknown>) || {}
      if (config.phone) studioContact.phone = String(config.phone)
    } catch {
      // theme_config pode não ter phone
    }

    return NextResponse.json({
      student: { id: student.id, name: student.name, email: student.email, phone: student.phone },
      stats: { ativos, aVencer, vencidos, concluidas },
      assets: assets || [],
      vistorias: vistorias || [],
      studioContact,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
