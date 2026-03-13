'use server';

import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import logger from '@/lib/logger';

/**
 * Processa comissão de afiliado quando estúdio indicado paga plano.
 * Tenta transferir para Stripe Connect do afiliado; se falhar, registra como pending.
 */
export async function processAffiliateCommission(
  studioId: string,
  invoiceId: string,
  amountBrl: number,
  stripeSessionId: string
): Promise<void> {
  const stripe = getStripe();
  if (!stripe) {
    logger.warn('[AFFILIATE] Stripe não configurado, comissão não processada');
    return;
  }

  const { data: studio } = await supabaseAdmin
    .from('studios')
    .select('partner_id')
    .eq('id', studioId)
    .single();

  if (!studio?.partner_id) return;

  const { data: partner } = await supabaseAdmin
    .from('partners')
    .select('id, stripe_account_id, commission_rate')
    .eq('id', studio.partner_id)
    .single();

  if (!partner?.stripe_account_id || !partner?.commission_rate || partner.commission_rate <= 0) {
    logger.info(`[AFFILIATE] Parceiro ${studio.partner_id} sem stripe_account_id ou commission_rate`);
    return;
  }

  const rate = Number(partner.commission_rate) / 100;
  const commissionBrl = Math.round(amountBrl * rate * 100) / 100;
  if (commissionBrl <= 0) return;

  const commissionCents = Math.round(commissionBrl * 100);

  const { data: existing } = await supabaseAdmin
    .from('affiliate_commissions')
    .select('id')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle();

  if (existing) {
    logger.info(`[AFFILIATE] Comissão já registrada para sessão ${stripeSessionId}`);
    return;
  }

  let status: 'transferred' | 'pending' | 'failed' = 'pending';
  let stripeTransferId: string | null = null;
  let errorDetail: string | null = null;

  try {
    const transfer = await stripe.transfers.create({
      amount: commissionCents,
      currency: 'brl',
      destination: partner.stripe_account_id,
      description: `Comissão afiliado - Estúdio ${studioId.slice(0, 8)}`,
    });
    stripeTransferId = transfer.id;
    status = 'transferred';
    logger.info(`[AFFILIATE] Transferência ${transfer.id} criada: R$ ${commissionBrl.toFixed(2)} para parceiro ${partner.id}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errorDetail = msg;
    status = 'failed';
    logger.error(`[AFFILIATE] Erro ao transferir comissão: ${msg}`, err);
  }

  await supabaseAdmin.from('affiliate_commissions').insert({
    partner_id: partner.id,
    studio_id: studioId,
    studio_invoice_id: invoiceId,
    stripe_session_id: stripeSessionId,
    amount_brl: amountBrl,
    commission_rate: partner.commission_rate,
    commission_amount_brl: commissionBrl,
    status,
    stripe_transfer_id: stripeTransferId,
    error_detail: errorDetail,
  });
}
