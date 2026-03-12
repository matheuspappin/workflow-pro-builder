"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AffiliateHeader } from '@/components/dashboard/affiliate-header';
import { getAffiliateProfile } from '@/lib/actions/affiliate';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';
import Link from 'next/link';

export default function AffiliateProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          return;
        }

        setUserEmail(session.user.email || null);
        
        const data = await getAffiliateProfile(session.user.id);
        setProfile(data);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Erro ao carregar informações do perfil");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <AffiliateHeader 
        title="Meu Perfil" 
        description="Gerencie suas informações pessoais e de afiliado." 
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Informações da Conta</CardTitle>
            </div>
            <CardDescription>
              Seus dados de acesso e identificação no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={userEmail || ''} disabled readOnly />
              <p className="text-xs text-muted-foreground">
                O email é gerenciado através da sua conta de login.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados de Parceiro</CardTitle>
            <CardDescription>
              Informações sobre sua conta de afiliado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Parceiro</Label>
              <Input id="name" value={profile?.name || ''} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (Identificador)</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  /
                </span>
                <Input 
                  id="slug" 
                  value={profile?.slug || ''} 
                  readOnly 
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Seu identificador único usado em links de indicação.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Taxa de Comissão</Label>
              <div className="relative">
                <Input 
                  id="commission" 
                  value={profile?.commission_rate ? `${profile.commission_rate}%` : '0%'} 
                  readOnly 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Financeiras</CardTitle>
          <CardDescription>
            Gerencie seus dados bancários e preferências de pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Stripe Connect e Pagamentos</p>
              <p className="text-sm text-muted-foreground">
                Configure sua conta Stripe para receber comissões e defina suas preferências de saque.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/portal/affiliate/settings">
                Gerenciar Pagamentos
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
