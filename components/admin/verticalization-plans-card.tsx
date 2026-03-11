"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  DollarSign,
  Eye,
  Users,
  GraduationCap,
  Calendar,
  Trophy,
  LayoutDashboard,
  QrCode,
  TrendingUp,
  MessageSquare,
  ShoppingCart,
  Store,
  Package,
  Layers,
  Phone,
  BarChart3,
  Settings,
  Wallet,
  Building2,
  Wrench,
  ClipboardList,
  Receipt,
} from "lucide-react"
import {
  getVerticalizationPlans,
  createVerticalizationPlan,
  updateVerticalizationPlan,
  deleteVerticalizationPlan,
  type VerticalizationPlanRecord,
  type VerticalizationPlanData,
} from "@/lib/actions/verticalization-plans"
import { MODULE_DEFINITIONS, type ModuleKey } from "@/config/modules"
import { getModulesForVerticalization, getModuleKeysForVerticalization } from "@/config/verticalization-nav-modules"
import { getFilteredDanceStudioNav } from "@/config/dance-studio-nav"
import { getFilteredFireProtectionNav } from "@/config/fire-protection-nav"
import { cn } from "@/lib/utils"

interface VerticalizationPlansCardProps {
  verticalizationId?: string
  verticalizationSlug: string
  verticalizationName: string
  landingUrl?: string
  iconColor?: string
  iconBg?: string
}

export function VerticalizationPlansCard({
  verticalizationId: propVerticalizationId,
  verticalizationSlug,
  verticalizationName,
  landingUrl,
  iconColor = "text-indigo-400",
  iconBg = "bg-indigo-500/10",
}: VerticalizationPlansCardProps) {
  const [verticalizationId, setVerticalizationId] = useState<string | null>(propVerticalizationId ?? null)
  const [plans, setPlans] = useState<VerticalizationPlanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<VerticalizationPlanRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewPlan, setPreviewPlan] = useState<VerticalizationPlanRecord | null>(null)
  const [previewSelectedModule, setPreviewSelectedModule] = useState<string>("dashboard")
  const [form, setForm] = useState<Partial<VerticalizationPlanData>>({
    plan_id: "",
    name: "",
    price: 0,
    description: "",
    max_students: 10,
    max_teachers: 1,
    modules: {},
    is_popular: false,
    status: "active",
    trial_days: 14,
  })

  const loadPlans = async (vid: string) => {
    setLoading(true)
    try {
      const data = await getVerticalizationPlans(vid)
      setPlans(data)
    } catch {
      toast.error("Erro ao carregar planos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (propVerticalizationId) {
      setVerticalizationId(propVerticalizationId)
      return
    }
    let cancelled = false
    async function fetchVertical() {
      const { data } = await supabase
        .from("verticalizations")
        .select("id")
        .eq("slug", verticalizationSlug)
        .maybeSingle()
      if (!cancelled && data) return setVerticalizationId(data.id)
      if (!cancelled) setLoading(false)
    }
    fetchVertical()
    return () => { cancelled = true }
  }, [propVerticalizationId, verticalizationSlug])

  useEffect(() => {
    if (verticalizationId) loadPlans(verticalizationId)
  }, [verticalizationId])

  const openCreate = () => {
    setEditingPlan(null)
    const keys = getModuleKeysForVerticalization(verticalizationSlug)
    setForm({
      plan_id: "",
      name: "",
      price: 0,
      description: "",
      max_students: 10,
      max_teachers: 1,
      modules: Object.fromEntries(
        keys.map((k) => [k, MODULE_DEFINITIONS[k]?.default ?? false])
      ),
      is_popular: false,
      status: "active",
      trial_days: 14,
    })
    setDialogOpen(true)
  }

  const openEdit = (plan: VerticalizationPlanRecord) => {
    setEditingPlan(plan)
    const keys = getModuleKeysForVerticalization(verticalizationSlug)
    const planModules = plan.modules || {}
    const modules: Record<string, boolean> = {}
    keys.forEach((k) => {
      modules[k] = planModules[k] ?? MODULE_DEFINITIONS[k]?.default ?? false
    })
    setForm({
      plan_id: plan.plan_id,
      name: plan.name,
      price: Number(plan.price),
      description: plan.description || "",
      max_students: plan.max_students ?? 10,
      max_teachers: plan.max_teachers ?? 1,
      modules,
      is_popular: plan.is_popular ?? false,
      status: plan.status ?? "active",
      trial_days: plan.trial_days ?? 14,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || form.price === undefined) {
      toast.error("Nome e preço são obrigatórios")
      return
    }
    if (!verticalizationId && !editingPlan) {
      toast.error("Aguardando carregamento da verticalização")
      return
    }
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const modules = form.modules || {}
      if (editingPlan) {
        await updateVerticalizationPlan(
          editingPlan.id,
          {
            name: form.name,
            price: form.price,
            description: form.description,
            max_students: form.max_students,
            max_teachers: form.max_teachers,
            modules,
            is_popular: form.is_popular,
            status: form.status,
            trial_days: form.trial_days,
          },
          session?.access_token
        )
        toast.success("Plano atualizado!")
      } else {
        if (!verticalizationId) {
          toast.error("Verticalização não identificada")
          return
        }
        await createVerticalizationPlan(
          verticalizationId,
          {
            plan_id: form.plan_id || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            name: form.name,
            price: form.price,
            description: form.description,
            max_students: form.max_students,
            max_teachers: form.max_teachers,
            modules,
            is_popular: form.is_popular,
            status: form.status,
            trial_days: form.trial_days,
          },
          session?.access_token
        )
        toast.success("Plano criado!")
      }
      setDialogOpen(false)
      if (verticalizationId) loadPlans(verticalizationId)
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await deleteVerticalizationPlan(id, session?.access_token)
      toast.success("Plano excluído")
      if (verticalizationId) loadPlans(verticalizationId)
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir")
    } finally {
      setDeletingId(null)
    }
  }

  const planosUrl = landingUrl ? `${landingUrl}/dashboard/planos` : `/solutions/${verticalizationSlug}/dashboard/planos`

  const verticalizationNotFound = !propVerticalizationId && !verticalizationId && !loading

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <CreditCard className={cn("w-5 h-5", iconColor)} />
                Planos e Preços
              </CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Defina os planos de assinatura para os tenants desta verticalização. Os preços e módulos são independentes do sistema global.
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={openCreate}
                disabled={verticalizationNotFound}
                className={cn("font-bold gap-2", iconBg, "border border-white/10 text-white hover:opacity-90")}
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Plano
              </Button>
              {planosUrl && (
                <Link href={planosUrl} target="_blank">
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white gap-2">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver Página de Planos
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {verticalizationNotFound ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center", iconBg)}>
                <CreditCard className={cn("w-6 h-6", iconColor)} />
              </div>
              <p className="text-slate-500 text-sm font-semibold">Verticalização não encontrada</p>
              <p className="text-slate-700 text-xs max-w-sm">
                A verticalização &quot;{verticalizationSlug}&quot; não existe na tabela <code className="text-slate-500 bg-slate-800 px-1 rounded">verticalizations</code>. Execute as migrations 74 (agroflowai) ou 67 (fire-protection) no Supabase.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-1 gap-2 border-slate-700 text-slate-400"
              >
                Recarregar
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center", iconBg)}>
                <DollarSign className={cn("w-6 h-6", iconColor)} />
              </div>
              <p className="text-slate-500 text-sm font-semibold">Nenhum plano configurado</p>
              <p className="text-slate-700 text-xs max-w-sm">
                Crie planos para que os tenants desta vertical possam assinar e gerenciar suas assinaturas.
              </p>
              <Button size="sm" onClick={openCreate} className={cn("mt-1 gap-2", iconBg, "text-white")}>
                <Plus className="w-3.5 h-3.5" />
                Criar Primeiro Plano
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    plan.status === "active"
                      ? "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                      : "border-slate-800 bg-slate-900/30 opacity-70"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">{plan.name}</h4>
                        {plan.is_popular && (
                          <Badge className="text-[10px] bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-black text-emerald-400 mt-1">
                        R$ {Number(plan.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-slate-500">/mês</span>
                      </p>
                    </div>
                    <Badge
                      variant={plan.status === "active" ? "default" : "secondary"}
                      className={plan.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                    >
                      {plan.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {plan.description && (
                    <p className="text-slate-500 text-xs mb-3 line-clamp-2">{plan.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {Object.entries(plan.modules || {})
                      .filter(([k, v]) => v && getModuleKeysForVerticalization(verticalizationSlug).includes(k as ModuleKey))
                      .slice(0, 5)
                      .map(([k]) => (
                        <Badge key={k} variant="outline" className="text-[10px] bg-slate-800/50 border-slate-700 text-slate-400">
                          {MODULE_DEFINITIONS[k as ModuleKey]?.label || k}
                        </Badge>
                      ))}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPreviewPlan(plan); setPreviewSelectedModule("dashboard") }}
                      className="flex-1 gap-1 text-xs border-slate-700 text-slate-400 hover:text-white hover:border-violet-500/50 hover:text-violet-400"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(plan)}
                      className="flex-1 gap-1 text-xs border-slate-700 text-slate-400 hover:text-white"
                    >
                      <Edit className="w-3 h-3" /> Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === plan.id}
                          className="w-8 h-8 p-0 text-slate-400 hover:text-red-400"
                        >
                          {deletingId === plan.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O plano &quot;{plan.name}&quot; será excluído permanentemente. Tenants com este plano precisarão escolher outro.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(plan.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingPlan ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure o plano de assinatura para {verticalizationName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-slate-950 border-slate-700 text-white"
                  placeholder="Ex: Básico"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">ID (slug)</Label>
                <Input
                  value={form.plan_id}
                  onChange={(e) => setForm((p) => ({ ...p, plan_id: e.target.value }))}
                  className="bg-slate-950 border-slate-700 text-white font-mono text-sm"
                  placeholder="Ex: basico"
                  disabled={!!editingPlan}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Preço (R$/mês)</Label>
                <Input
                  type="number"
                  value={form.price || ""}
                  onChange={(e) => setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Destaque (Popular)</Label>
                <div className="flex items-center h-10">
                  <Switch
                    checked={form.is_popular ?? false}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, is_popular: v }))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Descrição</Label>
              <Input
                value={form.description || ""}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="bg-slate-950 border-slate-700 text-white"
                placeholder="Breve descrição do plano"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Limite Clientes</Label>
                <Input
                  type="number"
                  value={form.max_students ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, max_students: parseInt(e.target.value) || 10 }))}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Limite Profissionais</Label>
                <Input
                  type="number"
                  value={form.max_teachers ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, max_teachers: parseInt(e.target.value) || 1 }))}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Módulos inclusos</Label>
              <p className="text-xs text-slate-500">
                Baseado no nav desta vertical — apenas módulos disponíveis neste nicho.
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                {getModulesForVerticalization(verticalizationSlug).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-400">{label}</span>
                    <Switch
                      checked={(form.modules || {})[key] ?? false}
                      onCheckedChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          modules: { ...(p.modules || {}), [key]: v },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-400">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className={cn("font-bold", iconBg, "text-white")}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingPlan ? "Salvar" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview do Dashboard */}
      <Dialog open={!!previewPlan} onOpenChange={(open) => !open && setPreviewPlan(null)}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden bg-slate-950 border-slate-800 p-0 flex flex-col">
          <div className="flex-shrink-0 border-b border-slate-800 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-400" />
                Preview do Dashboard — {previewPlan?.name}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Menu e módulos inclusos neste plano. Clique nos itens para navegar.
              </DialogDescription>
            </DialogHeader>
          </div>
          {previewPlan && (
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Sidebar - apenas módulos do plano, baseado no nav desta vertical */}
              <aside className="w-52 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 overflow-y-auto">
                <nav className="p-3 space-y-0.5">
                  {(verticalizationSlug === "fire-protection"
                    ? getFilteredFireProtectionNav(previewPlan.modules)
                    : getFilteredDanceStudioNav(previewPlan.modules)
                  ).map((group) => (
                    <div key={group.label} className="mb-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1.5">
                        {group.label}
                      </p>
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = previewSelectedModule === item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPreviewSelectedModule(item.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors",
                              isActive
                                ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                                : "text-slate-400 hover:bg-slate-800/80 hover:text-white border border-transparent"
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </nav>
              </aside>

              {/* Conteúdo principal - mock por módulo */}
              <main className="flex-1 overflow-y-auto p-6 bg-slate-900/30">
                {previewSelectedModule === "dashboard" && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-black text-white">Olá, Admin 👋</h2>
                      <p className="text-slate-500 text-sm">
                        Painel de Controle — {verticalizationSlug === "fire-protection" ? "Fire Control" : "Estúdio de Dança"}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(verticalizationSlug === "fire-protection"
                        ? [
                            { label: "Nova OS", color: "bg-red-600/30" },
                            { label: "Nova Vistoria", color: "bg-orange-600/30" },
                            { label: "Financeiro", color: "bg-emerald-600/30" },
                          ]
                        : [
                            { label: "Novo Aluno", color: "bg-violet-600/30" },
                            { label: "Nova Turma", color: "bg-pink-600/30" },
                            { label: "Financeiro", color: "bg-emerald-600/30" },
                          ]
                      ).map((a) => (
                        <div key={a.label} className={cn("p-3 rounded-lg border border-slate-700 text-center text-xs font-bold", a.color)}>
                          {a.label}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(verticalizationSlug === "fire-protection"
                        ? [
                            { icon: Building2, label: "Clientes", value: "12", color: "text-red-400" },
                            { icon: Wrench, label: "Técnicos", value: "5", color: "text-orange-400" },
                            { icon: ClipboardList, label: "OS", value: "8", color: "text-amber-400" },
                            { icon: DollarSign, label: "Faturamento", value: "R$ 0", color: "text-emerald-400" },
                          ]
                        : [
                            { icon: Users, label: "Alunos", value: "12", color: "text-violet-400" },
                            { icon: GraduationCap, label: "Professores", value: "3", color: "text-pink-400" },
                            { icon: Calendar, label: "Turmas", value: "8", color: "text-indigo-400" },
                            { icon: DollarSign, label: "Faturamento", value: "R$ 0", color: "text-emerald-400" },
                          ]
                      ).map((s) => (
                        <div key={s.label} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                          <s.icon className={cn("w-4 h-4 mb-1", s.color)} />
                          <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {verticalizationSlug !== "fire-protection" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Turmas de Hoje</p>
                          <div className="h-16 rounded-lg bg-slate-900/50 border border-dashed border-slate-700 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-slate-600" />
                          </div>
                        </div>
                        <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-pink-600/20 p-4">
                          <p className="text-[10px] font-bold text-violet-400 uppercase mb-2">Gamificação</p>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-400" />
                            <span className="text-sm text-slate-300">Rankings e conquistas</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {(previewSelectedModule === "alunos" || previewSelectedModule === "clientes") && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      {previewSelectedModule === "clientes" ? (
                        <Building2 className="w-5 h-5 text-red-400" />
                      ) : (
                        <Users className="w-5 h-5 text-violet-400" />
                      )}{" "}
                      {previewSelectedModule === "clientes" ? "Clientes / Edificações" : "Alunos"}
                    </h2>
                    <p className="text-slate-500 text-sm">
                      {previewSelectedModule === "clientes"
                        ? "Gestão de clientes e edificações cadastradas."
                        : "Gestão de alunos matriculados no estúdio."}
                    </p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                              previewSelectedModule === "clientes" ? "bg-red-600/20 text-red-400" : "bg-violet-600/20 text-violet-400"
                            )}>
                              {previewSelectedModule === "clientes" ? "E" : "A"}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {previewSelectedModule === "clientes" ? `Edificação ${i}` : `Aluno ${i}`}
                              </p>
                              <p className="text-xs text-slate-500">
                                {previewSelectedModule === "clientes" ? `cliente${i}@empresa.com` : `aluno${i}@email.com`}
                              </p>
                            </div>
                            <span className="ml-auto text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">Ativo</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "turmas" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-400" /> Turmas & Aulas
                    </h2>
                    <p className="text-slate-500 text-sm">Criação e agendamento de turmas.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {["Ballet Infantil", "Forró Iniciante", "Jazz Avançado"].map((name, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                          <p className="font-bold text-white">{name}</p>
                          <p className="text-xs text-slate-500 mt-1">Seg/Qua 19h • 12 alunos</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {previewSelectedModule === "professores" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-pink-400" /> Professores
                    </h2>
                    <p className="text-slate-500 text-sm">Equipe docente do estúdio.</p>
                    <div className="flex flex-wrap gap-2">
                      {["Maria Silva", "João Santos", "Ana Costa"].map((name, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                          <p className="font-semibold text-white">{name}</p>
                          <p className="text-xs text-slate-500">3 turmas</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {previewSelectedModule === "financeiro" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" /> Financeiro
                    </h2>
                    <p className="text-slate-500 text-sm">Cobranças, mensalidades e despesas.</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                        <p className="text-xs text-slate-500">Recebido (mês)</p>
                        <p className="text-xl font-black text-emerald-400">R$ 0</p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                        <p className="text-xs text-slate-500">Pendente</p>
                        <p className="text-xl font-black text-amber-400">R$ 0</p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                        <p className="text-xs text-slate-500">Despesas</p>
                        <p className="text-xl font-black text-slate-400">R$ 0</p>
                      </div>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "scanner" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-cyan-400" /> Scanner QR
                    </h2>
                    <p className="text-slate-500 text-sm">Controle de presença via QR Code.</p>
                    <div className="rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/30 p-12 flex flex-col items-center justify-center">
                      <QrCode className="w-16 h-16 text-slate-600 mb-4" />
                      <p className="text-slate-500 text-sm font-medium">Área de escaneamento</p>
                      <p className="text-xs text-slate-600 mt-1">Aponte a câmera para o QR do aluno</p>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "leads" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-lime-400" /> Leads / CRM
                    </h2>
                    <p className="text-slate-500 text-sm">Funil de vendas e captação de alunos.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {["Novos", "Contato", "Interesse", "Matriculados"].map((stage, i) => (
                          <div key={i} className="min-w-[120px] p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-center">
                            <p className="text-2xl font-black text-white">0</p>
                            <p className="text-xs text-slate-500">{stage}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "os" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-orange-400" /> Ordens de Serviço
                    </h2>
                    <p className="text-slate-500 text-sm">Controle de OS, vistorias e manutenções.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                      <div className="space-y-3">
                        {["OS #001 — Vistoria", "OS #002 — Manutenção", "OS #003 — Instalação"].map((item, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                            <ClipboardList className="w-5 h-5 text-orange-400" />
                            <div>
                              <p className="font-semibold text-white">{item}</p>
                              <p className="text-xs text-slate-500">Em andamento</p>
                            </div>
                            <span className="ml-auto text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">Pendente</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "extintores" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-red-400" /> Extintores
                    </h2>
                    <p className="text-slate-500 text-sm">Controle de estoque e validades de extintores.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                      <div className="grid grid-cols-2 gap-3">
                        {["Extintor ABC 6kg", "Extintor CO2 4kg", "Extintor PQS 4kg"].map((item, i) => (
                          <div key={i} className="p-4 rounded-xl border border-slate-700 bg-slate-900/50">
                            <p className="font-bold text-white">{item}</p>
                            <p className="text-xs text-slate-500 mt-1">Validade: 12/2025</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "vistorias" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-400" /> Vistorias
                    </h2>
                    <p className="text-slate-500 text-sm">Agendamento e controle de vistorias.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                            <Calendar className="w-5 h-5 text-amber-400" />
                            <div>
                              <p className="font-semibold text-white">Vistoria #{i} — Edificação</p>
                              <p className="text-xs text-slate-500">Agendada para 15/03</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "gamificacao" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" /> Gamificação
                    </h2>
                    <p className="text-slate-500 text-sm">Rankings, conquistas e engajamento.</p>
                    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-600/10 to-yellow-600/10 p-6">
                      <p className="text-sm font-bold text-amber-400 mb-3">Ranking Geral</p>
                      <div className="space-y-2">
                        {[1, 2, 3].map((pos) => (
                          <div key={pos} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-black text-amber-400">{pos}</span>
                            <span className="text-white font-medium">Aluno {pos}</span>
                            <span className="ml-auto text-amber-400 font-bold">{100 - pos * 20} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "vendas" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-amber-400" /> PDV (Ponto de Venda)
                    </h2>
                    <p className="text-slate-500 text-sm">Venda de produtos e pacotes.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                      <p className="text-sm text-slate-400 mb-4">Carrinho vazio</p>
                      <div className="grid grid-cols-4 gap-2">
                        {["Pacote 8 aulas", "Mensalidade", "Aula avulsa"].map((p, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-center text-xs">
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "whatsapp" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-400" /> WhatsApp
                    </h2>
                    <p className="text-slate-500 text-sm">Integração e envio de mensagens.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Conecte sua conta WhatsApp</p>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "chat" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-400" /> Chat IA
                    </h2>
                    <p className="text-slate-500 text-sm">Assistente virtual inteligente.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Chat com IA ativado</p>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "fiscal" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-amber-400" /> Emissor Fiscal (NF-e)
                    </h2>
                    <p className="text-slate-500 text-sm">Emissão de Notas Fiscais Eletrônicas via SEFAZ.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                      <p className="text-slate-400 text-sm">Certificado A1 • Integração direta com SEFAZ</p>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "erp" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-sky-400" /> ERP
                    </h2>
                    <p className="text-slate-500 text-sm">Gestão empresarial completa.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {["Pedidos", "Estoque", "Fornecedores", "Relatórios"].map((m, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                          <p className="font-semibold text-white">{m}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {previewSelectedModule === "estoque" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-400" /> Estoque
                    </h2>
                    <p className="text-slate-500 text-sm">Controle de produtos e suprimentos.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                      <p className="text-slate-400 text-sm">Lista de produtos (mock)</p>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "marketplace" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Store className="w-5 h-5 text-rose-400" /> Marketplace
                    </h2>
                    <p className="text-slate-500 text-sm">Loja virtual integrada.</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
                      <Store className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Vitrine de produtos</p>
                    </div>
                  </div>
                )}
                {previewSelectedModule === "planos" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-violet-400" /> Planos e Preços
                    </h2>
                    <p className="text-slate-500 text-sm">Assinatura e upgrade do plano.</p>
                  </div>
                )}
                {previewSelectedModule === "configuracoes" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-400" /> Configurações
                    </h2>
                    <p className="text-slate-500 text-sm">Dados do estúdio, módulos e preferências.</p>
                  </div>
                )}
                {previewSelectedModule === "pagamentos-professores" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-emerald-400" /> Pagamentos Professores
                    </h2>
                    <p className="text-slate-500 text-sm">Controle de pagamentos aos professores.</p>
                  </div>
                )}
                {previewSelectedModule === "relatorios" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-400" /> Relatórios
                    </h2>
                    <p className="text-slate-500 text-sm">Relatórios e análises.</p>
                  </div>
                )}
                {["tecnicos", "engenheiros", "arquitetos", "portal-vendedor"].includes(previewSelectedModule) && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-orange-400" />{" "}
                      {previewSelectedModule === "tecnicos" && "Técnicos"}
                      {previewSelectedModule === "engenheiros" && "Engenheiros"}
                      {previewSelectedModule === "arquitetos" && "Arquitetos"}
                      {previewSelectedModule === "portal-vendedor" && "Portal do Vendedor"}
                    </h2>
                    <p className="text-slate-500 text-sm">
                      {previewSelectedModule === "tecnicos" && "Equipe de técnicos cadastrados."}
                      {previewSelectedModule === "engenheiros" && "Engenheiros responsáveis."}
                      {previewSelectedModule === "arquitetos" && "Arquitetos parceiros."}
                      {previewSelectedModule === "portal-vendedor" && "Portal do vendedor."}
                    </p>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                      <p className="text-slate-400 text-sm">Lista de profissionais (mock)</p>
                    </div>
                  </div>
                )}
              </main>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
