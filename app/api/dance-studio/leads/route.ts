import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'
import { checkStudioAccess } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/dance-studio/leads?studioId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')

  if (!studioId) {
    return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/LEADS GET] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/dance-studio/leads — atualiza stage de um lead
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, stage, studioId } = body

  if (!id || !stage || !studioId) {
    return NextResponse.json({ error: 'id, stage e studioId são obrigatórios' }, { status: 400 })
  }

  const validStages = ['new', 'contacted', 'trial_scheduled', 'trial_done', 'negotiating', 'won', 'lost']
  if (!validStages.includes(stage)) {
    return NextResponse.json({ error: 'Stage inválido' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ stage })
      .eq('id', id)
      .eq('studio_id', studioId)
      .select('id, name, email, phone, stage, notes')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/LEADS PATCH] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/dance-studio/leads
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { studioId, name, email, phone, notes } = body

  if (!studioId || !name) {
    return NextResponse.json({ error: 'studioId e name são obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        studio_id: studioId,
        name,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
        stage: 'new',
      })
      .select('id, name, email, phone, stage, notes')
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/LEADS POST] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
