// app/portal/affiliate/settings/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AffiliateHeader } from '@/components/dashboard/affiliate-header';
import { getAffiliateProfile, getAffiliatePayoutSettings, saveAffiliatePayoutSettings, createStripeConnectAccountLink, getAffiliateStripeBalance, createAffiliateStripePayout } from '@/lib/actions/affiliate';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/logger';

const AffiliateSettingsPage = () => {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0); // Novo estado para o saldo
  const [payoutAmount, setPayoutAmount] = useState<number>(0); // Novo estado para o valor do saque
  const [payoutSettings, setPayoutSettings] = useState<{
    payout_frequency: string;
    minimum_payout_amount: number;
  }>({
    payout_frequency: 'weekly',
    minimum_payout_amount: 1000,
  });
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchUserAndProfileData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({ id: currentUser.id });
      logger.info("👤 Usuário logado no frontend:", currentUser.id);
      
      try {
        const profile = await getAffiliateProfile(currentUser.id);
        if (profile?.stripe_account_id) {
          setStripeAccountId(profile.stripe_account_id);
          // Busca o saldo apenas se estiver conectado usando Server Action
          try {
            const balance = await getAffiliateStripeBalance(currentUser.id);
            setAvailableBalance(balance);
          } catch (balanceError: any) {
            logger.error("Erro ao buscar saldo:", balanceError);
            toast.error(balanceError.message || "Falha ao buscar saldo do Stripe.");
          }
        } else {
          setStripeAccountId(null);
          setAvailableBalance(0);
        }
        const settings = await getAffiliatePayoutSettings(currentUser.id);
        if (settings) {
          setPayoutSettings({
            payout_frequency: settings.payout_frequency,
            minimum_payout_amount: settings.minimum_payout_amount,
          });
        }
      } catch (error) {
        logger.error("Erro ao buscar dados do perfil:", error);
        toast.error("Erro ao carregar dados do perfil.");
      } finally {
        setLoading(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const refresh = urlParams.get('refresh');
    const accountIdParam = urlParams.get('account_id'); // Parâmetro que o Stripe pode retornar

    if (refresh || accountIdParam) {
      // Limpa os parâmetros da URL para evitar recarregar desnecessariamente
      urlParams.delete('refresh');
      urlParams.delete('account_id');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      window.history.replaceState({}, document.title, newUrl);
      
      if (accountIdParam) {
        toast.success("Sua conta Stripe foi conectada com sucesso!");
      } else if (refresh) {
        toast.info("Status da conexão Stripe atualizado.");
      }
    }

    fetchUserAndProfileData();
  }, []);

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        toast.error("Usuário não autenticado.");
        setLoading(false);
        return;
      }
      const returnUrl = window.location.href;
      logger.info("Iniciando conexão com Stripe via Server Action...");
      
      const url = await createStripeConnectAccountLink(user.id, returnUrl);
      
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Falha ao iniciar conexão com Stripe: URL não retornada.");
      }
    } catch (error: any) {
      logger.error("Erro ao conectar Stripe:", error);
      toast.error(error.message || "Erro ao conectar com Stripe.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        toast.error("Usuário não autenticado.");
        setLoading(false);
        return;
      }
      if (payoutAmount <= 0) {
        toast.error("O valor do saque deve ser maior que zero.");
        setLoading(false);
        return;
      }
      if (payoutAmount * 100 > availableBalance) {
        toast.error("Saldo insuficiente para realizar o saque.");
        setLoading(false);
        return;
      }

      logger.info("Solicitando saque via Server Action...");
      const payout = await createAffiliateStripePayout(user.id, payoutAmount);
      
      if (payout) {
        toast.success("Saque solicitado com sucesso!");
        // Recarregar os dados para atualizar o saldo
        const profile = await getAffiliateProfile(user.id);
        if (profile?.stripe_account_id) {
          const balance = await getAffiliateStripeBalance(user.id);
          setAvailableBalance(balance);
        }
        setPayoutAmount(0); // Limpa o campo de saque
      } else {
        toast.error("Falha ao solicitar saque.");
      }
    } catch (error: any) {
      logger.error("Erro ao solicitar saque:", error);
      toast.error(error.message || "Erro ao solicitar saque.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayoutSettings = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        toast.error("Usuário não autenticado.");
        setLoading(false);
        return;
      }
      await saveAffiliatePayoutSettings(user.id, payoutSettings);
      toast.success("Configurações de pagamento salvas com sucesso!");
    } catch (error) {
      logger.error("Erro ao salvar configurações de pagamento:", error);
      toast.error("Erro ao salvar configurações de pagamento.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <AffiliateHeader 
        title="Configurações de Afiliado" 
        description="Conecte sua conta Stripe e gerencie suas preferências de pagamento." 
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cartão de Conexão com Stripe */}
        <Card>
          <CardHeader>
            <CardTitle>Conectar Conta Stripe</CardTitle>
            <CardDescription>
              Conecte sua conta Stripe para receber seus pagamentos de afiliado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stripeAccountId ? (
              <div className="flex items-center gap-2 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Conectado ao Stripe (ID: {stripeAccountId})</span>
              </div>
            ) : (
              <Button onClick={handleConnectStripe} disabled={loading}>
                {loading ? "Conectando..." : "Conectar com Stripe"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Cartão de Saldo e Saque */}
        {stripeAccountId && (
          <Card>
            <CardHeader>
              <CardTitle>Saldo Disponível e Saque</CardTitle>
              <CardDescription>
                Visualize seu saldo disponível e solicite um saque para sua conta bancária conectada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Saldo Disponível</Label>
                <p className="text-2xl font-bold">R$ {(availableBalance / 100).toFixed(2)}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payoutAmount">Valor do Saque (R$)</Label>
                <Input
                  id="payoutAmount"
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              <Button onClick={handleRequestPayout} disabled={loading || payoutAmount <= 0 || payoutAmount * 100 > availableBalance}>
                {loading ? "Solicitando..." : "Solicitar Saque"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cartão de Configurações de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Pagamento</CardTitle>
            <CardDescription>
              Gerencie como e quando você receberá seus pagamentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="payoutFrequency">Frequência de Pagamento</Label>
              <Select
                value={payoutSettings.payout_frequency}
                onValueChange={(value) =>
                  setPayoutSettings({ ...payoutSettings, payout_frequency: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="payoutFrequency">
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minimumPayoutAmount">Valor Mínimo para Pagamento (R$)</Label>
              <Input
                id="minimumPayoutAmount"
                type="number"
                value={payoutSettings.minimum_payout_amount / 100}
                onChange={(e) =>
                  setPayoutSettings({
                    ...payoutSettings,
                    minimum_payout_amount: parseInt(e.target.value) * 100,
                  })
                }
                disabled={loading}
              />
            </div>
            <Button onClick={handleSavePayoutSettings} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AffiliateSettingsPage;
