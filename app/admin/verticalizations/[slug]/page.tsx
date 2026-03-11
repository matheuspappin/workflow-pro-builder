"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  ArrowLeft, ChevronRight, Settings, Users, Building2, TrendingUp,
  Globe, RefreshCw, Eye, ExternalLink, Layers, Zap, CheckCircle2,
  Edit3, Save, X, BarChart3, ClipboardList, DollarSign, Loader2,
  Package, Heart, Scissors, Dumbbell, ChefHat, Stethoscope, Hammer,
  FireExtinguisher, Home, BookOpen, Car, Leaf, Music, Camera,
  ShoppingCart, Briefcase, GraduationCap, Star, Plus, Shield, Truck,
  MessageSquare, ScanLine, LayoutDashboard, Puzzle, Trash2, AlertTriangle,
  CalendarDays, Wrench, Receipt,
} from "lucide-react"
import {
  getVerticalizationBySlug,
  updateVerticalization,
  updateVerticalizationModules,
  deleteVerticalization,
  getTenantsForVerticalization,
  type VerticalRecord,
  type TenantRow,
} from "@/lib/actions/verticalization"
import { VerticalizationPlansCard } from "@/components/admin/verticalization-plans-card"
import { getDefaultModulesForNiche } from "@/config/niche-modules"
import { nicheDictionary, type NicheType } from "@/config/niche-dictionary"
import { cn } from "@/lib/utils"

// ─── Mapa de ícones por nome ────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FireExtinguisher, Shield, Stethoscope, Wrench, Hammer, Truck, Car,
  Scissors, Dumbbell, ChefHat, Leaf, Music, Camera, Home, BookOpen,
  GraduationCap, ShoppingCart, Briefcase, Package, Heart, Globe, Layers,
  Zap, Star, Users, Settings, Building2,
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  beta: { label: 'Beta', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  coming_soon: { label: 'Em Breve', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

// ─── Módulos disponíveis ───────────────────────────────────────────────────────
const AVAILABLE_MODULES = [
  {
    id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard,
    description: 'Painel principal com KPIs e resumos',
    color: 'text-indigo-400', bg: 'bg-indigo-500/10',
  },
  {
    id: 'students', label: 'Gestão de Clientes', icon: Users,
    description: 'Cadastro e gerenciamento de clientes/alunos',
    color: 'text-blue-400', bg: 'bg-blue-500/10',
  },
  {
    id: 'classes', label: 'Agenda / Turmas', icon: CalendarDays,
    description: 'Agendamentos, turmas e horários de serviço',
    color: 'text-violet-400', bg: 'bg-violet-500/10',
  },
  {
    id: 'financial', label: 'Financeiro', icon: DollarSign,
    description: 'Cobranças, pagamentos e relatórios financeiros',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10',
  },
  {
    id: 'service_orders', label: 'Ordens de Serviço', icon: ClipboardList,
    description: 'OS, vistorias e controle de serviços técnicos',
    color: 'text-orange-400', bg: 'bg-orange-500/10',
  },
  {
    id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare,
    description: 'Notificações e automações via WhatsApp Business',
    color: 'text-green-400', bg: 'bg-green-500/10',
  },
  {
    id: 'ai_chat', label: 'IA Chat', icon: Zap,
    description: 'Assistente inteligente com IA generativa',
    color: 'text-purple-400', bg: 'bg-purple-500/10',
  },
  {
    id: 'pos', label: 'PDV (Ponto de Venda)', icon: ShoppingCart,
    description: 'Venda de produtos e serviços no balcão',
    color: 'text-amber-400', bg: 'bg-amber-500/10',
  },
  {
    id: 'scanner', label: 'Scanner / Acesso', icon: ScanLine,
    description: 'Scanner QR para controle de acesso e validação',
    color: 'text-cyan-400', bg: 'bg-cyan-500/10',
  },
  {
    id: 'inventory', label: 'Estoque', icon: Package,
    description: 'Controle de estoque, insumos e inventário',
    color: 'text-rose-400', bg: 'bg-rose-500/10',
  },
  {
    id: 'leads', label: 'Leads (CRM)', icon: TrendingUp,
    description: 'Gestão de leads e funil de vendas',
    color: 'text-lime-400', bg: 'bg-lime-500/10',
  },
  {
    id: 'gamification', label: 'Gamificação', icon: Star,
    description: 'Pontos, medalhas e sistema de engajamento',
    color: 'text-yellow-400', bg: 'bg-yellow-500/10',
  },
  {
    id: 'marketplace', label: 'Marketplace', icon: Globe,
    description: 'Loja online e marketplace público',
    color: 'text-teal-400', bg: 'bg-teal-500/10',
  },
  {
    id: 'erp', label: 'ERP', icon: BarChart3,
    description: 'Gestão empresarial integrada e relatórios avançados',
    color: 'text-slate-400', bg: 'bg-slate-500/10',
  },
  {
    id: 'multi_unit', label: 'Multi-unidade', icon: Building2,
    description: 'Gestão de múltiplas unidades e filiais',
    color: 'text-indigo-300', bg: 'bg-indigo-400/10',
  },
  {
    id: 'fiscal', label: 'Emissor Fiscal (NF-e)', icon: Receipt,
    description: 'Emissão de Notas Fiscais Eletrônicas via SEFAZ',
    color: 'text-amber-400', bg: 'bg-amber-500/10',
  },
]

// ─── COLOR PALETTES ────────────────────────────────────────────────────────────
const COLOR_PALETTES = [
  { label: 'Vermelho', color: 'red', iconColor: 'text-red-400', iconBg: 'bg-red-500/10 border-red-500/20' },
  { label: 'Indigo', color: 'indigo', iconColor: 'text-indigo-400', iconBg: 'bg-indigo-500/10 border-indigo-500/20' },
  { label: 'Violeta', color: 'violet', iconColor: 'text-violet-400', iconBg: 'bg-violet-500/10 border-violet-500/20' },
  { label: 'Esmeralda', color: 'emerald', iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Âmbar', color: 'amber', iconColor: 'text-amber-400', iconBg: 'bg-amber-500/10 border-amber-500/20' },
  { label: 'Azul', color: 'blue', iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10 border-blue-500/20' },
  { label: 'Rosa', color: 'pink', iconColor: 'text-pink-400', iconBg: 'bg-pink-500/10 border-pink-500/20' },
  { label: 'Ciano', color: 'cyan', iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10 border-cyan-500/20' },
  { label: 'Laranja', color: 'orange', iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10 border-orange-500/20' },
  { label: 'Teal', color: 'teal', iconColor: 'text-teal-400', iconBg: 'bg-teal-500/10 border-teal-500/20' },
]

const ICON_OPTIONS = [
  { name: 'FireExtinguisher', icon: FireExtinguisher },
  { name: 'Building2', icon: Building2 },
  { name: 'Shield', icon: Shield },
  { name: 'Stethoscope', icon: Stethoscope },
  { name: 'Wrench', icon: Wrench },
  { name: 'Hammer', icon: Hammer },
  { name: 'Truck', icon: Truck },
  { name: 'Car', icon: Car },
  { name: 'Scissors', icon: Scissors },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'ChefHat', icon: ChefHat },
  { name: 'Leaf', icon: Leaf },
  { name: 'Music', icon: Music },
  { name: 'Camera', icon: Camera },
  { name: 'Home', icon: Home },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Package', icon: Package },
  { name: 'Heart', icon: Heart },
  { name: 'Globe', icon: Globe },
  { name: 'Layers', icon: Layers },
  { name: 'Zap', icon: Zap },
  { name: 'Star', icon: Star },
  { name: 'Users', icon: Users },
]


// ─── Component ────────────────────────────────────────────────────────────────
export default function VerticalizationManagePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [vertical, setVertical] = useState<VerticalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Edit mode state
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: 'coming_soon' as 'active' | 'beta' | 'coming_soon',
    icon_name: 'Layers',
    icon_color: 'text-indigo-400',
    icon_bg: 'bg-indigo-500/10 border-indigo-500/20',
    landing_url: '',
    admin_url: '',
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')

  // Module state
  const [modules, setModules] = useState<Record<string, boolean>>({})
  const [modulesDirty, setModulesDirty] = useState(false)
  const [savingModules, setSavingModules] = useState(false)

  // Delete
  const [deleting, setDeleting] = useState(false)

  // Tenants
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)

  // ─── Load verticalization ───────────────────────────────────────────────────
  const loadVertical = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getVerticalizationBySlug(slug)
      if (!data) {
        setNotFound(true)
        return
      }
      setVertical(data)

      // Init edit form
      setEditForm({
        name: data.name,
        description: data.description,
        status: data.status as 'active' | 'beta' | 'coming_soon',
        icon_name: data.icon_name,
        icon_color: data.icon_color,
        icon_bg: data.icon_bg,
        landing_url: data.landing_url || '',
        admin_url: data.admin_url || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
      })

      // Init modules: use saved modules or fallback to niche defaults
      const savedModules = data.modules && Object.keys(data.modules).length > 0
        ? data.modules
        : getDefaultModulesForNiche(data.niche as NicheType)
      setModules(savedModules)

      // Load tenants
      loadTenants(data.niche)
    } catch {
      toast.error('Erro ao carregar verticalização')
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [slug])

  const loadTenants = async (niche: string) => {
    setLoadingTenants(true)
    try {
      const studios = await getTenantsForVerticalization(niche)
      setTenants(studios)
    } catch {
      setTenants([])
    } finally {
      setLoadingTenants(false)
    }
  }

  useEffect(() => {
    loadVertical()
  }, [loadVertical])

  // ─── Save info ──────────────────────────────────────────────────────────────
  const handleSaveInfo = async () => {
    if (!vertical) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const updated = await updateVerticalization(vertical.id, {
        ...editForm,
        accessToken: session?.access_token,
      })
      setVertical(prev => prev ? { ...prev, ...updated } : null)
      setEditMode(false)
      toast.success('Verticalização atualizada!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // ─── Save modules ───────────────────────────────────────────────────────────
  const handleSaveModules = async () => {
    if (!vertical) return
    setSavingModules(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await updateVerticalizationModules(vertical.id, modules, session?.access_token)
      setVertical(prev => prev ? { ...prev, modules } : null)
      setModulesDirty(false)
      toast.success('Módulos atualizados com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar módulos')
    } finally {
      setSavingModules(false)
    }
  }

  const handleModuleToggle = (moduleId: string, value: boolean) => {
    setModules(prev => ({ ...prev, [moduleId]: value }))
    setModulesDirty(true)
  }

  const handleApplyDefaults = () => {
    if (!vertical) return
    const defaults = getDefaultModulesForNiche(vertical.niche as NicheType)
    setModules(defaults)
    setModulesDirty(true)
    toast.info('Módulos padrão do nicho aplicados. Clique em Salvar para confirmar.')
  }

  // ─── Delete verticalization ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!vertical) return
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await deleteVerticalization(vertical.id, session?.access_token)
      toast.success(`Verticalização "${vertical.name}" excluída com sucesso.`)
      router.push('/admin/verticalizations')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir verticalização')
      setDeleting(false)
    }
  }

  // ─── Tag management ─────────────────────────────────────────────────────────
  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !editForm.tags.includes(tag)) {
      setEditForm(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  // ─── Loading / Not found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950">
        <AdminHeader title="Carregando..." />
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-slate-500 text-sm">Carregando verticalização...</p>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !vertical) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950">
        <AdminHeader title="Não encontrado" />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Verticalização não encontrada</h2>
            <p className="text-slate-500 text-sm">
              Não existe uma verticalização com o slug <code className="text-indigo-400 bg-slate-800 px-1.5 py-0.5 rounded">/{slug}</code>.
              Verifique se o link está correto ou crie uma nova verticalização.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/admin/verticalizations">
                <Button variant="outline" className="border-slate-700 text-slate-400 hover:text-white gap-2">
                  <ArrowLeft className="w-4 h-4" /> Ver Todas
                </Button>
              </Link>
              <Link href="/admin/verticalizations/new">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Plus className="w-4 h-4" /> Nova Verticalização
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const status = STATUS_CONFIG[vertical.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.coming_soon
  const IconComponent = ICON_MAP[vertical.icon_name] || Layers
  const EditIconComponent = ICON_MAP[editForm.icon_name] || Layers
  const niche = nicheDictionary.pt[vertical.niche as NicheType]
  const enabledModuleCount = Object.values(modules).filter(Boolean).length
  const editStatus = STATUS_CONFIG[editForm.status]

  return (
    <div className="flex flex-col min-h-screen pb-10 bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title={`${vertical.name} — Gestão da Verticalização`} />

      <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/verticalizations" className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Verticalizações
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <IconComponent className={cn("w-3.5 h-3.5", vertical.icon_color)} />
            {vertical.name}
          </span>
        </div>

        {/* ── HERO BANNER ──────────────────────────────────────────────────────── */}
        {!editMode ? (
          <div className="rounded-2xl overflow-hidden border border-slate-700/50 relative">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.80) 100%)`
              }}
            />
            <div className={cn("absolute inset-0 opacity-10 pointer-events-none", vertical.icon_bg)} />
            <div className="relative p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className={cn('w-16 h-16 rounded-2xl border flex items-center justify-center flex-shrink-0', vertical.icon_bg)}>
                  <IconComponent className={cn('w-8 h-8', vertical.icon_color)} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="text-2xl font-black text-white tracking-tight">{vertical.name}</h1>
                    <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border', status.className)}>
                      {status.label}
                    </span>
                    {vertical.tags?.map(tag => (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-400 text-sm max-w-xl leading-relaxed">{vertical.description}</p>
                  {niche && (
                    <p className="text-slate-600 text-xs mt-1.5">
                      Nicho: <span className={cn('font-semibold', vertical.icon_color)}>{niche.name}</span>
                      <span className="mx-1.5 text-slate-700">·</span>
                      <code className="text-slate-500">{vertical.niche}</code>
                      <span className="mx-1.5 text-slate-700">·</span>
                      Slug: <code className="text-slate-500">/{vertical.slug}</code>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadVertical}
                  className="border-slate-700 text-slate-400 hover:text-white gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="border-slate-700 text-slate-400 hover:text-white gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </Button>
                {vertical.landing_url && (
                  <Link href={vertical.landing_url} target="_blank">
                    <Button size="sm" className={cn('text-white gap-2 font-bold', vertical.icon_bg.includes('red') ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700')}>
                      <Eye className="w-3.5 h-3.5" />
                      Ver Solução
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── EDIT MODE ─────────────────────────────────────────────────────── */
          <Card className="bg-slate-900/80 border-indigo-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" />
                  Editar Verticalização
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditMode(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: text fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nome da Solução</Label>
                    <Input
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Descrição</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500 min-h-[90px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={v => setEditForm(prev => ({ ...prev, status: v as any }))}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="active" className="text-emerald-400 focus:bg-slate-800">Ativo</SelectItem>
                        <SelectItem value="beta" className="text-amber-400 focus:bg-slate-800">Beta</SelectItem>
                        <SelectItem value="coming_soon" className="text-slate-400 focus:bg-slate-800">Em Breve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs">Landing Page URL</Label>
                      <Input
                        value={editForm.landing_url}
                        onChange={e => setEditForm(prev => ({ ...prev, landing_url: e.target.value }))}
                        className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500 font-mono text-xs"
                        placeholder="/solutions/nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs">Admin URL</Label>
                      <Input
                        value={editForm.admin_url}
                        onChange={e => setEditForm(prev => ({ ...prev, admin_url: e.target.value }))}
                        className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500 font-mono text-xs"
                        placeholder="/admin/verticalizations/nome"
                      />
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Ex: OS, Técnicos..."
                        className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500 text-sm"
                      />
                      <Button type="button" onClick={addTag} variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white flex-shrink-0">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {editForm.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wide">
                          {tag}
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: icon + color + preview */}
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center gap-4">
                    <div className={cn('w-14 h-14 rounded-xl border flex items-center justify-center flex-shrink-0', editForm.icon_bg)}>
                      <EditIconComponent className={cn('w-7 h-7', editForm.icon_color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white truncate">{editForm.name || 'Nome da Solução'}</p>
                      <p className="text-slate-500 text-xs line-clamp-1">{editForm.description || 'Descrição...'}</p>
                    </div>
                    <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0', editStatus?.className)}>
                      {editStatus?.label}
                    </span>
                  </div>
                  {/* Icon picker */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs">Ícone</Label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {ICON_OPTIONS.map(({ name, icon: Icon }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, icon_name: name }))}
                          className={cn(
                            'flex items-center justify-center p-2 rounded-lg border transition-all',
                            editForm.icon_name === name
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-slate-800 hover:border-slate-600 bg-slate-950/50'
                          )}
                        >
                          <Icon className={cn('w-4 h-4', editForm.icon_name === name ? editForm.icon_color : 'text-slate-500')} />
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Color picker */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs">Cor do Tema</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {COLOR_PALETTES.map(palette => (
                        <button
                          key={palette.color}
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, icon_color: palette.iconColor, icon_bg: palette.iconBg }))}
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-left',
                            editForm.icon_color === palette.iconColor
                              ? 'border-indigo-500/50 bg-indigo-500/10'
                              : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                          )}
                        >
                          <div className={cn('w-5 h-5 rounded border flex items-center justify-center flex-shrink-0', palette.iconBg)}>
                            <EditIconComponent className={cn('w-2.5 h-2.5', palette.iconColor)} />
                          </div>
                          <span className="text-xs text-slate-400 truncate">{palette.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save/Cancel buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  className="border-slate-700 text-slate-400 hover:text-white"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveInfo}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Building2, label: 'Empresas Ativas', value: vertical.stats?.tenants ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Users, label: 'Total de Usuários', value: vertical.stats?.users ?? 0, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { icon: Puzzle, label: 'Módulos Ativos', value: enabledModuleCount, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { icon: DollarSign, label: 'MRR', value: vertical.stats?.mrr ? `R$${vertical.stats.mrr}` : '--', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-5 pb-4">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', kpi.bg)}>
                  <kpi.icon className={cn('w-4.5 h-4.5', kpi.color)} />
                </div>
                <p className="text-2xl font-black text-white">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── MODULES MANAGEMENT ──────────────────────────────────────────────── */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Puzzle className="w-5 h-5 text-indigo-400" />
                  Módulos da Verticalização
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Configure quais módulos estarão disponíveis para os tenants desta solução.
                  <span className="ml-2 text-indigo-400 font-semibold">{enabledModuleCount}/{AVAILABLE_MODULES.length} módulos ativos</span>
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyDefaults}
                  className="border-slate-700 text-slate-400 hover:text-white gap-2 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restaurar Padrão do Nicho
                </Button>
                {modulesDirty && (
                  <Button
                    size="sm"
                    onClick={handleSaveModules}
                    disabled={savingModules}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                  >
                    {savingModules ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar Módulos
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_MODULES.map(mod => {
                const enabled = modules[mod.id] ?? false
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleModuleToggle(mod.id, !enabled)}
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
                      onCheckedChange={v => handleModuleToggle(mod.id, v)}
                      onClick={e => e.stopPropagation()}
                      className="flex-shrink-0"
                    />
                  </div>
                )
              })}
            </div>
            {modulesDirty && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-amber-300 text-sm flex-1">
                  Você tem alterações não salvas nos módulos.
                </p>
                <Button type="button" size="sm" onClick={handleSaveModules} disabled={savingModules} className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5 flex-shrink-0">
                  {savingModules ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar Agora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── PLANOS E PREÇOS (por verticalização) ───────────────────────────── */}
        <VerticalizationPlansCard
          verticalizationId={vertical.id}
          verticalizationSlug={vertical.slug}
          verticalizationName={vertical.name}
          landingUrl={vertical.landing_url}
          iconColor={vertical.icon_color}
          iconBg={vertical.icon_bg}
        />

        {/* ── TENANTS + QUICK ACTIONS ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Ações Rápidas */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Settings className={cn("w-4 h-4", vertical.icon_color)} />
                Acessar Ambiente
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs">
                Navegue pelas páginas públicas desta verticalização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {vertical.landing_url && (
                <Link href={vertical.landing_url} target="_blank">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 mb-1">
                    <Globe className="w-3.5 h-3.5" /> Ver Landing Page <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                  </Button>
                </Link>
              )}
              {vertical.landing_url && (
                <Link href={`${vertical.landing_url}/login`} target="_blank">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 mb-1">
                    <Shield className="w-3.5 h-3.5" /> Página de Login <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                  </Button>
                </Link>
              )}
              {vertical.landing_url && (
                <Link href={`${vertical.landing_url}/register`} target="_blank">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700">
                    <Users className="w-3.5 h-3.5" /> Página de Registro <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                  </Button>
                </Link>
              )}
              <div className="pt-3 border-t border-slate-800">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Criar Sistema</p>
                <Link href={`/admin/verticalizations/${vertical.slug}/new-ecosystem`}>
                  <Button size="sm" className={cn(
                    'w-full justify-start gap-2 border font-bold',
                    'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border-indigo-500/20'
                  )}>
                    <Plus className="w-3.5 h-3.5" />
                    Novo Sistema ({niche?.establishment || 'Empresa'})
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </Button>
                </Link>
              </div>
              <div className="pt-2">
                <Link href={`/admin/studios?niche=${vertical.niche}`}>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700">
                    <Building2 className="w-3.5 h-3.5" />
                    Ver Tenants ({vertical.stats?.tenants ?? 0})
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Tenants Recentes */}
          <Card className="bg-slate-900/50 border-slate-800 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Empresas Cadastradas
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-xs">
                    Tenants que utilizam esta verticalização
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadTenants(vertical.niche)}
                  disabled={loadingTenants}
                  className="text-slate-500 hover:text-white"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', loadingTenants && 'animate-spin')} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTenants ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
                </div>
              ) : tenants.length > 0 ? (
                <div className="space-y-2">
                  {tenants.map(tenant => (
                    <Link
                      key={tenant.id}
                      href={`/admin/studios/${tenant.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors group"
                    >
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', vertical.icon_bg)}>
                        <span className={cn('text-sm font-black', vertical.icon_color)}>
                          {tenant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-sm font-semibold truncate">{tenant.name}</p>
                        <p className="text-slate-600 text-[10px]">/{tenant.slug}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-slate-600 text-[10px]">
                          {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                  {tenants.length >= 10 && (
                    <Link
                      href={`/admin/studios?niche=${vertical.niche}`}
                      className="flex items-center justify-center gap-1.5 pt-2 text-[11px] font-bold text-slate-600 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                    >
                      Ver todos <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-semibold">Nenhuma empresa ainda</p>
                    <p className="text-slate-700 text-xs mt-1">
                      Crie um ecossistema ou aguarde registros via landing page
                    </p>
                  </div>
                  <Link href={`/admin/verticalizations/${vertical.slug}/new-ecosystem`}>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold mt-1">
                      <Plus className="w-3.5 h-3.5" />
                      Criar Primeiro Sistema
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── CONFIGURAÇÃO TÉCNICA ─────────────────────────────────────────────── */}
        <Card className="bg-slate-900/30 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              Configuração Técnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Nicho (key)', value: vertical.niche },
                { label: 'Slug', value: `/${vertical.slug}` },
                { label: 'Admin URL', value: vertical.admin_url || `/admin/verticalizations/${vertical.slug}` },
                { label: 'Landing URL', value: vertical.landing_url || `/solutions/${vertical.slug}` },
                { label: 'Status', value: status.label },
                { label: 'Criado em', value: new Date(vertical.created_at).toLocaleDateString('pt-BR') },
                { label: 'Cliente', value: niche?.client || '—' },
                { label: 'Profissional', value: niche?.provider || '—' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className={cn('text-sm font-mono font-semibold truncate', vertical.icon_color)}>{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── ZONA DE PERIGO ───────────────────────────────────────────────────── */}
        <Card className="bg-red-950/20 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400 text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Zona de Perigo
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Ações irreversíveis. Proceda com cautela.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <div>
                <p className="text-slate-300 text-sm font-semibold">Excluir Verticalização</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Remove permanentemente <span className="text-red-400 font-semibold">{vertical.name}</span> e todos os seus dados de configuração. Esta ação não pode ser desfeita.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deleting}
                    className="flex-shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 gap-2"
                  >
                    {deleting
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                    {deleting ? 'Excluindo...' : 'Excluir Verticalização'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      Confirmar exclusão
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      Tem certeza que deseja excluir a verticalização{' '}
                      <span className="text-white font-semibold">"{vertical.name}"</span>?
                      <br /><br />
                      Esta ação é <span className="text-red-400 font-semibold">permanente e irreversível</span>.
                      Todos os dados de configuração desta verticalização serão removidos.
                      {(vertical.stats?.tenants ?? 0) > 0 && (
                        <span className="block mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                          Atenção: esta verticalização possui{' '}
                          <strong>{vertical.stats?.tenants}</strong> empresa(s) associada(s).
                          Verifique antes de prosseguir.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-slate-700 text-slate-400 hover:text-white bg-transparent">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sim, excluir permanentemente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
