'use server'

/**
 * Emissão de NF-e para compra de pacote de créditos (DanceFlow).
 * Chamado internamente pelo webhook Stripe — sem autenticação de usuário.
 *
 * Se falhar (certificado não configurado, módulo desativado, etc.),
 * o item ficará pendente no Emissor Fiscal para emissão manual.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'
import { emit as fiscalEmit } from '@/lib/providers/fiscal'
import { normalizeModules } from '@/config/modules'

export async function emitNfeForPackagePurchase(paymentId: string, studioId: string): Promise<{ success: boolean; invoiceNumber?: string; error?: string }> {
  try {
    // 1. Verificar se o estúdio tem módulo fiscal habilitado
    const { data: settings } = await supabaseAdmin
      .from('organization_settings')
      .select('enabled_modules')
      .eq('studio_id', studioId)
      .maybeSingle()

    const enabledModules = normalizeModules(settings?.enabled_modules ?? {})
    if (!enabledModules.fiscal) {
      logger.info(`[NF-e] Estúdio ${studioId} não tem módulo fiscal habilitado. Compra pendente para emissão manual.`)
      return { success: false, error: 'Módulo fiscal não habilitado' }
    }

    // 2. Buscar dados do pagamento
    const { data: payment, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('id, amount, student_id, reference_id')
      .eq('id', paymentId)
      .eq('studio_id', studioId)
      .eq('payment_source', 'package_purchase')
      .eq('status', 'paid')
      .single()

    if (payErr || !payment) {
      logger.error('[NF-e] Pagamento não encontrado:', payErr)
      return { success: false, error: 'Pagamento não encontrado' }
    }

    // 3. Idempotência
    const { data: existing } = await supabaseAdmin
      .from('financial_notes')
      .select('id, invoice_number')
      .eq('studio_id', studioId)
      .eq('source_type', 'package_purchase')
      .eq('source_id', paymentId)
      .eq('status', 'emitted')
      .maybeSingle()

    if (existing) {
      return { success: true, invoiceNumber: existing.invoice_number }
    }

    // 4. Buscar aluno e pacote
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, name, phone, email, cpf_cnpj')
      .eq('id', payment.student_id)
      .eq('studio_id', studioId)
      .single()

    if (!student) {
      logger.error('[NF-e] Aluno não encontrado para payment', paymentId)
      return { success: false, error: 'Aluno não encontrado' }
    }

    const { data: pkg } = await supabaseAdmin
      .from('lesson_packages')
      .select('name, lessons_count')
      .eq('id', payment.reference_id)
      .eq('studio_id', studioId)
      .single()

    const amount = Number(payment.amount || 0)
    const pkgName = pkg?.name || 'Pacote de créditos'
    const creditsCount = pkg?.lessons_count ?? 1

    const customer = {
      name: student.name || 'Consumidor',
      cpf_cnpj: student.cpf_cnpj,
      email: student.email,
      phone: student.phone,
    }

    const items = [{
      description: `Pacote de créditos: ${pkgName} (${creditsCount} crédito${creditsCount !== 1 ? 's' : ''})`,
      quantity: 1,
      unit_price: amount,
    }]

    // 5. Buscar dados do estúdio
    const { data: studio, error: studioErr } = await supabaseAdmin
      .from('studios')
      .select('name, cnpj, address, city, state, zip_code, cnae, phone')
      .eq('id', studioId)
      .single()

    if (studioErr || !studio) {
      logger.error('[NF-e] Estúdio não encontrado:', studioErr)
      return { success: false, error: 'Estúdio não encontrado' }
    }

    // 6. Emitir NF-e
    const emissionResult = await fiscalEmit(
      {
        studio_id: studioId,
        order_id: paymentId,
        customer,
        items,
        total_amount: amount,
        observations: `Compra pacote ${payment.reference_id?.slice(0, 8) || paymentId.slice(0, 8)}`,
      },
      studio
    )

    // 7. Salvar em financial_notes
    const { error: fnErr } = await supabaseAdmin.from('financial_notes').insert({
      studio_id: studioId,
      source_type: 'package_purchase',
      source_id: paymentId,
      invoice_number: emissionResult.invoice_number,
      access_key: emissionResult.access_key,
      amount,
      status: emissionResult.status === 'authorized' ? 'emitted' : 'processing',
      customer_data: { name: customer.name, cpf_cnpj: customer.cpf_cnpj, email: customer.email },
      pdf_url: emissionResult.pdf_url,
      xml_url: emissionResult.xml_url,
    })

    if (fnErr) {
      logger.error('[NF-e] Erro ao salvar em financial_notes:', fnErr)
      return { success: false, error: fnErr.message }
    }

    logger.info(`[NF-e] Nota emitida automaticamente para compra de pacote: ${emissionResult.invoice_number}`)
    return { success: true, invoiceNumber: emissionResult.invoice_number }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    logger.error('[NF-e] Erro ao emitir NF-e para compra de pacote:', err)
    return { success: false, error: msg }
  }
}
