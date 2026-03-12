import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

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

    const accessPost = await checkStudioAccess(request, studio_id)
    if (!accessPost.authorized) return accessPost.response

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
