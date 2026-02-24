import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set() {},
        remove() {},
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, studio_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!student) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    // Buscar todas as OS/vistorias do cliente com documentos
    const { data: ordens } = await supabaseAdmin
      .from('service_orders')
      .select(`
        id,
        tracking_code,
        title,
        status,
        project_type,
        vistoria_type,
        observations,
        laudo_url,
        conformidade_score,
        created_at,
        finished_at,
        scheduled_at,
        professional:professionals(id, name),
        documents:service_order_documents(id, title, file_url, file_type, file_name, description, signed_at, created_at)
      `)
      .eq('studio_id', student.studio_id)
      .eq('customer_id', student.id)
      .order('created_at', { ascending: false })

    const vistorias = (ordens || []).filter(o => o.project_type === 'vistoria')
    const os = (ordens || []).filter(o => o.project_type !== 'vistoria')

    // Laudos com URL anexada
    const laudos = (ordens || []).filter(o => o.laudo_url || (o.documents && o.documents.length > 0))

    return NextResponse.json({
      vistorias,
      os,
      laudos,
      all: ordens || [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
