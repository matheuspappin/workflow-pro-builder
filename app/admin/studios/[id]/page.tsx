"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, ArrowLeft, Database, Globe } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabase'
import { toast } from "sonner"
import { nicheDictionary, NicheType } from '@/config/niche-dictionary'
import { MODULE_DEFINITIONS, ModuleKey } from '@/config/modules'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTenantSettings } from '@/lib/actions/super-admin'
import * as Icons from "lucide-react"
import { Input } from '@/components/ui/input'

import { normalizeModules } from '@/config/modules'

const MODULE_DESCRIPTIONS: Record<string, string> = {
  dashboard: 'Visão geral e métricas',
  students: 'Cadastro e perfil',
  classes: 'Grade de horários',
  financial: 'Fluxo de caixa',
  pos: 'Vendas físicas',
  whatsapp: 'Envio de mensagens',
  ai_chat: 'Assistente virtual',
  scanner: 'Controle de acesso',
  marketplace: 'Loja virtual integrada',
  erp: 'Gestão empresarial completa',
  inventory: 'Controle de Estoque',
  gamification: 'Gamificação e Engajamento',
  leads: 'Funil de Vendas (CRM)',
}

const MODULE_ICONS: Record<string, keyof typeof Icons> = {
  dashboard: 'LayoutDashboard',
  students: 'Users',
  classes: 'Calendar',
  financial: 'DollarSign',
  whatsapp: 'MessageSquare',
  ai_chat: 'Bot',
  pos: 'ShoppingCart',
  inventory: 'Package',
  gamification: 'Trophy',
  leads: 'Target',
  scanner: 'QrCode',
  marketplace: 'Store',
  erp: 'Building2',
}

export default function TenantDetailPage() {
  const params = useParams()
  const [tenant, setTenant] = useState<any>(null)
  const [modules, setModules] = useState<Record<string, boolean>>({})
  const [niche, setNiche] = useState<NicheType>('dance')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSendingLink, setIsSendingLink] = useState(false)
  const [clientEmail, setClientEmail] = useState('')

  useEffect(() => {
    loadTenant()
  }, [])

  async function loadTenant() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/studios/${params.id}`);
      
      if (!response.ok) {
        if (response.status !== 404) {
            const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
            toast.error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        setTenant(null);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data) {
        setTenant(data);
        const settings = data.organization_settings?.[0];
        const modulesConfig = settings?.enabled_modules || {};
        setModules(normalizeModules(modulesConfig));
        if (settings?.niche) {
          setNiche(settings.niche as NicheType);
        }
      }
    } catch (error: any) {
      console.error("Failed to load tenant:", error);
      toast.error(error.message || "Falha ao carregar dados do estúdio.");
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleModule = (id: string, checked: boolean) => {
    setModules(prev => ({ ...prev, [id]: checked }))
  }

  const handleNicheChange = (newNiche: NicheType) => {
    setNiche(newNiche)
    // Acoplar lógica: Ao trocar o nicho, sugerimos o vocabulário padrão
    // mas o usuário ainda poderá salvar
    toast.info(`Nicho alterado para ${nicheDictionary[newNiche].name}. O vocabulário será atualizado ao salvar.`)
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Lógica de Acoplamento: Gerar vocabulário baseado no nicho selecionado
      const newVocab = {
        client: nicheDictionary[niche].client,
        provider: nicheDictionary[niche].provider,
        service: nicheDictionary[niche].service,
        establishment: nicheDictionary[niche].establishment
      }

      await updateTenantSettings(params.id as string, { 
        modules, 
        niche,
        vocabulary: newVocab
      }, session?.access_token)
      
      toast.success("Configurações atualizadas com sucesso")
      loadTenant() // Recarregar para garantir sincronia
    } catch (error) {
      toast.error("Erro ao atualizar configurações")
    } finally {
      setSaving(false)
    }
  }

  const handleResendInvite = async () => {
    if (!clientEmail) {
      toast.error("Por favor, insira o e-mail do cliente.");
      return;
    }
    setIsSendingLink(true);
    try {
      const response = await fetch(`/api/admin/studios/${params.id}/resend-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao reenviar o convite.');
      }

      toast.success("Link de setup reenviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSendingLink(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!tenant) return <div>Tenant não encontrado</div>

  const vocab = nicheDictionary[niche]

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title={`Gestão: ${tenant.name}`} />
      
      <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
        <Link href="/admin/studios" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para lista
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Módulos Ativos</CardTitle>
                <CardDescription>Selecione os módulos que este estúdio poderá usar.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Object.keys(MODULE_DEFINITIONS).map(id => {
                  const IconComponent = Icons[MODULE_ICONS[id] as keyof typeof Icons] || Database
                  return (
                    <div key={id} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                      <IconComponent className="w-5 h-5 text-muted-foreground" />
                      <Switch
                        id={id}
                        checked={modules[id as ModuleKey]}
                        onCheckedChange={(checked) => handleToggleModule(id, checked)}
                      />
                      <Label htmlFor={id} className="text-sm font-medium">{MODULE_DEFINITIONS[id as ModuleKey].name}</Label>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle>Acesso e Setup</CardTitle>
                  <CardDescription>Reenvie o link de configuração para o proprietário do estúdio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                      <Label htmlFor="client-email">E-mail do Cliente</Label>
                      <Input 
                          id="client-email"
                          type="email"
                          placeholder="email@cliente.com"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                          Este é o e-mail para onde o link de setup será enviado.
                      </p>
                  </div>
              </CardContent>
              <CardFooter>
                  <Button onClick={handleResendInvite} disabled={isSendingLink || !clientEmail}>
                      {isSendingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Reenviar Link de Setup
                  </Button>
              </CardFooter>
            </Card>

          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informações Principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Nome da Empresa</Label>
                  <p className="font-bold text-lg">{tenant.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Nicho de Atuação</Label>
                  <div className="mt-1">
                    <Select value={niche} onValueChange={(val) => handleNicheChange(val as NicheType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o nicho" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(nicheDictionary).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">ID do Sistema</Label>
                  <p className="font-mono text-xs bg-muted p-2 rounded mt-1">{tenant.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Database className="w-4 h-4" /> Resetar Senha Admin
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Globe className="w-4 h-4" /> Desativar Acesso
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
