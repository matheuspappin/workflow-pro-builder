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
    const studioId = searchParams.get('studioId')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    // Verificar se o usuário tem acesso ao studio (owner ou professional)
    const studioIdFromMeta = user.user_metadata?.studio_id
    const { data: ownedStudio } = await supabaseAdmin
      .from('studios')
      .select('id')
      .eq('id', studioId)
      .eq('owner_id', user.id)
      .maybeSingle()
    const { data: professional } = await supabaseAdmin
      .from('professionals')
      .select('studio_id')
      .eq('user_id', user.id)
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .maybeSingle()

    const hasAccess = ownedStudio || professional || studioIdFromMeta === studioId
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sem permissão para este studio' }, { status: 403 })
    }

    const { data: assets, error } = await supabaseAdmin
      .from('assets')
      .select(`
        id,
        name,
        type,
        qr_code,
        serial_number,
        capacity,
        agent_type,
        location,
        status,
        expiration_date,
        last_inspection_at,
        manufacture_date,
        studio_id,
        student_id,
        customer:students(id, name, phone)
      `)
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(assets || [])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar extintores'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const {
      studio_id,
      student_id,
      name,
      type,
      serial_number,
      capacity,
      agent_type,
      location,
      expiration_date,
      manufacture_date,
      last_inspection_at,
    } = body

    if (!studio_id || !name) {
      return NextResponse.json({ error: 'studio_id e name são obrigatórios' }, { status: 400 })
    }

    // Verificar permissão
    const studioIdFromMeta = user.user_metadata?.studio_id
    const { data: ownedStudio } = await supabaseAdmin
      .from('studios')
      .select('id')
      .eq('id', studio_id)
      .eq('owner_id', user.id)
      .maybeSingle()
    const { data: professional } = await supabaseAdmin
      .from('professionals')
      .select('studio_id')
      .eq('user_id', user.id)
      .eq('studio_id', studio_id)
      .eq('status', 'active')
      .maybeSingle()

    const hasAccess = ownedStudio || professional || studioIdFromMeta === studio_id
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sem permissão para criar extintores neste studio' }, { status: 403 })
    }

    const qr_code = crypto.randomUUID()

    const { data: newAsset, error } = await supabaseAdmin
      .from('assets')
      .insert({
        studio_id,
        student_id: student_id || null,
        name,
        type: type || agent_type || null,
        serial_number: serial_number || null,
        capacity: capacity || null,
        agent_type: agent_type || null,
        location: location || null,
        expiration_date: expiration_date || null,
        manufacture_date: manufacture_date || null,
        last_inspection_at: last_inspection_at || null,
        qr_code,
        status: 'ok',
        metadata: {},
      })
      .select(`
        id,
        name,
        type,
        qr_code,
        serial_number,
        capacity,
        agent_type,
        location,
        status,
        expiration_date,
        last_inspection_at,
        manufacture_date,
        studio_id,
        student_id,
        customer:students(id, name, phone)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(newAsset)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao cadastrar extintor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
