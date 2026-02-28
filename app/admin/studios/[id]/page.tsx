"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, ArrowLeft, Database, Globe, FireExtinguisher, Copy, Check, RefreshCw, Link2 } from "lucide-react"
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
  multi_unit: 'Building2',
  service_orders: 'FileText',
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
  const [productionConfig, setProductionConfig] = useState({
    extintores_por_dia: 20,
    lead_time_minimo_dias: 1,
    technicians: [] as { id: string; name: string; extintores_por_dia: number | null }[],
  })
  const [loadingProduction, setLoadingProduction] = useState(false)
  const [savingProduction, setSavingProduction] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    loadTenant()
  }, [])

  useEffect(() => {
    if (params.id && niche === 'fire_protection') {
      loadProductionConfig()
    }
  }, [params.id, niche])

  async function loadInviteLink() {
    setLoadingInvite(true)
    try {
      const res = await fetch(`/api/admin/studios/${params.id}/invite-link`)
      const data = await res.json()
      if (data.success) {
        setInviteUrl(data.inviteUrl)
      } else {
        toast.error(data.error || 'Erro ao buscar link de convite')
      }
    } catch {
      toast.error('Erro ao buscar link de convite')
    } finally {
      setLoadingInvite(false)
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setIsCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  async function loadProductionConfig() {
    setLoadingProduction(true)
    try {
      const res = await fetch(`/api/admin/fire-protection/production-config?studioId=${params.id}`)
      const data = await res.json()
      if (data.config) {
        setProductionConfig((prev) => ({
          ...prev,
          extintores_por_dia: data.config.extintores_por_dia ?? 20,
          lead_time_minimo_dias: data.config.lead_time_minimo_dias ?? 1,
        }))
      }
      if (data.technicians?.length) {
        setProductionConfig((prev) => ({
          ...prev,
          technicians: data.technicians.map((t: { id: string; name: string; extintores_por_dia: number | null }) => ({
            id: t.id,
            name: t.name,
            extintores_por_dia: t.extintores_por_dia ?? null,
          })),
        }))
      } else {
        setProductionConfig((prev) => ({ ...prev, technicians: [] }))
      }
    } catch (e) {
      toast.error('Erro ao carregar configuração de produção')
    } finally {
      setLoadingProduction(false)
    }
  }

  async function handleSaveProduction() {
    setSavingProduction(true)
    try {
      const res = await fetch('/api/admin/fire-protection/production-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studio_id: params.id,
          extintores_por_dia: productionConfig.extintores_por_dia,
          lead_time_minimo_dias: productionConfig.lead_time_minimo_dias,
          technicians: productionConfig.technicians.map((t) => ({
            id: t.id,
            extintores_por_dia: t.extintores_por_dia,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }
      toast.success('Configuração de produção salva!')
      loadProductionConfig()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar configuração')
    } finally {
      setSavingProduction(false)
    }
  }

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
    toast.info(`Nicho alterado para ${nicheDictionary.pt[newNiche].name}. O vocabulário será atualizado ao salvar.`)
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Lógica de Acoplamento: Gerar vocabulário baseado no nicho selecionado
      const newVocab = {
        client: nicheDictionary.pt[niche].client,
        provider: nicheDictionary.pt[niche].provider,
        service: nicheDictionary.pt[niche].service,
        establishment: nicheDictionary.pt[niche].establishment
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

  const vocab = nicheDictionary.pt[niche]

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
                  const IconName = MODULE_ICONS[id] ?? 'Database'
                  const IconComponent = (Icons[IconName] as React.ComponentType<{ className?: string }>) ?? Database
                  return (
                    <div key={id} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                      <IconComponent className="w-5 h-5 text-muted-foreground" />
                      <Switch
                        id={id}
                        checked={modules[id as ModuleKey]}
                        onCheckedChange={(checked) => handleToggleModule(id, checked)}
                      />
                      <Label htmlFor={id} className="text-sm font-medium">{MODULE_DEFINITIONS[id as ModuleKey].label}</Label>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-indigo-500" />
                  Link de Ativação
                </CardTitle>
                <CardDescription>
                  Gere e copie o link para o cliente ativar o sistema. O link é válido por 30 dias.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inviteUrl ? (
                  <div className="flex gap-2">
                    <Input
                      value={inviteUrl}
                      readOnly
                      className="font-mono text-xs bg-slate-50 dark:bg-slate-900"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyInviteLink}
                      title="Copiar link"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Clique em "Gerar Link" para obter o link de ativação do cliente.
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  onClick={loadInviteLink}
                  disabled={loadingInvite}
                  variant={inviteUrl ? 'outline' : 'default'}
                  className="w-full"
                >
                  {loadingInvite
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <RefreshCw className="mr-2 h-4 w-4" />
                  }
                  {inviteUrl ? 'Regenerar Link' : 'Gerar Link de Ativação'}
                </Button>
                <div className="w-full border-t pt-3 space-y-2">
                  <Label htmlFor="client-email" className="text-xs text-muted-foreground">Notificar cliente por e-mail (opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="email@cliente.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                    <Button
                      onClick={handleResendInvite}
                      disabled={isSendingLink || !clientEmail}
                      variant="outline"
                      className="shrink-0"
                    >
                      {isSendingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>

            {niche === 'fire_protection' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FireExtinguisher className="w-5 h-5 text-red-500" />
                    Produção de Extintores
                  </CardTitle>
                  <CardDescription>
                    Configure a capacidade de recarga por dia e por técnico para estimar datas de entrega.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Extintores possíveis recarregar por dia (total da empresa)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        value={productionConfig.extintores_por_dia}
                        onChange={(e) =>
                          setProductionConfig((p) => ({
                            ...p,
                            extintores_por_dia: Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1)),
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Lead time mínimo (dias)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={productionConfig.lead_time_minimo_dias}
                        onChange={(e) =>
                          setProductionConfig((p) => ({
                            ...p,
                            lead_time_minimo_dias: Math.max(0, Math.min(30, parseInt(e.target.value, 10) ?? 1)),
                          }))
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Dias mínimos entre retirada e entrega prevista.</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase mb-2 block">Capacidade por técnico (extintores/dia)</Label>
                    {loadingProduction ? (
                      <div className="flex items-center gap-2 py-4 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Carregando técnicos...</span>
                      </div>
                    ) : productionConfig.technicians.length > 0 ? (
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 font-medium">Técnico</th>
                              <th className="text-right p-3 font-medium w-28">Extintores/dia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productionConfig.technicians.map((t) => (
                              <tr key={t.id} className="border-t">
                                <td className="p-3">{t.name}</td>
                                <td className="p-3 text-right">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="—"
                                    value={t.extintores_por_dia ?? ''}
                                    onChange={(e) => {
                                      const v = e.target.value === '' ? null : Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0))
                                      setProductionConfig((p) => ({
                                        ...p,
                                        technicians: p.technicians.map((x) =>
                                          x.id === t.id ? { ...x, extintores_por_dia: v } : x
                                        ),
                                      }))
                                    }}
                                    className="w-20 text-right h-8"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">Nenhum técnico cadastrado neste estúdio.</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveProduction} disabled={savingProduction || loadingProduction}>
                    {savingProduction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar configuração
                  </Button>
                </CardFooter>
              </Card>
            )}

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
                        {Object.entries(nicheDictionary.pt).map(([key, value]) => (
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
