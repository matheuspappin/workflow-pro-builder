"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FireExtinguisher,
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Building2,
  Wrench,
  Calendar,
  Copy,
  Check,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  edificacoes: number
  tecnicos: number
  osAbertas: number
  vistorias: number
}

interface RecentOS {
  id: string
  tracking_code: string
  title: string
  status: string
  priority?: string
  created_at: string
  customer?: { name: string }
  professional?: { name: string }
}

const statusMap: Record<string, { label: string; className: string }> = {
  open:        { label: "Aberta",       className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "Andamento",    className: "bg-blue-100 text-blue-700" },
  finished:    { label: "Concluída",    className: "bg-emerald-100 text-emerald-700" },
  cancelled:   { label: "Cancelada",    className: "bg-slate-100 text-slate-500" },
  nao_conforme:{ label: "Não Conforme", className: "bg-rose-100 text-rose-700" },
}

export default function FireProtectionDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [studioSlug, setStudioSlug] = useState("")
  const [studioId, setStudioId] = useState<string | null>(null)
  const [copyingRole, setCopyingRole] = useState<string | null>(null)
  const [statsData, setStatsData] = useState<DashboardStats>({ edificacoes: 0, tecnicos: 0, osAbertas: 0, vistorias: 0 })
  const [recentOS, setRecentOS] = useState<RecentOS[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid)

      const stored = localStorage.getItem("danceflow_user")
      if (stored) {
        const parsed = JSON.parse(stored)
        const slug = parsed.studioSlug || parsed.studio_slug || (parsed.studio && parsed.studio.slug) || ""
        setStudioSlug(slug)
      }

      if (sid) {
        try {
          const [customers, technicians, osList, vistorias] = await Promise.all([
            fetch(`/api/fire-protection/customers?studioId=${sid}`).then((r) => r.json()),
            fetch(`/api/fire-protection/technicians?studioId=${sid}`).then((r) => r.json()),
            fetch(`/api/fire-protection/os?studioId=${sid}`).then((r) => r.json()),
            fetch(`/api/fire-protection/vistorias?studioId=${sid}`).then((r) => r.json()),
          ])
          setStatsData({
            edificacoes: Array.isArray(customers) ? customers.length : 0,
            tecnicos: Array.isArray(technicians) ? technicians.length : 0,
            osAbertas: Array.isArray(osList) ? osList.filter((o: any) => o.status === "open" || o.status === "in_progress").length : 0,
            vistorias: Array.isArray(vistorias) ? vistorias.filter((v: any) => v.status === "open").length : 0,
          })
          // OS recentes para a seção "Últimas OS"
          if (Array.isArray(osList)) {
            setRecentOS(osList.slice(0, 5))
          }
        } catch {
          // mantém zeros em caso de erro
        }
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
      toast({ title: "Link copiado!", description: `Convite para ${role} copiado.` })
      setTimeout(() => setCopyingRole(null), 2000)
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" })
    }
  }

  const stats = [
    { label: "Edificações Ativas", value: loading ? "..." : String(statsData.edificacoes), icon: Building2, color: "text-red-600", bg: "bg-red-600/10", border: "border-l-red-600", href: "/solutions/fire-protection/dashboard/clientes" },
    { label: "Técnicos Ativos", value: loading ? "..." : String(statsData.tecnicos), icon: Users, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-l-orange-500", href: "/solutions/fire-protection/dashboard/tecnicos" },
    { label: "OS em Aberto", value: loading ? "..." : String(statsData.osAbertas), icon: ClipboardList, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-l-amber-500", href: "/solutions/fire-protection/dashboard/os" },
    { label: "Vistorias Agendadas", value: loading ? "..." : String(statsData.vistorias), icon: Calendar, color: "text-rose-600", bg: "bg-rose-600/10", border: "border-l-rose-600", href: "/solutions/fire-protection/dashboard/vistorias" },
  ]

  const quickActions = [
    { label: "Nova OS", sub: "Abrir ordem de serviço", href: "/solutions/fire-protection/dashboard/os/nova", icon: Wrench, color: "bg-red-600 hover:bg-red-700" },
    { label: "Nova Vistoria", sub: "Agendar inspeção", href: "/solutions/fire-protection/dashboard/vistorias/nova", icon: Calendar, color: "bg-slate-800 hover:bg-slate-700 dark:bg-slate-800" },
    { label: "Clientes", sub: "Gerenciar edificações", href: "/solutions/fire-protection/dashboard/clientes", icon: Building2, color: "bg-orange-600 hover:bg-orange-700" },
  ]

  const invites = [
    { role: "professional", label: "Convidar Técnico", icon: Wrench, color: "text-orange-500", bg: "bg-orange-500/10" },
    { role: "engineer", label: "Convidar Engenheiro", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    { role: "client", label: "Convidar Cliente", icon: Building2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bem-vindo, {user?.user_metadata?.name || "Admin"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Painel de Controle — Segurança Contra Incêndio
          </p>
        </div>
        <Button type="button" className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20" asChild>
          <Link href="/solutions/fire-protection/dashboard/os/nova">
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Link>
        </Button>
      </div>

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={cn("border-l-4 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer", stat.border)}>
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
        {/* OS Recentes */}
        <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-red-600" />
                Últimas OS
              </CardTitle>
              <CardDescription>Ordens de serviço recentes</CardDescription>
            </div>
              <Button type="button" variant="ghost" size="sm" className="text-red-600 font-bold text-xs" asChild>
                <Link href="/solutions/fire-protection/dashboard/os">
                  Ver todas <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentOS.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhuma OS registrada ainda</p>
                <Button type="button" className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl" size="sm" asChild>
                  <Link href="/solutions/fire-protection/dashboard/os/nova">
                    <Plus className="w-4 h-4 mr-1" /> Criar primeira OS
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOS.map((os) => {
                  const st = statusMap[os.status] ?? statusMap.open
                  return (
                    <Link key={os.id} href="/solutions/fire-protection/dashboard/os">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-red-600">#{os.tracking_code}</span>
                            <Badge className={cn("text-[10px] border-0 font-bold", st.className)}>{st.label}</Badge>
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">{os.title}</p>
                          {os.customer && (
                            <p className="text-xs text-slate-500 truncate">{os.customer.name}</p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Convites & Alertas */}
        <div className="space-y-4">
          {/* Extintores vencendo */}
          <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-rose-200 dark:border-rose-600/20 bg-rose-50 dark:bg-rose-600/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-600/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Extintores com validade próxima</p>
                <p className="text-sm text-slate-500">Cadastre extintores para monitorar vencimentos</p>
              </div>
              <Link href="/solutions/fire-protection/dashboard/extintores" className="ml-auto">
                <Button type="button" size="sm" variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50 font-bold rounded-xl">
                  Ver
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Links de convite */}
          {studioSlug && (
            <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Convites de Acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.role} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", inv.bg)}>
                        <inv.icon className={cn("w-4 h-4", inv.color)} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.label}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs font-bold rounded-lg"
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
