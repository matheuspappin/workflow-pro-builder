import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'
import { guardModule } from '@/lib/modules-server'
import { emit as fiscalEmit } from '@/lib/providers/fiscal'

/**
 * API NF-e — Emissor fiscal próprio (microserviço PHP)
 *
 * Variáveis de ambiente necessárias:
 *   FISCAL_WORKER_URL    = URL do microserviço PHP (ex: http://fiscal-worker:8080)
 *   CERT_ENCRYPTION_KEY  = Chave 32 bytes em hex para descriptografar certificados
 *   FISCAL_AMBIENTE      = 1 (produção) | 2 (homologação)
 *
 * O tenant deve ter o módulo "fiscal" habilitado e certificado A1 cadastrado.
 */

interface EmitRequest {
  studio_id: string
  order_id?: string
  source_type?: 'erp_order' | 'service_order' | 'package_purchase'
  source_id?: string
  customer?: {
    name: string
    cpf_cnpj?: string
    email?: string
    phone?: string
    address?: { street?: string; number?: string; city?: string; state?: string; zip_code?: string }
  }
  items?: {
    description: string
    quantity: number
    unit_price: number
    ncm?: string
    cfop?: string
    unit?: string
  }[]
  total_amount?: number
  payment_method?: string
  observations?: string
}

type EmitCustomer = NonNullable<EmitRequest['customer']>
type EmitItems = NonNullable<EmitRequest['items']>

async function buildEmitPayloadFromSource(
  studioId: string,
  sourceType: 'erp_order' | 'service_order' | 'package_purchase',
  sourceId: string
): Promise<{ order_id: string; customer: EmitCustomer; items: EmitItems; total_amount: number; observations?: string } | null> {
  if (sourceType === 'package_purchase') {
    const { data: payment, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('id, amount, description, student_id, reference_id')
      .eq('id', sourceId)
      .eq('studio_id', studioId)
      .eq('payment_source', 'package_purchase')
      .eq('status', 'paid')
      .single()
    if (payErr || !payment) return null

    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, name, phone, email, cpf_cnpj')
      .eq('id', payment.student_id)
      .eq('studio_id', studioId)
      .single()
    if (!student) return null

    const { data: pkg } = await supabaseAdmin
      .from('lesson_packages')
      .select('name, lessons_count')
      .eq('id', payment.reference_id)
      .eq('studio_id', studioId)
      .single()

    const amount = Number(payment.amount || 0)
    const pkgName = pkg?.name || 'Pacote de créditos'
    const creditsCount = pkg?.lessons_count ?? 1

    return {
      order_id: sourceId,
      customer: {
        name: student.name || 'Consumidor',
        cpf_cnpj: student.cpf_cnpj,
        email: student.email,
        phone: student.phone,
      },
      items: [{
        description: `Pacote de créditos: ${pkgName} (${creditsCount} crédito${creditsCount !== 1 ? 's' : ''})`,
        quantity: 1,
        unit_price: amount,
      }],
      total_amount: amount,
      observations: `Compra pacote ${payment.reference_id?.slice(0, 8) || sourceId.slice(0, 8)}`,
    }
  }

  if (sourceType === 'service_order') {
    const { data: order } = await supabaseAdmin
      .from('service_orders')
      .select('*, customer:students(id, name, phone, email, cpf_cnpj)')
      .eq('id', sourceId)
      .eq('studio_id', studioId)
      .single()
    if (!order) return null
    const customer = Array.isArray((order as any).customer) ? (order as any).customer[0] : (order as any).customer
    const amount = Number(order.total_amount || 0) - Number(order.discount_amount || 0)
    return {
      order_id: sourceId,
      customer: {
        name: customer?.name || 'Consumidor',
        cpf_cnpj: customer?.cpf_cnpj,
        email: customer?.email,
        phone: customer?.phone,
      },
      items: [{ description: order.title || 'Serviço', quantity: 1, unit_price: amount }],
      total_amount: amount,
      observations: `OS ${order.tracking_code || sourceId.slice(0, 8)}`,
    }
  }
  const { data: order } = await supabaseAdmin
    .from('erp_orders')
    .select('*')
    .eq('id', sourceId)
    .eq('studio_id', studioId)
    .single()
  if (!order) return null
  const items = (order.items || []).map((item: any) => ({
    description: item.name || item.sku || 'Produto/Serviço',
    quantity: item.qty || 1,
    unit_price: item.price || 0,
  }))
  return {
    order_id: sourceId,
    customer: {
      name: order.customer_name || 'Cliente',
      email: order.customer_email,
    },
    items: items.length ? items : [{ description: 'Produto/Serviço', quantity: 1, unit_price: order.total_amount || 0 }],
    total_amount: order.total_amount || 0,
    observations: `Pedido ${order.external_id}`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studioId } = await guardModule('fiscal')

    const body: EmitRequest = await request.json()

    let orderId: string
    let customer: EmitCustomer
    let items: EmitItems
    let totalAmount: number
    let observations: string | undefined
    const sourceType = body.source_type || 'erp_order'

    if (body.source_type && body.source_id) {
      const payload = await buildEmitPayloadFromSource(body.studio_id, body.source_type, body.source_id)
      if (!payload) {
        return NextResponse.json({ error: 'Ordem/serviço não encontrado' }, { status: 404 })
      }
      orderId = payload.order_id
      customer = payload.customer
      items = payload.items
      totalAmount = payload.total_amount
      observations = payload.observations
    } else if (body.order_id && body.items?.length && body.customer) {
      orderId = body.order_id
      customer = body.customer
      items = body.items
      totalAmount = body.total_amount ?? items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
      observations = body.observations
    } else {
      return NextResponse.json(
        { error: 'Informe (source_type + source_id) ou (order_id + items + customer)' },
        { status: 400 }
      )
    }

    if (!body.studio_id || body.studio_id !== studioId) {
      return NextResponse.json({ error: 'Acesso negado a este estúdio' }, { status: 403 })
    }

    // Idempotência: verificar se já existe nota para este source
    if (sourceType === 'service_order' || sourceType === 'package_purchase') {
      const { data: existing } = await supabaseAdmin
        .from('financial_notes')
        .select('id, invoice_number')
        .eq('studio_id', body.studio_id)
        .eq('source_type', sourceType)
        .eq('source_id', orderId)
        .eq('status', 'emitted')
        .maybeSingle()
      if (existing) {
        return NextResponse.json({
          success: true,
          invoice_number: existing.invoice_number,
          warning: sourceType === 'package_purchase'
            ? 'Nota já emitida anteriormente para esta compra de pacote.'
            : 'Nota já emitida anteriormente para esta OS.',
        })
      }
    } else {
      const { data: existing } = await supabaseAdmin
        .from('invoices')
        .select('id, invoice_number')
        .eq('studio_id', body.studio_id)
        .eq('order_id', orderId)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({
          success: true,
          invoice_number: existing.invoice_number,
          warning: 'Nota já emitida anteriormente para este pedido.',
        })
      }
    }

    const { data: studio, error: studioErr } = await supabaseAdmin
      .from('studios')
      .select('name, cnpj, address, city, state, zip_code, cnae, phone')
      .eq('id', body.studio_id)
      .single()

    if (studioErr || !studio) {
      return NextResponse.json({ error: 'Estúdio não encontrado' }, { status: 404 })
    }

    const emissionResult = await fiscalEmit(
      {
        studio_id: body.studio_id,
        order_id: orderId,
        customer,
        items,
        total_amount: totalAmount,
        observations,
      },
      studio
    )

    if (sourceType === 'service_order' || sourceType === 'package_purchase') {
      const { error: fnErr } = await supabaseAdmin.from('financial_notes').insert({
        studio_id: body.studio_id,
        source_type: sourceType,
        source_id: orderId,
        invoice_number: emissionResult.invoice_number,
        access_key: emissionResult.access_key,
        amount: totalAmount,
        status: emissionResult.status === 'authorized' ? 'emitted' : 'processing',
        customer_data: { name: customer.name, cpf_cnpj: customer.cpf_cnpj, email: customer.email },
        pdf_url: emissionResult.pdf_url,
        xml_url: emissionResult.xml_url,
      })
      if (fnErr) logger.error('[NF-e] Erro ao salvar em financial_notes:', fnErr)
    } else {
      const { data: invoice, error: invoiceErr } = await supabaseAdmin
        .from('invoices')
        .insert({
          studio_id: body.studio_id,
          order_id: orderId,
          invoice_number: emissionResult.invoice_number,
          access_key: emissionResult.access_key,
          amount: totalAmount,
          status: emissionResult.status === 'authorized' ? 'emitted' : 'processing',
          customer_data: { name: customer.name, cpf_cnpj: customer.cpf_cnpj, email: customer.email },
          provider: emissionResult.provider,
          provider_ref: emissionResult.ref,
          pdf_url: emissionResult.pdf_url,
          xml_url: emissionResult.xml_url,
          simulated: emissionResult.simulated ?? false,
        })
        .select()
        .single()

      if (invoiceErr) {
        logger.error('[NF-e] Erro ao salvar nota no banco:', invoiceErr)
        return NextResponse.json({
          ...emissionResult,
          warning: 'Nota emitida mas não salva no banco: ' + invoiceErr.message,
        })
      }

      await supabaseAdmin
        .from('erp_orders')
        .update({ status: 'finished' })
        .eq('id', orderId)
        .eq('studio_id', body.studio_id)
    }

    logger.info(
      `[NF-e] Nota emitida com sucesso: ${emissionResult.invoice_number} | Provider: ${emissionResult.provider}`
    )

    return NextResponse.json({
      success: true,
      ...emissionResult,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno ao emitir NF-e'
    logger.error('[NF-e] Erro fatal na emissão:', error)

    const status =
      message.includes('não configurado') || message.includes('não cadastrado')
        ? 503
        : message.includes('Acesso negado') || message.includes('não está ativo')
          ? 403
          : 500

    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const invoiceId = searchParams.get('invoiceId')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select(`*, order:erp_orders(external_id, customer_name)`)
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (invoiceId) {
      const single = data?.find((i: { id: string }) => i.id === invoiceId)
      if (single) return NextResponse.json(single)
    }

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar notas'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
