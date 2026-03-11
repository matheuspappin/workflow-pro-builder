"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { createVerticalization } from "@/lib/actions/verticalization"
import { nicheDictionary, NicheType } from "@/config/niche-dictionary"
import { getDefaultModulesForNiche } from "@/config/niche-modules"
import { Switch } from "@/components/ui/switch"
import {
  Loader2, Check, ArrowLeft, Layers, Globe, Zap, Shield, Truck,
  Building2, Users, Settings, Heart, Scissors, Dumbbell, ChefHat,
  Stethoscope, Hammer, FireExtinguisher, Home, BookOpen, Wrench,
  Car, Leaf, Music, Camera, ShoppingCart, Briefcase, GraduationCap,
  Package, Star, Plus, X, Eye, Palette, ArrowRight,
  LayoutDashboard, CalendarDays, DollarSign, ClipboardList, MessageSquare,
  ScanLine, TrendingUp, BarChart3, Receipt, Puzzle, RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const ICON_OPTIONS = [
  { name: 'FireExtinguisher', icon: FireExtinguisher, label: 'Extintor' },
  { name: 'Building2', icon: Building2, label: 'Prédio' },
  { name: 'Shield', icon: Shield, label: 'Escudo' },
  { name: 'Stethoscope', icon: Stethoscope, label: 'Saúde' },
  { name: 'Wrench', icon: Wrench, label: 'Ferramentas' },
  { name: 'Hammer', icon: Hammer, label: 'Construção' },
  { name: 'Truck', icon: Truck, label: 'Transporte' },
  { name: 'Car', icon: Car, label: 'Automotivo' },
  { name: 'Scissors', icon: Scissors, label: 'Beleza' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Fitness' },
  { name: 'ChefHat', icon: ChefHat, label: 'Gastronomia' },
  { name: 'Leaf', icon: Leaf, label: 'Ambiental' },
  { name: 'Music', icon: Music, label: 'Música' },
  { name: 'Camera', icon: Camera, label: 'Fotografia' },
  { name: 'Home', icon: Home, label: 'Imóveis' },
  { name: 'BookOpen', icon: BookOpen, label: 'Educação' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Academia' },
  { name: 'ShoppingCart', icon: ShoppingCart, label: 'Varejo' },
  { name: 'Briefcase', icon: Briefcase, label: 'Serviços' },
  { name: 'Package', icon: Package, label: 'Estoque' },
  { name: 'Heart', icon: Heart, label: 'Bem-estar' },
  { name: 'Globe', icon: Globe, label: 'Global' },
  { name: 'Layers', icon: Layers, label: 'Plataforma' },
  { name: 'Zap', icon: Zap, label: 'Tecnologia' },
  { name: 'Star', icon: Star, label: 'Premium' },
  { name: 'Users', icon: Users, label: 'Comunidade' },
]

const COLOR_PALETTES = [
  { label: 'Vermelho (Incêndio)', color: 'red', iconColor: 'text-red-400', iconBg: 'bg-red-500/10 border-red-500/20' },
  { label: 'Indigo (Plataforma)', color: 'indigo', iconColor: 'text-indigo-400', iconBg: 'bg-indigo-500/10 border-indigo-500/20' },
  { label: 'Violeta', color: 'violet', iconColor: 'text-violet-400', iconBg: 'bg-violet-500/10 border-violet-500/20' },
  { label: 'Esmeralda (Saúde)', color: 'emerald', iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Âmbar (Construção)', color: 'amber', iconColor: 'text-amber-400', iconBg: 'bg-amber-500/10 border-amber-500/20' },
  { label: 'Azul (Tecnologia)', color: 'blue', iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10 border-blue-500/20' },
  { label: 'Rosa (Beleza)', color: 'pink', iconColor: 'text-pink-400', iconBg: 'bg-pink-500/10 border-pink-500/20' },
  { label: 'Ciano (Logística)', color: 'cyan', iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10 border-cyan-500/20' },
  { label: 'Laranja', color: 'orange', iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10 border-orange-500/20' },
  { label: 'Teal (Ambiental)', color: 'teal', iconColor: 'text-teal-400', iconBg: 'bg-teal-500/10 border-teal-500/20' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo', desc: 'Disponível para clientes imediatamente', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'beta', label: 'Beta', desc: 'Em testes, acesso limitado', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'coming_soon', label: 'Em Breve', desc: 'Ainda em desenvolvimento', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
]

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Painel principal com KPIs e resumos', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'students', label: 'Gestão de Clientes', icon: Users, description: 'Cadastro e gerenciamento de clientes/alunos', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'classes', label: 'Agenda / Turmas', icon: CalendarDays, description: 'Agendamentos, turmas e horários de serviço', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { id: 'financial', label: 'Financeiro', icon: DollarSign, description: 'Cobranças, pagamentos e relatórios financeiros', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'service_orders', label: 'Ordens de Serviço', icon: ClipboardList, description: 'OS, vistorias e controle de serviços técnicos', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, description: 'Notificações e automações via WhatsApp Business', color: 'text-green-400', bg: 'bg-green-500/10' },
  { id: 'ai_chat', label: 'IA Chat', icon: Zap, description: 'Assistente inteligente com IA generativa', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'pos', label: 'PDV (Ponto de Venda)', icon: ShoppingCart, description: 'Venda de produtos e serviços no balcão', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'scanner', label: 'Scanner / Acesso', icon: ScanLine, description: 'Scanner QR para controle de acesso e validação', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'inventory', label: 'Estoque', icon: Package, description: 'Controle de estoque, insumos e inventário', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { id: 'leads', label: 'Leads (CRM)', icon: TrendingUp, description: 'Gestão de leads e funil de vendas', color: 'text-lime-400', bg: 'bg-lime-500/10' },
  { id: 'gamification', label: 'Gamificação', icon: Star, description: 'Pontos, medalhas e sistema de engajamento', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'marketplace', label: 'Marketplace', icon: Globe, description: 'Loja online e marketplace público', color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { id: 'erp', label: 'ERP', icon: BarChart3, description: 'Gestão empresarial integrada e relatórios avançados', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { id: 'multi_unit', label: 'Multi-unidade', icon: Building2, description: 'Gestão de múltiplas unidades e filiais', color: 'text-indigo-300', bg: 'bg-indigo-400/10' },
  { id: 'fiscal', label: 'Emissor Fiscal (NF-e)', icon: Receipt, description: 'Emissão de Notas Fiscais Eletrônicas via SEFAZ', color: 'text-amber-400', bg: 'bg-amber-500/10' },
]

const MODULE_PRESETS: { id: string; label: string; desc: string; getModules: (niche?: NicheType) => Record<string, boolean> }[] = [
  { id: 'custom', label: 'Personalizado', desc: 'Padrão do nicho ou seleção manual', getModules: (niche) => getDefaultModulesForNiche(niche!) },
  { id: 'basic', label: 'Básico (3 Módulos)', desc: 'Dashboard, Clientes e Financeiro', getModules: () => ({ dashboard: true, students: true, financial: true }) },
  { id: 'professional', label: 'Profissional (Completo)', desc: 'Todos os módulos disponíveis', getModules: () => AVAILABLE_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: true }), {} as Record<string, boolean>) },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function NewVerticalizationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    niche: 'fire_protection' as NicheType,
    icon_name: 'Layers',
    icon_color: 'text-indigo-400',
    icon_bg: 'bg-indigo-500/10 border-indigo-500/20',
    landing_url: '',
    admin_url: '',
    status: 'coming_soon' as 'active' | 'beta' | 'coming_soon',
    tags: [] as string[],
  })
  const [modules, setModules] = useState<Record<string, boolean>>(() =>
    getDefaultModulesForNiche('fire_protection' as NicheType)
  )
  const [modulePreset, setModulePreset] = useState<string>('custom')

  // Auto-gera slug a partir do nome
  useEffect(() => {
    if (!slugEdited && formData.name) {
      setFormData(prev => ({ ...prev, slug: slugify(prev.name) }))
    }
  }, [formData.name, slugEdited])

  // Atualiza módulos quando o nicho muda (aplica padrão do nicho)
  useEffect(() => {
    setModules(getDefaultModulesForNiche(formData.niche))
    setModulePreset('custom')
  }, [formData.niche])

  const selectedIcon = ICON_OPTIONS.find(i => i.name === formData.icon_name) || ICON_OPTIONS[0]
  const selectedPalette = COLOR_PALETTES.find(p => p.iconColor === formData.icon_color) || COLOR_PALETTES[0]
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === formData.status) || STATUS_OPTIONS[2]
  const currentNiche = nicheDictionary.pt[formData.niche as NicheType] || nicheDictionary.pt.dance

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('O nome da solução é obrigatório.')
      return
    }
    if (!formData.description.trim()) {
      toast.error('A descrição é obrigatória.')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.')
        return
      }

      await createVerticalization({
        ...formData,
        modules,
        accessToken: session.access_token,
      })

      setSuccess(true)
      toast.success('Verticalização criada com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar verticalização.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
        <AdminHeader title="Verticalização Criada" />
        <div className="p-8 max-w-2xl mx-auto w-full">
          <Card className="border-emerald-500/50 bg-emerald-500/5">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl text-white">Criada com sucesso!</CardTitle>
              <CardDescription className="text-slate-400">
                A solução <strong className="text-white">{formData.name}</strong> foi adicionada à plataforma como verticalização com status <strong>{selectedStatus.label}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0', formData.icon_bg)}>
                  <selectedIcon.icon className={cn('w-6 h-6', formData.icon_color)} />
                </div>
                <div>
                  <p className="font-bold text-white">{formData.name}</p>
                  <p className="text-sm text-slate-400">{currentNiche.name} · /{formData.slug}</p>
                </div>
                <span className={cn('ml-auto text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border', selectedStatus.className)}>
                  {selectedStatus.label}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                  onClick={() => router.push(`/admin/verticalizations/${formData.slug}`)}
                >
                  <Settings className="w-4 h-4" />
                  Gerenciar Verticalização
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-400 hover:text-white"
                    onClick={() => {
                      setSuccess(false)
                      setFormData({
                        name: '', slug: '', description: '', niche: 'fire_protection',
                        icon_name: 'Layers', icon_color: 'text-indigo-400',
                        icon_bg: 'bg-indigo-500/10 border-indigo-500/20',
                        landing_url: '', admin_url: '',
                        status: 'coming_soon', tags: [],
                      })
                      setSlugEdited(false)
                    }}
                  >
                    Criar Outra
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-400 hover:text-white"
                    onClick={() => router.push('/admin/verticalizations')}
                  >
                    Ver Todas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title="Nova Verticalização" />

      <div className="p-8 max-w-[1200px] mx-auto w-full">
        <div className="mb-6">
          <Link href="/admin/verticalizations">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para Verticalizações
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Identidade da Solução */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Identidade da Solução
                </CardTitle>
                <CardDescription>Nome, slug e descrição que identificam esta verticalização.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nome da Solução <span className="text-red-400">*</span></Label>
                  <Input
                    placeholder="Ex: Fire Control, MedClinic Pro, LegalSuite..."
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Slug (URL)</Label>
                  <div className="flex gap-2 items-center">
                    <span className="text-slate-500 text-sm flex-shrink-0">/admin/verticalizations/</span>
                    <Input
                      placeholder="fire-protection"
                      value={formData.slug}
                      onChange={e => {
                        setSlugEdited(true)
                        setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))
                      }}
                      className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 font-mono focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-slate-600">Gerado automaticamente. Altere apenas se necessário.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Descrição <span className="text-red-400">*</span></Label>
                  <Textarea
                    placeholder="Descreva o que esta solução oferece, para quem é e quais problemas resolve..."
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 min-h-[100px] resize-none"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Nicho e Configurações */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-violet-400" />
                  Nicho e Configurações
                </CardTitle>
                <CardDescription>Segmento de mercado e status de lançamento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nicho de Mercado</Label>
                  <Select
                    value={formData.niche}
                    onValueChange={v => setFormData(prev => ({ ...prev, niche: v as NicheType }))}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-slate-900 border-slate-700">
                      {Object.entries(nicheDictionary.pt).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-slate-200 focus:bg-slate-800">
                          <span className="font-bold">{value.name}</span>
                          <span className="ml-2 text-xs text-slate-500 italic">
                            ({value.establishment}, {value.client})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentNiche && (
                    <div className="mt-2 p-3 rounded-lg bg-slate-950/50 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: 'Estabelecimento', value: currentNiche.establishment },
                        { label: 'Cliente', value: currentNiche.client },
                        { label: 'Profissional', value: currentNiche.provider },
                        { label: 'Serviço', value: currentNiche.service },
                      ].map(item => (
                        <div key={item.label}>
                          <span className="text-slate-600 uppercase tracking-widest block">{item.label}</span>
                          <span className="text-slate-300 font-semibold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Status de Lançamento</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: opt.value as any }))}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                          formData.status === opt.value
                            ? 'border-indigo-500/50 bg-indigo-500/10'
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                          formData.status === opt.value ? 'border-indigo-400' : 'border-slate-600'
                        )}>
                          {formData.status === opt.value && (
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={cn('text-sm font-bold px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-widest', opt.className)}>
                            {opt.label}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Módulos Ativos */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Puzzle className="w-5 h-5 text-indigo-400" />
                  Módulos Ativos
                </CardTitle>
                <CardDescription>
                  Selecione o que estará disponível neste plano.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex flex-wrap gap-2">
                  {MODULE_PRESETS.map(preset => {
                    const isActive = modulePreset === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          const mods = preset.id === 'custom'
                            ? preset.getModules(formData.niche)
                            : preset.getModules(undefined)
                          setModules(mods)
                          setModulePreset(preset.id)
                        }}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-left',
                          isActive
                            ? 'border-indigo-500/50 bg-indigo-500/10'
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                        )}
                      >
                        <span className={cn('text-sm font-bold', isActive ? 'text-white' : 'text-slate-400')}>
                          {preset.label}
                        </span>
                        <span className="text-xs text-slate-600">{preset.desc}</span>
                      </button>
                    )
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setModules(getDefaultModulesForNiche(formData.niche))
                      setModulePreset('custom')
                      toast.info('Padrão do nicho aplicado.')
                    }}
                    className="border-slate-700 text-slate-400 hover:text-white gap-2 ml-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Padrão do Nicho
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AVAILABLE_MODULES.map(mod => {
                    const enabled = modules[mod.id] ?? false
                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          setModules(prev => ({ ...prev, [mod.id]: !(prev[mod.id] ?? false) }))
                          setModulePreset('custom')
                        }}
                        className={cn(
                          'flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none',
                          enabled
                            ? 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10'
                            : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all', enabled ? mod.bg : 'bg-slate-800')}>
                          <mod.icon className={cn('w-4.5 h-4.5 transition-colors', enabled ? mod.color : 'text-slate-600')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-semibold transition-colors', enabled ? 'text-white' : 'text-slate-500')}>
                            {mod.label}
                          </p>
                          <p className="text-[10px] text-slate-600 truncate">{mod.description}</p>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={v => {
                            setModules(prev => ({ ...prev, [mod.id]: v }))
                            setModulePreset('custom')
                          }}
                          onClick={e => e.stopPropagation()}
                          className="flex-shrink-0"
                        />
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-600">
                  {Object.values(modules).filter(Boolean).length} módulos ativos
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  Tags e Palavras-chave
                </CardTitle>
                <CardDescription>Termos que descrevem as funcionalidades da solução.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: OS, Técnicos, AVCB, Laudos..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    className="border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <div
                        key={tag}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wide"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">Nenhuma tag adicionada. Digite e pressione Enter.</p>
                )}
              </CardContent>
            </Card>

            {/* URLs opcionais */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  URLs (Opcional)
                </CardTitle>
                <CardDescription>Geradas automaticamente se deixadas em branco.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Landing Page</Label>
                  <Input
                    placeholder={`/solutions/${formData.slug || 'nome-solucao'}`}
                    value={formData.landing_url}
                    onChange={e => setFormData(prev => ({ ...prev, landing_url: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">URL Admin</Label>
                  <Input
                    placeholder={`/admin/verticalizations/${formData.slug || 'nome-solucao'}`}
                    value={formData.admin_url}
                    onChange={e => setFormData(prev => ({ ...prev, admin_url: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">

            {/* Preview */}
            <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  Preview do Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={cn('w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0', formData.icon_bg)}>
                      <selectedIcon.icon className={cn('w-6 h-6', formData.icon_color)} />
                    </div>
                    <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border', selectedStatus.className)}>
                      {selectedStatus.label}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-white text-base leading-tight">
                      {formData.name || 'Nome da Solução'}
                    </p>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">
                      {formData.description || 'Descrição da sua verticalização aparecerá aqui...'}
                    </p>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                          {tag}
                        </span>
                      ))}
                      {formData.tags.length > 4 && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-600">
                          +{formData.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                    {[['0', 'Empresas'], ['0', 'Usuários'], ['--', 'MRR']].map(([val, lbl]) => (
                      <div key={lbl}>
                        <p className="text-sm font-black text-white">{val}</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{lbl}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Ícone */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Ícone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {ICON_OPTIONS.map(({ name, icon: Icon, label }) => (
                    <button
                      key={name}
                      type="button"
                      title={label}
                      onClick={() => setFormData(prev => ({ ...prev, icon_name: name }))}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                        formData.icon_name === name
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-800 hover:border-slate-600 bg-slate-950/50'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', formData.icon_name === name ? formData.icon_color : 'text-slate-500')} />
                      <span className="text-[9px] text-slate-600 truncate w-full text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Paleta de Cores */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Palette className="w-4 h-4 text-pink-400" />
                  Cor do Tema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {COLOR_PALETTES.map(palette => (
                    <button
                      key={palette.color}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        icon_color: palette.iconColor,
                        icon_bg: palette.iconBg
                      }))}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left',
                        formData.icon_color === palette.iconColor
                          ? 'border-indigo-500/50 bg-indigo-500/10'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                      )}
                    >
                      <div className={cn('w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0', palette.iconBg)}>
                        <selectedIcon.icon className={cn('w-3.5 h-3.5', palette.iconColor)} />
                      </div>
                      <span className="text-xs text-slate-400">{palette.label}</span>
                      {formData.icon_color === palette.iconColor && (
                        <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Botão Submit */}
            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-500/20"
              disabled={loading || !formData.name.trim() || !formData.description.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Verticalização
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
