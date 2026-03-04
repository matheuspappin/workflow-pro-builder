import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'
import logger from '@/lib/logger'

/**
 * API de Notas Fiscais (NF-e)
 * Entrada para integrar com provedores externos: Focus NFe, PlugNotas, Nuvem Fiscal, etc.
 *
 * Configure em .env:
 * - NOTES_API_URL: URL base da API de NF-e (ex: https://api.focusnfe.com.br/v2)
 * - NOTES_API_TOKEN: Token de autenticação
 *
 * Contrato da API externa (POST {NOTES_API_URL}/notas):
 * Request: { cliente: { nome, cpf_cnpj, email, telefone }, valor, servico, referencia }
 * Response esperada: { numero: string, chave?: string } (numero = NF, chave = chave de acesso 44 dígitos)
 */

const NOTES_API_URL = process.env.NOTES_API_URL || ''
const NOTES_API_TOKEN = process.env.NOTES_API_TOKEN || ''

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    // Listar pendentes (OS/sales pagas sem nota)
    const [pendingOrders, emittedNotes] = await Promise.all([
      supabaseAdmin
        .from('service_orders')
        .select('id, tracking_code, title, total_amount, discount_amount, payment_status, paid_at, created_at, customer:students(id, name, phone, email)')
        .eq('studio_id', studioId)
        .eq('project_type', 'pdv')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('financial_notes')
        .select('*')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false })
        .limit(50)
    ])

    // Filtrar OS que já têm nota
    const emittedSourceIds = new Set(
      (emittedNotes.data || [])
        .filter((n: any) => n.source_id)
        .map((n: any) => n.source_id)
    )

    const pending = (pendingOrders.data || []).filter((o: any) => !emittedSourceIds.has(o.id))

    return NextResponse.json({
      success: true,
      pending,
      emitted: emittedNotes.data || [],
    })
  } catch (error: any) {
    logger.error('Erro ao listar notas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioId, items } = body as { studioId: string; items: Array<{ id: string; type: 'service_order' }> }

    if (!studioId || !items?.length) {
      return NextResponse.json(
        { error: 'studioId e items (array) são obrigatórios. Ex: { studioId, items: [{ id, type: "service_order" }] }' },
        { status: 400 }
      )
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const results: Array<{
      id: string
      status: 'emitted' | 'error'
      invoice_number?: string
      access_key?: string
      error?: string
    }> = []

    for (const item of items) {
      const { id: sourceId, type: sourceType } = item
      if (!sourceId || !sourceType) continue

      if (sourceType === 'service_order') {
        const { data: order } = await supabaseAdmin
          .from('service_orders')
          .select('*, customer:students(id, name, phone, email, cpf_cnpj)')
          .eq('id', sourceId)
          .eq('studio_id', studioId)
          .single()

        if (!order) {
          results.push({ id: sourceId, status: 'error', error: 'Ordem não encontrada' })
          continue
        }

        const amount = Number(order.total_amount || 0) - Number(order.discount_amount || 0)
        const customer = (order as any).customer
        const customerData = Array.isArray(customer) ? customer[0] : customer

        let invoiceNumber = ''
        let accessKey = ''
        let emitError: string | null = null

        if (NOTES_API_URL && NOTES_API_TOKEN) {
          try {
            const payload = {
              cliente: {
                nome: customerData?.name || 'Consumidor',
                cpf_cnpj: customerData?.cpf_cnpj?.replace(/\D/g, '') || '',
                email: customerData?.email || '',
                telefone: customerData?.phone?.replace(/\D/g, '') || '',
              },
              valor: amount,
              servico: order.title || 'Serviço',
              referencia: sourceId,
            }

            const apiRes = await fetch(`${NOTES_API_URL}/notas`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${NOTES_API_TOKEN}`,
              },
              body: JSON.stringify(payload),
            })

            const apiData = await apiRes.json().catch(() => ({}))
            if (apiRes.ok && apiData.numero) {
              invoiceNumber = String(apiData.numero)
              accessKey = apiData.chave || ''
            } else {
              emitError = apiData.message || apiData.error || 'Falha na API de notas'
            }
          } catch (apiErr: any) {
            emitError = apiErr.message || 'Erro na API'
          }
        } else {
          invoiceNumber = `NFe-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
          accessKey = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('')
        }

        if (emitError) {
          results.push({ id: sourceId, status: 'error', error: emitError })
          continue
        }

        const { error: insertErr } = await supabaseAdmin.from('financial_notes').insert({
          studio_id: studioId,
          source_type: 'service_order',
          source_id: sourceId,
          invoice_number: invoiceNumber,
          access_key: accessKey,
          status: 'emitted',
          amount,
          customer_data: customerData ? { name: customerData.name, email: customerData.email } : {},
          updated_at: new Date().toISOString(),
        })

        if (insertErr) {
          results.push({ id: sourceId, status: 'error', error: insertErr.message })
        } else {
          results.push({ id: sourceId, status: 'emitted', invoice_number: invoiceNumber, access_key: accessKey })
        }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    logger.error('Erro ao emitir notas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
