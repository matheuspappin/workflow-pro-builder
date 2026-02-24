import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { tipo, descricao, prioridade = 'normal' } = body

    if (!tipo) {
      return NextResponse.json({ error: 'Tipo de solicitação é obrigatório' }, { status: 400 })
    }

    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, studio_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!student) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const title = tipo === 'vistoria' ? 'Solicitação de Vistoria' : 'Solicitação de Suporte'
    const projectType = tipo === 'vistoria' ? 'vistoria' : 'common'
    const vistoriaType = tipo === 'vistoria' ? 'Vistoria Periódica' : null

    const { data: os, error } = await supabaseAdmin
      .from('service_orders')
      .insert({
        studio_id: student.studio_id,
        customer_id: student.id,
        title,
        description: descricao || null,
        project_type: projectType,
        vistoria_type: vistoriaType,
        status: 'open',
        priority: prioridade === 'urgente' ? 'urgente' : prioridade === 'alta' ? 'alta' : 'normal',
      })
      .select('id, tracking_code, title, status')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      ordem: os,
      message: 'Solicitação enviada com sucesso. Nossa equipe entrará em contato em breve.',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar solicitação'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
