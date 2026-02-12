"use server";

import { getAuthenticatedClient } from "@/lib/server-utils";
import { getStripe } from "@/lib/stripe";

export async function createStripeConnectAccountLink(userId: string, returnUrl: string) {
  const stripe = getStripe();
  const client = await getAuthenticatedClient();

  // Tenta buscar o profile em users_internal ou partners
  let profileTable = 'users_internal';
  let { data: profileData, error: profileError } = await client
    .from('users_internal')
    .select('stripe_account_id, email')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profileData) {
    // Se não encontrou em users_internal, tenta em partners
    const { data: partnerData, error: partnerError } = await client
      .from('partners')
      .select('user_id, name')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (partnerData) {
      profileTable = 'partners';
      profileData = partnerData as any;
    }
  }

  let accountId = profileData?.stripe_account_id;

  if (!accountId) {
    // Busca o email do usuário se não tiver no profileData
    const { data: { user } } = await client.auth.getUser();
    const email = user?.email;

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

    // Salve o accountId no perfil do usuário (na tabela correta)
    // Se a tabela for partners, precisamos garantir que a coluna existe. 
    // Como a migração 18 adicionou a users_internal, vamos tentar nela primeiro.
    // Se falhar, tentamos em partners ou em affiliate_payout_settings.
    
    const { error: updateError } = await client
      .from(profileTable)
      .update({ stripe_account_id: accountId })
      .eq(profileTable === 'partners' ? 'user_id' : 'id', userId);

    if (updateError) {
      console.error(`Erro ao salvar Stripe Account ID em ${profileTable}:`, updateError);
      // Fallback: Tenta salvar em affiliate_payout_settings se a coluna stripe_account_id for adicionada lá futuramente
      // ou apenas lança o erro se for crítico.
      throw new Error("Falha ao salvar a conta Stripe no perfil.");
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
  
  // Tenta buscar em ambas as tabelas
  const { data: internalProfile } = await client
    .from('users_internal')
    .select('stripe_account_id')
    .eq('id', userId)
    .maybeSingle();

  if (internalProfile?.stripe_account_id) return internalProfile;

  const { data: partnerProfile } = await client
    .from('partners')
    .select('stripe_account_id')
    .eq('user_id', userId)
    .maybeSingle();

  return partnerProfile || null;
}

export async function getAffiliatePayoutSettings(userId: string) {
  const client = await getAuthenticatedClient();
  const { data, error } = await client
    .from('affiliate_payout_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar configurações de pagamento do afiliado:", error);
    return null;
  }
  return data;
}

export async function saveAffiliatePayoutSettings(userId: string, settings: { payout_frequency?: string; minimum_payout_amount?: number }) {
  const client = await getAuthenticatedClient();
  const { error } = await client
    .from('affiliate_payout_settings')
    .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' });

  if (error) {
    console.error("Erro ao salvar configurações de pagamento do afiliado:", error);
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

