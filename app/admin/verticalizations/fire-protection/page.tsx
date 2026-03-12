"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FireExtinguisher,
  ExternalLink,
  ArrowLeft,
  Users,
  Building2,
  ClipboardList,
  TrendingUp,
  Settings,
  Eye,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Wrench,
  PencilRuler,
  BarChart3,
  Globe,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { VerticalizationPlansCard } from "@/components/admin/verticalization-plans-card"

interface FireProtectionStats {
  totalTenants: number
  totalUsers: number
  totalServiceOrders: number
  activeEngineers: number
  activeTechnicians: number
  activeClients: number
  mrr: number
  recentTenants: Array<{
    id: string
    name: string
    slug: string
    created_at: string
    status: string
  }>
}

const quickActions = [
  {
    label: "Ver Landing Page",
    href: "/solutions/fire-protection",
    icon: Globe,
    external: true,
    variant: "outline" as const,
  },
  {
    label: "Página de Login",
    href: "/solutions/fire-protection/login",
    icon: ShieldCheck,
    external: true,
    variant: "outline" as const,
  },
  {
    label: "Página de Registro",
    href: "/solutions/fire-protection/register",
    icon: Users,
    external: true,
    variant: "outline" as const,
  },
]

const featureModules = [
  { icon: ClipboardList, label: "Ordens de Serviço", color: "text-red-400", bg: "bg-red-500/10" },
  { icon: Wrench, label: "Técnicos de Campo", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: PencilRuler, label: "Portal do Engenheiro", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: Users, label: "Portal do Cliente", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: BarChart3, label: "Relatórios & AVCB", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: AlertTriangle, label: "Validades & Alertas", color: "text-emerald-400", bg: "bg-emerald-500/10" },
]

export default function FireProtectionAdminPage() {
  const [stats, setStats] = useState<FireProtectionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      // Busca tenants com nicho fire_protection
      const { data: studios } = await supabase
        .from('studios')
        .select('id, name, slug, created_at, business_model')
        .order('created_at', { ascending: false })

      // Filtra estúdios com configuração fire_protection (via organization_settings)
      const { data: fireSettings } = await supabase
        .from('organization_settings')
        .select('studio_id')
        .eq('niche', 'fire_protection')

      const fireStudioIds = (fireSettings || []).map((s: any) => s.studio_id)
      const fireTenants = (studios || []).filter((s: any) => fireStudioIds.includes(s.id))

      // Busca usuários desses tenants
      const { count: usersCount } = await supabase
        .from('users_internal')
        .select('id', { count: 'exact', head: true })
        .in('studio_id', fireStudioIds.length > 0 ? fireStudioIds : ['none'])

      const { count: techCount } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .in('studio_id', fireStudioIds.length > 0 ? fireStudioIds : ['none'])

      const { count: engineerCount } = await supabase
        .from('professionals')
        .select('id', { count: 'exact', head: true })
        .in('studio_id', fireStudioIds.length > 0 ? fireStudioIds : ['none'])
        .eq('role', 'engineer')

      const { count: clientCount } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .in('studio_id', fireStudioIds.length > 0 ? fireStudioIds : ['none'])

      setStats({
        totalTenants: fireTenants.length,
        totalUsers: (usersCount || 0) + (techCount || 0) + (engineerCount || 0) + (clientCount || 0),
        totalServiceOrders: 0,
        activeEngineers: engineerCount || 0,
        activeTechnicians: techCount || 0,
        activeClients: clientCount || 0,
        mrr: 0,
        recentTenants: fireTenants.slice(0, 5).map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          created_at: s.created_at,
          status: 'active',
        })),
      })
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
      toast.error('Erro ao carregar métricas do Fire Control')
    } finally {
      setLoading(false)
    }
  }

  const kpis = [
    {
      icon: Building2,
      label: "Empresas Ativas",
      value: stats?.totalTenants ?? '--',
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: Users,
      label: "Total de Usuários",
      value: stats?.totalUsers ?? '--',
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: PencilRuler,
      label: "Engenheiros",
      value: stats?.activeEngineers ?? '--',
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Wrench,
      label: "Técnicos",
      value: stats?.activeTechnicians ?? '--',
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Users,
      label: "Clientes",
      value: stats?.activeClients ?? '--',
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: DollarSign,
      label: "MRR",
      value: stats?.mrr ? `R$${stats.mrr}` : '--',
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen pb-10 bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title="Fire Control — Gestão da Verticalização" />

      <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/verticalizations" className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Verticalizações
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <FireExtinguisher className="w-3.5 h-3.5 text-red-400" /> Fire Control
          </span>
        </div>

        {/* Hero Banner */}
        <div className="rounded-2xl overflow-hidden border border-red-500/20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/80 via-slate-950 to-orange-950/40" />
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-[100px]" />
          </div>
          <div className="relative p-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <FireExtinguisher className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-white tracking-tight">Fire Control</h1>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Ativo
                  </span>
                </div>
                <p className="text-slate-400 text-sm max-w-xl">
                  Verticalização white-label para empresas de segurança contra incêndio.
                  Nicho: <strong className="text-red-300">fire_protection</strong> — Gerenciado via akaaicore.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={loadStats}
                disabled={loading}
                className="border-slate-700 text-slate-400 hover:text-white gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Link href="/solutions/fire-protection" target="_blank">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-2 font-bold">
                  <Eye className="w-3.5 h-3.5" />
                  Ver Solução
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-5 pb-4">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-black text-white">{loading ? '...' : kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Planos e Preços */}
        <VerticalizationPlansCard
          verticalizationSlug="fire-protection"
          verticalizationName="Fire Control"
          landingUrl="/solutions/fire-protection"
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Ações Rápidas */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-red-400" />
                Acessar Ambiente
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs">
                Navegue pelas páginas públicas desta verticalização como super admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  target={action.external ? "_blank" : undefined}
                >
                  <Button
                    variant={action.variant}
                    size="sm"
                    className="w-full justify-start gap-2 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  >
                    <action.icon className="w-3.5 h-3.5" />
                    {action.label}
                    {action.external && <ExternalLink className="w-3 h-3 ml-auto opacity-40" />}
                  </Button>
                </Link>
              ))}

              {/* Acesso admin com impersonation (futuro) */}
              <div className="pt-3 border-t border-slate-800">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
                  Acesso Interno
                </p>
                <Link href="/admin/studios?niche=fire_protection">
                  <Button
                    size="sm"
                    className="w-full justify-start gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Ver Tenants Fire Control
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Módulos Ativos */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-orange-400" />
                Módulos Habilitados
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs">
                Funcionalidades disponíveis nesta verticalização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {featureModules.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center flex-shrink-0`}>
                      <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                    </div>
                    <span className="text-slate-400 text-sm">{m.label}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tenants Recentes */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Empresas Cadastradas
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs">
                Tenants que utilizam esta verticalização
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
                </div>
              ) : stats?.recentTenants && stats.recentTenants.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentTenants.map((tenant) => (
                    <Link
                      key={tenant.id}
                      href={`/admin/studios/${tenant.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-400 text-xs font-black">
                          {tenant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-sm font-semibold truncate">{tenant.name}</p>
                        <p className="text-slate-600 text-[10px]">{tenant.slug}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" />
                    </Link>
                  ))}
                  <Link
                    href="/admin/studios?niche=fire_protection"
                    className="flex items-center justify-center gap-1.5 pt-2 text-[11px] font-bold text-slate-600 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                  >
                    Ver todos <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-semibold">Nenhuma empresa ainda</p>
                    <p className="text-slate-700 text-xs mt-1">
                      Empresas cadastradas pelo{' '}
                      <Link href="/solutions/fire-protection/register" target="_blank" className="text-red-500 hover:underline">
                        registro da landing page
                      </Link>{' '}
                      aparecerão aqui
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Produção de Extintores */}
        <Card className="bg-slate-900/30 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base flex items-center gap-2">
              <FireExtinguisher className="w-4 h-4 text-red-400" />
              Produção de Extintores
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs">
              Configure por empresa: extintores/dia e capacidade por técnico. Use para estimar datas de entrega nas OS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-500 text-sm">Padrão quando não configurado: 20 extintores/dia, 1 dia de lead time.</span>
              <Link href="/admin/studios?niche=fire_protection">
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-400 hover:text-white gap-2">
                  Configurar por empresa
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Configurações da Verticalização */}
        <Card className="bg-slate-900/30 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              Configuração Técnica
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs">
              Parâmetros desta verticalização no sistema akaaicore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Nicho (niche key)", value: "fire_protection", color: "text-red-400" },
                { label: "Rota da Landing", value: "/solutions/fire-protection", color: "text-orange-400" },
                { label: "Rota de Login", value: "/solutions/fire-protection/login", color: "text-amber-400" },
                { label: "Rota de Registro", value: "/solutions/fire-protection/register", color: "text-blue-400" },
                { label: "Modelo de Negócio", value: "MONETARY", color: "text-emerald-400" },
                { label: "Roles disponíveis", value: "admin, teacher, engineer, student", color: "text-violet-400" },
                { label: "Vocabulário: cliente", value: "Cliente", color: "text-indigo-400" },
                { label: "Vocabulário: profissional", value: "Técnico", color: "text-pink-400" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                    {item.label}
                  </p>
                  <p className={`text-sm font-mono font-semibold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
