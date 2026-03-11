"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users, ClipboardList, FileText, DollarSign, Satellite,
  Plus, ArrowRight, Leaf, Copy, Check, Wrench, PencilRuler,
  AlertTriangle, TrendingUp, Bell, XCircle,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type OSStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

interface DashboardAlert {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
}

interface RecentOS {
  id: string
  code: string
  client: string
  type: string
  status: OSStatus
  date: string
  assigned_to?: string
}

const statusConfig: Record<OSStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendente", color: "text-amber-400", bg: "bg-amber-400/10" },
  in_progress: { label: "Em Andamento", color: "text-blue-400", bg: "bg-blue-400/10" },
  completed: { label: "Concluída", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  cancelled: { label: "Cancelada", color: "text-red-400", bg: "bg-red-400/10" },
}

const OS_TYPE_LABELS: Record<string, string> = {
  laudo_car: "Laudo CAR",
  vistoria_ndvi: "Vistoria NDVI",
  regularizacao: "Regularização",
  licenciamento: "Licenciamento",
  monitoramento: "Monitoramento",
  laudo: "Laudo Técnico",
  outro: "Serviço Ambiental",
  environmental_os: "OS Ambiental",
}

export default function AgroFlowAIDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [studioSlug, setStudioSlug] = useState("")
  const [copyingRole, setCopyingRole] = useState<string | null>(null)
  const [recentOS, setRecentOS] = useState<RecentOS[]>([])
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    clientes: 0,
    engenheiros: 0,
    tecnicos: 0,
    osAbertas: 0,
    faturamento: 0,
    laudosMes: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const stored = localStorage.getItem("workflow_user")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          const slug = parsed.studioSlug || parsed.studio_slug || (parsed.studio && parsed.studio.slug) || ""
          setStudioSlug(slug)

          const sid = parsed.studioId || parsed.studio_id || user?.user_metadata?.studio_id
          if (sid) {
            // Load alerts in background
            fetch(`/api/agroflowai/alertas?studioId=${sid}`)
              .then(r => r.json())
              .then(data => { if (Array.isArray(data)) setAlerts(data) })
              .catch(() => {})

            const [clientsRes, engRes, techRes, osRes, laudosRes, finRes] = await Promise.all([
              fetch(`/api/agroflowai/clientes?studioId=${sid}`).then(r => r.json()).catch(() => []),
              fetch(`/api/agroflowai/engenheiros?studioId=${sid}`).then(r => r.json()).catch(() => []),
              fetch(`/api/agroflowai/tecnicos?studioId=${sid}`).then(r => r.json()).catch(() => []),
              fetch(`/api/agroflowai/os?studioId=${sid}&status=in_progress`).then(r => r.json()).catch(() => []),
              fetch(`/api/agroflowai/laudos?studioId=${sid}`).then(r => r.json()).catch(() => []),
              fetch(`/api/agroflowai/financeiro?studioId=${sid}`).then(r => r.json()).catch(() => ({})),
            ])

            const now = new Date()
            const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
            const laudosMes = Array.isArray(laudosRes)
              ? laudosRes.filter((l: any) => l.created_at?.startsWith(thisMonth)).length
              : 0

            setStats({
              clientes: Array.isArray(clientsRes) ? clientsRes.length : 0,
              engenheiros: Array.isArray(engRes) ? engRes.length : 0,
              tecnicos: Array.isArray(techRes) ? techRes.length : 0,
              osAbertas: Array.isArray(osRes) ? osRes.length : 0,
              laudosMes,
              faturamento: finRes?.kpis?.receita_total || 0,
            })

            // Buscar OS recentes (todas, sem filtro de status, limite 4)
            const allOsRes = await fetch(`/api/agroflowai/os?studioId=${sid}`).then(r => r.json()).catch(() => [])
            if (Array.isArray(allOsRes)) {
              setRecentOS(allOsRes.slice(0, 4).map((os: any) => ({
                id: os.id,
                code: os.code || `OS-${os.id.slice(0, 6).toUpperCase()}`,
                client: os.client_name || os.property_name || 'Cliente',
                type: OS_TYPE_LABELS[os.type] || os.type || 'OS Ambiental',
                status: os.status as OSStatus,
                date: os.scheduled_date || new Date(os.created_at).toLocaleDateString('pt-BR'),
                assigned_to: os.assigned_to || undefined,
              })))
            }
          }
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleCopyLink = async (role: string) => {
    if (!studioSlug) {
      toast({ title: "Slug não encontrado", description: "Faça logout e entre novamente.", variant: "destructive" })
      return
    }
    const link = `${window.location.origin}/s/${studioSlug}/join?role=${role}`
    try {
      await navigator.clipboard.writeText(link)
      setCopyingRole(role)
      toast({ title: "Link copiado!", description: "Convite copiado com sucesso." })
      setTimeout(() => setCopyingRole(null), 2000)
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" })
    }
  }

  const statCards = [
    {
      label: "Clientes Ativos",
      value: loading ? "..." : String(stats.clientes),
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-l-emerald-500",
      href: "/solutions/agroflowai/dashboard/clientes",
    },
    {
      label: "Engenheiros",
      value: loading ? "..." : String(stats.engenheiros),
      icon: PencilRuler,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      border: "border-l-teal-500",
      href: "/solutions/agroflowai/dashboard/engenheiros",
    },
    {
      label: "Técnicos de Campo",
      value: loading ? "..." : String(stats.tecnicos),
      icon: Wrench,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-l-blue-500",
      href: "/solutions/agroflowai/dashboard/tecnicos",
    },
    {
      label: "OS em Andamento",
      value: loading ? "..." : String(stats.osAbertas),
      icon: ClipboardList,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-l-amber-500",
      href: "/solutions/agroflowai/dashboard/ordens-servico",
    },
    {
      label: "Laudos este Mês",
      value: loading ? "..." : String(stats.laudosMes),
      icon: FileText,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-l-violet-500",
      href: "/solutions/agroflowai/dashboard/laudos",
    },
    {
      label: "Faturamento (mês)",
      value: loading ? "..." : `R$ ${stats.faturamento.toLocaleString("pt-BR")}`,
      icon: DollarSign,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      border: "border-l-pink-500",
      href: "/solutions/agroflowai/dashboard/financeiro",
    },
  ]

  const quickActions = [
    {
      label: "Nova OS",
      sub: "Abrir ordem de serviço",
      href: "/solutions/agroflowai/dashboard/ordens-servico",
      icon: ClipboardList,
      color: "bg-emerald-600 hover:bg-emerald-700",
    },
    {
      label: "Novo Laudo",
      sub: "Criar laudo técnico",
      href: "/solutions/agroflowai/dashboard/laudos",
      icon: FileText,
      color: "bg-teal-600 hover:bg-teal-700",
    },
    {
      label: "Monitor Satélite",
      sub: "NDVI e alertas",
      href: "/solutions/agroflowai/dashboard/satelite",
      icon: Satellite,
      color: "bg-blue-600 hover:bg-blue-700",
    },
  ]

  const invites = [
    { role: "professional", label: "Convidar Engenheiro/Técnico", icon: PencilRuler, color: "text-teal-500", bg: "bg-teal-500/10" },
    { role: "client", label: "Convidar Proprietário Rural", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Olá, {user?.user_metadata?.name || "Gestor"} 👋
          </h1>
          <p className="text-slate-400 font-medium mt-1">
            Painel de Controle — AgroFlowAI
          </p>
        </div>
        <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20" asChild>
          <Link href="/solutions/agroflowai/dashboard/ordens-servico">
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Link>
        </Button>
      </div>

      {/* Alerts Panel */}
      {alerts.filter(a => !dismissedAlerts.has(a.id)).length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => !dismissedAlerts.has(a.id)).slice(0, 3).map(alert => {
            const cfg = {
              critical: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-500/30" },
              warning: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-500/30" },
              info: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/30" },
            }[alert.severity]
            return (
              <div key={alert.id} className={cn("flex items-start gap-3 p-3 rounded-xl border", cfg.bg, cfg.border)}>
                <AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0", cfg.color)} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-bold", cfg.color)}>{alert.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
                  className="text-slate-600 hover:text-slate-400 flex-shrink-0"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )
          })}
          {alerts.filter(a => !dismissedAlerts.has(a.id)).length > 3 && (
            <p className="text-xs text-slate-500 text-center font-bold">
              <Bell className="w-3 h-3 inline mr-1" />
              +{alerts.filter(a => !dismissedAlerts.has(a.id)).length - 3} alertas adicionais — veja Relatórios
            </p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className={cn("text-white border-none shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]", action.color)}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-base">{action.label}</p>
                    <p className="text-xs text-white/70">{action.sub}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 opacity-60" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={cn("border-l-4 bg-slate-900/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-slate-800", stat.border)}>
              <CardContent className="p-5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <p className={cn("text-3xl font-black", stat.color)}>{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ordens de Serviço Recentes */}
        <Card className="bg-slate-900/50 shadow-sm border border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-500" />
                OS Recentes
              </CardTitle>
              <CardDescription className="text-slate-500">Ordens de serviço mais recentes</CardDescription>
            </div>
              <Button type="button" variant="ghost" size="sm" className="text-emerald-500 font-bold text-xs hover:bg-emerald-500/10" asChild>
                <Link href="/solutions/agroflowai/dashboard/ordens-servico">
                  Ver todas <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
          </CardHeader>
          <CardContent>
            {recentOS.length > 0 ? (
              <div className="space-y-2">
                {recentOS.map((os) => {
                  const st = statusConfig[os.status] || statusConfig.pending
                  return (
                    <div key={os.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                          <Leaf className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-200 truncate">{os.client}</p>
                          <p className="text-xs text-slate-500">{os.type} · {os.date}</p>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px] font-bold border-0 ml-2 flex-shrink-0", st.color, st.bg)}>
                        {st.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhuma OS cadastrada ainda</p>
                <Button type="button" className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl" size="sm" asChild>
                  <Link href="/solutions/agroflowai/dashboard/ordens-servico">
                    <Plus className="w-4 h-4 mr-1" /> Criar primeira OS
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Monitor Satelital Destaque */}
          <Card className="bg-gradient-to-br from-emerald-700 via-teal-700 to-blue-700 text-white border-none shadow-lg">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Satellite className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">Monitor Satelital</p>
                <p className="text-sm text-white/70">NDVI, alertas de desmatamento e MapBiomas</p>
              </div>
              <Button type="button" size="sm" variant="secondary" className="font-bold rounded-xl bg-white/20 hover:bg-white/30 text-white border-0" asChild>
                <Link href="/solutions/agroflowai/dashboard/satelite">Ver</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Alerta de Compliance */}
          <Card className="bg-slate-900/50 shadow-sm border border-amber-500/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">Compliance CAR</p>
                <p className="text-sm text-slate-500">Regularizações e licenciamentos pendentes</p>
              </div>
              <Link href="/solutions/agroflowai/dashboard/laudos" className="ml-auto">
                <Button type="button" size="sm" variant="outline" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold rounded-xl">
                  Ver
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* CRM Leads */}
          <Card className="bg-slate-900/50 shadow-sm border border-indigo-500/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="font-bold text-white">Captação de Clientes</p>
                <p className="text-sm text-slate-500">Gerencie leads e novos contratos</p>
              </div>
              <Link href="/solutions/agroflowai/dashboard/leads" className="ml-auto">
                <Button type="button" size="sm" variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-bold rounded-xl">
                  Ver
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Links de convite */}
          {studioSlug && (
            <Card className="bg-slate-900/50 shadow-sm border border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">
                  Convites de Acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.role} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", inv.bg)}>
                        <inv.icon className={cn("w-4 h-4", inv.color)} />
                      </div>
                      <span className="text-sm font-bold text-slate-300">{inv.label}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs font-bold rounded-lg border-slate-700 text-slate-400"
                      onClick={() => handleCopyLink(inv.role)}
                    >
                      {copyingRole === inv.role ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copyingRole === inv.role ? "Copiado" : "Copiar link"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
