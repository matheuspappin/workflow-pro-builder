import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

const stageToEtapa: Record<string, string> = {
  new: 'novo',
  contacted: 'qualificado',
  trial_scheduled: 'proposta',
  trial_done: 'proposta',
  negotiating: 'negociacao',
  won: 'ganho',
  lost: 'perdido',
}

const etapaToStage: Record<string, string> = {
  novo: 'new',
  qualificado: 'contacted',
  proposta: 'trial_scheduled',
  negociacao: 'negotiating',
  ganho: 'won',
  perdido: 'lost',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const etapa = searchParams.get('etapa')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    let query = supabaseAdmin
      .from('leads')
      .select('id, name, email, phone, source, stage, notes, interest_level, created_at')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (etapa && etapa !== 'todos') {
      const stage = etapaToStage[etapa]
      if (stage) query = query.eq('stage', stage)
    }

    const { data, error } = await query
    if (error) throw error

    const mapped = (data || []).map((l: any) => {
      // Extrair valor_estimado dos notes
      let valorEstimado = 0
      if (l.notes) {
        const match = l.notes.match(/R\$\s*([\d.,]+)/)
        if (match) {
          valorEstimado = parseFloat(match[1].replace(/\./g, '').replace(',', '.')) || 0
        }
      }

      return {
        id: l.id,
        nome: l.name,
        email: l.email || '',
        telefone: l.phone || '',
        origem: l.source || 'Direto',
        etapa: stageToEtapa[l.stage || 'new'] || 'novo',
        valor_estimado: valorEstimado || (l.interest_level || 1) * 2000,
        notes: l.notes || '',
        criado: new Date(l.created_at).toLocaleDateString('pt-BR'),
        created_at: l.created_at,
      }
    })

    return NextResponse.json(mapped)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioId, studio_id, nome, email, telefone, origem, valor_estimado, etapa, notes } = body

    const sid = studioId || studio_id
    if (!sid) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    const access = await checkStudioAccess(request, sid)
    if (!access.authorized) return access.response

    const notesText = [
      notes || '',
      valor_estimado ? `Valor estimado: R$ ${Number(valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
    ].filter(Boolean).join('\n').trim()

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        studio_id: sid,
        name: nome,
        email: email || null,
        phone: telefone || null,
        source: origem || 'Direto',
        stage: etapaToStage[etapa || 'novo'] || 'new',
        status: 'active',
        notes: notesText || null,
        interest_level: valor_estimado ? Math.min(5, Math.ceil(Number(valor_estimado) / 5000)) : 1,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      id: data.id,
      nome: data.name,
      email: data.email || '',
      telefone: data.phone || '',
      origem: data.source || 'Direto',
      etapa: stageToEtapa[data.stage || 'new'] || 'novo',
      valor_estimado: valor_estimado || 0,
      notes: data.notes || '',
      criado: new Date(data.created_at).toLocaleDateString('pt-BR'),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const studioId = searchParams.get('studioId')

    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    if (!studioId) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { error } = await supabaseAdmin
      .from('leads')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, studioId, studio_id, etapa, stage, notes, valor_estimado } = body

    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    const sid = studioId || studio_id
    if (!sid) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })

    const access = await checkStudioAccess(request, sid)
    if (!access.authorized) return access.response

    const updatePayload: Record<string, any> = {}

    if (etapa !== undefined) {
      updatePayload.stage = etapaToStage[etapa] || etapa
    }
    if (stage !== undefined) {
      updatePayload.stage = stage
    }
    if (notes !== undefined) {
      updatePayload.notes = notes
    }
    if (valor_estimado !== undefined) {
      updatePayload.interest_level = Math.min(5, Math.ceil(Number(valor_estimado) / 5000))
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updatePayload)
      .eq('id', id)
      .eq('studio_id', sid)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      id: data.id,
      etapa: stageToEtapa[data.stage || 'new'] || 'novo',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
