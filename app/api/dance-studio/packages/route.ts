import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/dance-studio/packages?studioId=...
// Retorna pacotes de crédito ativos do estúdio
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')

  if (!studioId) {
    return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
  }

  const supabase = getAdmin()

  try {
    const { data, error } = await supabase
      .from('lesson_packages')
      .select('id, name, description, lessons_count, price, validity_days, is_active')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) throw error

    return NextResponse.json({ packages: data || [] })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/PACKAGES GET] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/dance-studio/packages
// Cria um novo pacote de créditos para o estúdio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioId, name, lessons_count, price, validity_days, description } = body || {}

    if (!studioId || !name || !lessons_count || !price) {
      return NextResponse.json(
        { error: 'studioId, name, lessons_count e price são obrigatórios' },
        { status: 400 },
      )
    }

    const supabase = getAdmin()
    const { data, error } = await supabase
      .from('lesson_packages')
      .insert({
        studio_id: studioId,
        name,
        description: description || null,
        lessons_count: Number(lessons_count),
        price: Number(price),
        validity_days: validity_days ? Number(validity_days) : 90,
        is_active: true,
      })
      .select('id, name, description, lessons_count, price, validity_days, is_active')
      .single()

    if (error) throw error

    return NextResponse.json({ package: data }, { status: 201 })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/PACKAGES POST] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/dance-studio/packages
// Remove um pacote do estúdio
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, studioId } = body || {}

    if (!id || !studioId) {
      return NextResponse.json({ error: 'id e studioId são obrigatórios' }, { status: 400 })
    }

    const supabase = getAdmin()
    const { error } = await supabase
      .from('lesson_packages')
      .delete()
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/PACKAGES DELETE] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
