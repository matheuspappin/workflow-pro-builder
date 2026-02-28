"use server";

import { getAuthenticatedClient } from "@/lib/server-utils";
import { getStripe } from "@/lib/stripe";
import logger from "@/lib/logger";
import { maskId } from "@/lib/sanitize-logs";

export async function createStripeConnectAccountLink(userId: string, returnUrl: string) {
  const stripe = getStripe();
  const client = await getAuthenticatedClient();
  if (!client) throw new Error("Não autenticado");

  // Fonte única de verdade para o Stripe Account ID do afiliado: tabela 'partners'
  const { data: partnerData, error: partnerError } = await client
    .from('partners')
    .select('stripe_account_id, name')
    .eq('user_id', userId)
    .maybeSingle();

  if (partnerError) {
    logger.error("Erro ao buscar perfil de parceiro:", partnerError);
    throw new Error("Erro ao validar perfil de parceiro.");
  }

  if (!partnerData) {
    logger.error('Usuário não possui registro na tabela partners.', { userId: maskId(userId) });
    throw new Error("Usuário não identificado como parceiro/afiliado.");
  }

  let accountId = partnerData.stripe_account_id;

  if (!accountId) {
    // Busca o email do usuário
    const { data: { user } } = await client.auth.getUser();
    const email = user?.email;

    logger.info('Criando nova conta Stripe Connect para o parceiro');
    
    // Crie uma nova conta Express no Stripe Connect
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email: email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;

    // Salva o accountId apenas na tabela 'partners' (Fonte única de verdade)
    const { error: updateError } = await client
      .from('partners')
      .update({ stripe_account_id: accountId })
      .eq('user_id', userId);

    if (updateError) {
      logger.error(`Erro ao salvar Stripe Account ID na tabela 'partners':`, updateError);
      throw new Error("Falha ao vincular conta Stripe ao seu perfil de parceiro.");
    }
  }

  // Crie um link de configuração de conta (Account Link)
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: returnUrl + '?refresh=true',
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

export async function getAffiliateProfile(userId: string) {
  const client = await getAuthenticatedClient();
  if (!client) return null;
  
  // Fonte única de verdade: tabela 'partners'
  const { data: partnerProfile, error } = await client
    .from('partners')
    .select('stripe_account_id, name, slug, commission_rate')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error("Erro ao buscar perfil de parceiro:", error);
    return null;
  }

  return partnerProfile;
}

export async function getAffiliatePayoutSettings(userId: string) {
  const client = await getAuthenticatedClient();
  if (!client) return null;
  const { data, error } = await client
    .from('affiliate_payout_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error("Erro ao buscar configurações de pagamento do afiliado:", error);
    return null;
  }
  return data;
}

export async function saveAffiliatePayoutSettings(userId: string, settings: { payout_frequency?: string; minimum_payout_amount?: number }) {
  const client = await getAuthenticatedClient();
  if (!client) throw new Error("Não autenticado");
  const { error } = await client
    .from('affiliate_payout_settings')
    .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' });

  if (error) {
    logger.error("Erro ao salvar configurações de pagamento do afiliado:", error);
    throw new Error("Falha ao salvar configurações de pagamento.");
  }
  return { success: true };
}

export async function getAffiliateStripeBalance(userId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe não inicializado.");

  const affiliateProfile = await getAffiliateProfile(userId);
  if (!affiliateProfile?.stripe_account_id) {
    throw new Error("Afiliado não conectado ao Stripe.");
  }

  const balance = await stripe.balance.retrieve({
    stripeAccount: affiliateProfile.stripe_account_id,
  });

  // Retorna apenas o saldo disponível
  const availableBalance = balance.available.find(b => b.currency === 'brl');
  
  return availableBalance ? availableBalance.amount : 0;
}

export async function createAffiliateStripePayout(userId: string, amount: number) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe não inicializado.");

  const affiliateProfile = await getAffiliateProfile(userId);
  if (!affiliateProfile?.stripe_account_id) {
    throw new Error("Afiliado não conectado ao Stripe.");
  }

  // O Stripe espera o valor em centavos
  const amountInCents = Math.round(amount * 100);

  // Verifica se o saldo é suficiente antes de tentar o payout
  const availableBalance = await getAffiliateStripeBalance(userId);
  if (amountInCents > availableBalance) {
    throw new Error("Saldo insuficiente para realizar o saque.");
  }

  const payout = await stripe.payouts.create({
    amount: amountInCents,
    currency: 'brl',
    statement_descriptor: 'Pagamento Afiliado',
  }, {
    stripeAccount: affiliateProfile.stripe_account_id,
  });

  return payout;
}

