import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { addYears } from 'date-fns'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: professionals } = await supabaseAdmin
      .from('professionals')
      .select('id, studio_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (!professionals?.length) {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 })
    }

    const professionalIds = professionals.map(p => p.id)
    const professional = professionals[0]

    const body = await request.json()
    const { qrCode, action } = body

    if (!qrCode || !action) {
      return NextResponse.json({ error: 'qrCode e action são obrigatórios' }, { status: 400 })
    }

    const code = String(qrCode).trim()

    // Buscar asset por qr_code ou id (UUID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)

    let query = supabaseAdmin
      .from('assets')
      .select('*')
    if (isUUID) {
      query = query.or(`qr_code.eq.${code},id.eq.${code}`)
    } else {
      query = query.eq('qr_code', code)
    }

    const { data: asset, error: assetError } = await query.single()

    if (!asset || assetError) {
      return NextResponse.json({ error: 'Extintor não encontrado' }, { status: 404 })
    }

    // Verificar se o asset pertence ao studio do técnico
    if (asset.studio_id !== professional.studio_id) {
      return NextResponse.json({ error: 'Extintor de outro studio' }, { status: 403 })
    }

    let updates: Record<string, unknown> = {}
    let message = ''

    if (action === 'pickup' || action === 'retirada') {
      updates = {
        status: 'maintenance',
        location: 'Em Manutenção - Oficina',
        last_inspection_at: new Date().toISOString(),
      }
      message = 'Retirado para recarga/manutenção.'
    } else if (action === 'delivery' || action === 'entrega') {
      const nextYear = addYears(new Date(), 1)
      updates = {
        status: 'ok',
        expiration_date: nextYear.toISOString().split('T')[0],
        last_inspection_at: new Date().toISOString(),
        location: asset.location || 'Entregue ao Cliente',
      }
      message = 'Entregue e validado por 1 ano.'
    } else if (action === 'inspection' || action === 'vistoria') {
      updates = {
        last_inspection_at: new Date().toISOString(),
        status: 'ok',
      }
      message = 'Vistoria registrada.'
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('assets')
      .update(updates)
      .eq('id', asset.id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      assetName: asset.name,
      message,
      details: action === 'delivery' || action === 'entrega'
        ? `Vence em: ${addYears(new Date(), 1).toLocaleDateString('pt-BR')}`
        : '',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
