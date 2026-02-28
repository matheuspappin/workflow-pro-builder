"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Loader2, Copy, Check, Sparkles, Building2, ArrowLeft, ChevronRight,
  Package, Heart, Scissors, Dumbbell, ChefHat, Stethoscope, Hammer,
  FireExtinguisher, Home, BookOpen, Car, Leaf, Music, Camera,
  ShoppingCart, Briefcase, GraduationCap, Star, Shield, Truck,
  MessageSquare, ScanLine, LayoutDashboard, Globe, Layers, Zap,
  DollarSign, TrendingUp, BarChart3, CalendarDays, ClipboardList, Wrench,
  Users, Settings, AlertTriangle,
} from "lucide-react"
import { nicheDictionary, NicheType } from "@/config/niche-dictionary"
import { createEcosystemInvite } from "@/lib/actions/ecosystem"
import { getVerticalizationBySlug, type VerticalRecord } from "@/lib/actions/verticalization"
import { getDefaultModulesForNiche, monetaryBasedNiches } from "@/config/niche-modules"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { pluralize } from "@/lib/pluralize"
import { cn } from "@/lib/utils"

// ─── Mapa de ícones ─────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FireExtinguisher, Shield, Stethoscope, Wrench, Hammer, Truck, Car,
  Scissors, Dumbbell, ChefHat, Leaf, Music, Camera, Home, BookOpen,
  GraduationCap, ShoppingCart, Briefcase, Package, Heart, Globe, Layers,
  Zap, Star, Users, Settings, Building2,
}

// ─── Módulos disponíveis ─────────────────────────────────────────────────────
const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Painel com KPIs e resumos', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'students', label: 'Gestão de Clientes', icon: Users, description: 'Cadastro e gestão de clientes', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'classes', label: 'Agenda / Turmas', icon: CalendarDays, description: 'Agendamentos e horários', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { id: 'financial', label: 'Financeiro', icon: DollarSign, description: 'Cobranças e relatórios', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'service_orders', label: 'Ordens de Serviço', icon: ClipboardList, description: 'OS, vistorias e serviços técnicos', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, description: 'Notificações e automações', color: 'text-green-400', bg: 'bg-green-500/10' },
  { id: 'ai_chat', label: 'IA Chat', icon: Zap, description: 'Assistente inteligente com IA', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'pos', label: 'PDV (Ponto de Venda)', icon: ShoppingCart, description: 'Venda de produtos e serviços', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'scanner', label: 'Scanner / Acesso', icon: ScanLine, description: 'QR para controle de acesso', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'inventory', label: 'Estoque', icon: Package, description: 'Controle de estoque e inventário', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { id: 'leads', label: 'Leads (CRM)', icon: TrendingUp, description: 'Gestão de leads e funil', color: 'text-lime-400', bg: 'bg-lime-500/10' },
  { id: 'gamification', label: 'Gamificação', icon: Star, description: 'Pontos, medalhas e engajamento', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'marketplace', label: 'Marketplace', icon: Globe, description: 'Loja online e marketplace', color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { id: 'erp', label: 'ERP', icon: BarChart3, description: 'Gestão empresarial avançada', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { id: 'multi_unit', label: 'Multi-unidade', icon: Building2, description: 'Múltiplas unidades e filiais', color: 'text-indigo-300', bg: 'bg-indigo-400/10' },
]

export default function NewEcosystemForVerticalPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [vertical, setVertical] = useState<VerticalRecord | null>(null)
  const [loadingVertical, setLoadingVertical] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [createdName, setCreatedName] = useState('')

  const [formData, setFormData] = useState({
    name: "",
    clientEmail: "",
    businessModel: "CREDIT" as "CREDIT" | "MONETARY",
  })
  const [modules, setModules] = useState<Record<string, boolean>>({})

  // ─── Carregar verticalização ───────────────────────────────────────────────
  const loadVertical = useCallback(async () => {
    setLoadingVertical(true)
    try {
      const data = await getVerticalizationBySlug(slug)
      if (!data) {
        setNotFound(true)
        return
      }
      setVertical(data)

      // Pre-carregar módulos da verticalização (ou defaults do nicho)
      const savedModules = data.modules && Object.keys(data.modules).length > 0
        ? data.modules
        : getDefaultModulesForNiche(data.niche as NicheType)
      setModules(savedModules)

      // Pre-selecionar modelo de cobrança baseado no nicho
      const isMonetary = monetaryBasedNiches.includes(data.niche as NicheType)
      setFormData(prev => ({
        ...prev,
        businessModel: isMonetary ? "MONETARY" : "CREDIT"
      }))
    } catch {
      setNotFound(true)
      toast.error('Erro ao carregar verticalização')
    } finally {
      setLoadingVertical(false)
    }
  }, [slug])

  useEffect(() => {
    loadVertical()
  }, [loadVertical])

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    setModules(prev => ({ ...prev, [moduleId]: checked }))
  }

  const handleResetModules = () => {
    if (!vertical) return
    const defaults = vertical.modules && Object.keys(vertical.modules).length > 0
      ? vertical.modules
      : getDefaultModulesForNiche(vertical.niche as NicheType)
    setModules(defaults)
    toast.info('Módulos restaurados ao padrão da verticalização.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vertical) return
    setLoading(true)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        toast.error("Sessão expirada. Por favor, faça login novamente.")
        return
      }

      const result = await createEcosystemInvite({
        name: formData.name,
        niche: vertical.niche,
        clientEmail: formData.clientEmail,
        businessModel: formData.businessModel,
        modules: modules,
        accessToken: session.access_token,
      })

      setCreatedName(formData.name)
      setInviteUrl(result.inviteUrl)
      toast.success("Sistema criado com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar sistema")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      toast.success("Link copiado!")
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loadingVertical) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950">
        <AdminHeader title="Carregando..." />
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      </div>
    )
  }

  // ─── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !vertical) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950">
        <AdminHeader title="Verticalização não encontrada" />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <p className="text-slate-400">Verticalização não encontrada.</p>
            <Link href="/admin/verticalizations">
              <Button variant="outline" className="border-slate-700 text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const IconComponent = ICON_MAP[vertical.icon_name] || Layers
  const niche = nicheDictionary.pt[vertical.niche as NicheType]
  const enabledCount = Object.values(modules).filter(Boolean).length

  // ─── Sucesso ───────────────────────────────────────────────────────────────
  if (inviteUrl) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
        <AdminHeader title="Sistema Criado" />
        <div className="p-8 max-w-2xl mx-auto w-full space-y-4">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <CardTitle className="text-2xl text-white">Pronto para ativação!</CardTitle>
              <CardDescription className="text-slate-400">
                O sistema <strong className="text-white">{createdName}</strong> foi configurado dentro de{" "}
                <span className={cn("font-semibold", vertical.icon_color)}>{vertical.name}</span>.
                Envie o link abaixo ao cliente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Link de Resgate</Label>
                <div className="flex gap-2">
                  <Input value={inviteUrl} readOnly className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-xs" />
                  <Button onClick={copyToClipboard} variant="outline" className="border-slate-700 text-slate-400 hover:text-white flex-shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-400 hover:text-white flex-1"
                  onClick={() => {
                    setInviteUrl(null)
                    setCreatedName('')
                    setFormData({ name: '', clientEmail: '', businessModel: formData.businessModel })
                  }}
                >
                  Criar Outro Sistema
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-400 hover:text-white flex-1"
                  onClick={() => router.push(`/admin/verticalizations/${slug}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar à Verticalização
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1"
                  onClick={() => window.open(inviteUrl, '_blank')}
                >
                  Testar Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Formulário principal ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen pb-10 bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title={`Novo Sistema — ${vertical.name}`} />

      <div className="p-8 max-w-[1200px] mx-auto w-full space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/verticalizations"
            className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Verticalizações
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
          <Link
            href={`/admin/verticalizations/${slug}`}
            className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <IconComponent className={cn("w-3.5 h-3.5", vertical.icon_color)} />
            {vertical.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
          <span className="text-slate-300 font-semibold">Novo Sistema</span>
        </div>

        {/* Banner da Verticalização */}
        <div className={cn("rounded-2xl border p-5 flex items-center gap-5", vertical.icon_bg.replace('bg-', 'border-').replace('/10', '/20'), "bg-slate-900/60")}>
          <div className={cn("w-14 h-14 rounded-xl border flex items-center justify-center flex-shrink-0", vertical.icon_bg)}>
            <IconComponent className={cn("w-7 h-7", vertical.icon_color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h2 className="text-lg font-black text-white">{vertical.name}</h2>
              <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-widest border", vertical.icon_color, vertical.icon_bg)}>
                Nicho fixo
              </Badge>
            </div>
            <p className="text-slate-500 text-xs">
              Criando sistema para o nicho{" "}
              <code className={cn("font-mono font-bold", vertical.icon_color)}>{vertical.niche}</code>
              {niche && (
                <span className="text-slate-600">
                  {" "}· {niche.establishment} · cliente = {niche.client} · profissional = {niche.provider}
                </span>
              )}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{enabledCount}</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Módulos</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── COLUNA PRINCIPAL ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Dados do Sistema */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  Dados do Sistema
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Informações básicas para configurar o ambiente do cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Nome do {niche?.establishment || 'Negócio'}
                  </Label>
                  <Input
                    placeholder={`Ex: ${niche?.establishment || 'Empresa'} Central`}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Email do Cliente <span className="text-slate-600 font-normal">(Opcional)</span></Label>
                  <Input
                    placeholder="cliente@email.com"
                    type="email"
                    value={formData.clientEmail}
                    onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500"
                  />
                  <p className="text-xs text-slate-600">
                    Apenas para registro — o link de ativação será gerado independentemente.
                  </p>
                </div>

                {/* Modelo de cobrança */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Modelo de Cobrança</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'CREDIT', label: 'Créditos (Flex Pass)', desc: 'Ideal para pacotes de aulas' },
                      { value: 'MONETARY', label: 'Monetário (Direto)', desc: 'Cobrança em moeda por serviço' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, businessModel: opt.value as "CREDIT" | "MONETARY" })}
                        className={cn(
                          'flex flex-col text-left p-3.5 rounded-xl border transition-all',
                          formData.businessModel === opt.value
                            ? 'border-indigo-500/50 bg-indigo-500/10'
                            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                        )}
                      >
                        <span className={cn('text-sm font-bold', formData.businessModel === opt.value ? 'text-indigo-300' : 'text-slate-400')}>
                          {opt.label}
                        </span>
                        <span className="text-xs text-slate-600 mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Módulos */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-slate-200 text-base">Módulos do Sistema</CardTitle>
                    <CardDescription className="text-slate-600 text-xs mt-1">
                      Pré-carregados com a configuração de{" "}
                      <span className={cn("font-semibold", vertical.icon_color)}>{vertical.name}</span>.
                      <span className="ml-1 text-indigo-400 font-semibold">{enabledCount}/{AVAILABLE_MODULES.length} ativos</span>
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetModules}
                    className="border-slate-700 text-slate-500 hover:text-white text-xs flex-shrink-0"
                  >
                    Restaurar padrão
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_MODULES.map(mod => {
                    const enabled = modules[mod.id] ?? false
                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleModuleToggle(mod.id, !enabled)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none',
                          enabled
                            ? 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10'
                            : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', enabled ? mod.bg : 'bg-slate-800')}>
                          <mod.icon className={cn('w-4 h-4', enabled ? mod.color : 'text-slate-600')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-semibold truncate', enabled ? 'text-white' : 'text-slate-500')}>
                            {mod.label}
                          </p>
                          <p className="text-[10px] text-slate-600 truncate">{mod.description}</p>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={v => handleModuleToggle(mod.id, v)}
                          onClick={e => e.stopPropagation()}
                          className="flex-shrink-0"
                        />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Vocabulário do nicho */}
            {niche && (
              <Card className={cn("border", vertical.icon_bg.replace('/10', '/20'), "bg-slate-900/30")}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-sm flex items-center gap-2", vertical.icon_color)}>
                    <Building2 className="w-4 h-4" />
                    Como o sistema será apresentado ao cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Estabelecimento', value: niche.establishment },
                      { label: 'Cliente', value: niche.client },
                      { label: 'Profissional', value: niche.provider },
                      { label: 'Serviço', value: niche.service },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-xl bg-slate-800/50">
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", vertical.icon_color)}>
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── SIDEBAR / RESUMO ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <Card className="bg-indigo-600 text-white border-none shadow-xl sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Feature Builder
                </CardTitle>
                <CardDescription className="text-indigo-100 text-xs">
                  Sistema contextualizado para <strong>{vertical.name}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/10 p-4 rounded-xl space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Nicho:</span>
                    <span className="font-bold capitalize">{vertical.niche}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Módulos ativos:</span>
                    <span className="font-bold">{enabledCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Cobrança:</span>
                    <span className="font-bold">
                      {formData.businessModel === 'CREDIT' ? 'Créditos' : 'Monetário'}
                    </span>
                  </div>
                  {formData.name && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-indigo-200 text-xs mb-0.5">Sistema:</p>
                      <p className="font-bold truncate">{formData.name}</p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold h-12 text-sm"
                  disabled={loading || !formData.name}
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : `Gerar Sistema — ${niche?.establishment || 'Empresa'}`
                  }
                </Button>

                <Link href={`/admin/verticalizations/${slug}`} className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Voltar para {vertical.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

        </form>
      </div>
    </div>
  )
}
