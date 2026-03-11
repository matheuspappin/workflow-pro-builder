"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Music,
  ExternalLink,
  ArrowLeft,
  Users,
  Building2,
  ClipboardList,
  Settings,
  Eye,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  GraduationCap,
  BarChart3,
  Globe,
  ShieldCheck,
  RefreshCw,
  QrCode,
  Trophy,
  MessageSquare,
  TrendingUp,
  CalendarDays,
  Smartphone,
  Star,
  UserCheck,
  Zap,
  Heart,
  ShoppingCart,
  Layers,
  Store,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { VerticalizationPlansCard } from "@/components/admin/verticalization-plans-card"

interface DanceFlowStats {
  totalTenants: number
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalAdmins: number
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
    href: "/solutions/estudio-de-danca",
    icon: Globe,
    external: true,
    variant: "outline" as const,
  },
  {
    label: "Página de Login",
    href: "/solutions/estudio-de-danca/login",
    icon: ShieldCheck,
    external: true,
    variant: "outline" as const,
  },
  {
    label: "Página de Registro",
    href: "/solutions/estudio-de-danca/register",
    icon: Users,
    external: true,
    variant: "outline" as const,
  },
]

const portalLinks = [
  {
    label: "Dashboard Admin",
    href: "/solutions/estudio-de-danca/dashboard",
    icon: BarChart3,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    description: "Painel principal do gestor",
  },
  {
    label: "Portal do Professor",
    href: "/solutions/estudio-de-danca/teacher",
    icon: GraduationCap,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    description: "Chamada, turmas e agenda",
  },
  {
    label: "Portal do Aluno",
    href: "/solutions/estudio-de-danca/student",
    icon: UserCheck,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    description: "Aulas, QR check-in e pagamentos",
  },
]

const featureModules = [
  { icon: CalendarDays, label: "Turmas e Chamada", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Users, label: "Gestão de Alunos", color: "text-pink-400", bg: "bg-pink-500/10" },
  { icon: GraduationCap, label: "App do Professor", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { icon: QrCode, label: "Check-in QR Code", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: DollarSign, label: "Financeiro / Mensalidades", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Trophy, label: "Gamificação / Rankings", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { icon: TrendingUp, label: "CRM / Leads", color: "text-lime-400", bg: "bg-lime-500/10" },
  { icon: MessageSquare, label: "WhatsApp Automático", color: "text-green-400", bg: "bg-green-500/10" },
  { icon: Zap, label: "IA Chat", color: "text-purple-400", bg: "bg-purple-500/10" },
  { icon: ShoppingCart, label: "PDV (Ponto de Venda)", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: Layers, label: "ERP", color: "text-sky-400", bg: "bg-sky-500/10" },
  { icon: Store, label: "Marketplace", color: "text-rose-400", bg: "bg-rose-500/10" },
]

const techConfig = [
  { label: "Nicho (niche key)", value: "dance", color: "text-violet-400" },
  { label: "Slug da Verticalização", value: "estudio-de-danca", color: "text-pink-400" },
  { label: "Rota da Landing", value: "/solutions/estudio-de-danca", color: "text-indigo-400" },
  { label: "Rota de Login", value: "/solutions/estudio-de-danca/login", color: "text-cyan-400" },
  { label: "Rota de Registro", value: "/solutions/estudio-de-danca/register", color: "text-teal-400" },
  { label: "Dashboard Admin", value: "/solutions/estudio-de-danca/dashboard", color: "text-blue-400" },
  { label: "Portal do Professor", value: "/solutions/estudio-de-danca/teacher", color: "text-amber-400" },
  { label: "Portal do Aluno", value: "/solutions/estudio-de-danca/student", color: "text-orange-400" },
  { label: "Modelo de Negócio", value: "CREDIT (padrão) / MONETARY", color: "text-emerald-400" },
  { label: "Roles disponíveis", value: "admin, finance, teacher, student", color: "text-rose-400" },
  { label: "Vocabulário: cliente", value: "Aluno", color: "text-violet-300" },
  { label: "Vocabulário: profissional", value: "Professor", color: "text-pink-300" },
  { label: "Chave de sessão", value: "danceflow_user (localStorage)", color: "text-slate-400" },
  { label: "RPCs Supabase", value: "enroll_student_in_class, adjust_student_credits", color: "text-indigo-300" },
  { label: "QR Check-in formato", value: "DF-{attendanceId[:8]}", color: "text-cyan-300" },
  { label: "Scanner admin", value: "/dashboard/scanner", color: "text-teal-300" },
]

export default function DanceFlowAdminPage() {
  const [stats, setStats] = useState<DanceFlowStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      // Busca todos os estúdios cadastrados (mesma fonte que /admin/studios)
      const { data: studios } = await supabase
        .from('studios')
        .select('id, name, slug, created_at, organization_settings ( niche )')
        .order('created_at', { ascending: false })

      const allDanceIds = (studios || []).map((s: any) => s.id)

      const { count: studentsCount } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .in('studio_id', allDanceIds.length > 0 ? allDanceIds : ['__none__'])

      const { count: teachersCount } = await supabase
        .from('professionals')
        .select('id', { count: 'exact', head: true })
        .in('studio_id', allDanceIds.length > 0 ? allDanceIds : ['__none__'])

      const { count: adminsCount } = await supabase
        .from('users_internal')
        .select('id', { count: 'exact', head: true })
        .in('studio_id', allDanceIds.length > 0 ? allDanceIds : ['__none__'])

      setStats({
        totalTenants: (studios || []).length,
        totalUsers: (studentsCount || 0) + (teachersCount || 0) + (adminsCount || 0),
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalAdmins: adminsCount || 0,
        mrr: 0,
        recentTenants: (studios || []).slice(0, 12).map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          created_at: s.created_at,
          status: 'active',
        })),
      })
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
      toast.error('Erro ao carregar métricas do DanceFlow')
    } finally {
      setLoading(false)
    }
  }

  const kpis = [
    {
      icon: Building2,
      label: "Estúdios Ativos",
      value: stats?.totalTenants ?? '--',
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Users,
      label: "Total Usuários",
      value: stats?.totalUsers ?? '--',
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      icon: UserCheck,
      label: "Alunos",
      value: stats?.totalStudents ?? '--',
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: GraduationCap,
      label: "Professores",
      value: stats?.totalTeachers ?? '--',
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      icon: ShieldCheck,
      label: "Admins",
      value: stats?.totalAdmins ?? '--',
      color: "text-amber-400",
      bg: "bg-amber-500/10",
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
      <AdminHeader title="DanceFlow — Gestão da Verticalização" />

      <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/verticalizations" className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Verticalizações
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-violet-400" /> DanceFlow
          </span>
        </div>

        {/* Hero Banner */}
        <div className="rounded-2xl overflow-hidden border border-violet-500/20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-slate-950 to-pink-950/40" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full blur-[80px]" />
          </div>
          <div className="relative p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/10">
                <Music className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <h1 className="text-2xl font-black text-white tracking-tight">DanceFlow</h1>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Ativo
                  </Badge>
                  <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                    Dance
                  </Badge>
                  <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/20 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                    CREDIT
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                  Verticalização white-label para estúdios de dança. Inclui 3 portais (admin, professor, aluno),
                  QR check-in, controle de mensalidades, gamificação e chamada digital.
                  Nicho: <strong className="text-violet-300">dance</strong> — Gerenciado via Akaai Core.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={loadStats}
                disabled={loading}
                className="border-slate-700 text-slate-400 hover:text-white gap-2"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                Atualizar
              </Button>
              <Link href="/solutions/estudio-de-danca" target="_blank">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-2 font-bold shadow-lg shadow-violet-600/20">
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
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", kpi.bg)}>
                  <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                </div>
                <p className="text-2xl font-black text-white">{loading ? '...' : kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Planos e Preços */}
        <VerticalizationPlansCard
          verticalizationSlug="estudio-de-danca"
          verticalizationName="DanceFlow"
          landingUrl="/solutions/estudio-de-danca"
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
        />

        {/* 3-col row: Quick Actions + Portals + Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Ações Rápidas */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-400" />
                Acessar Ambiente
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs">
                Navegue pelas páginas públicas desta verticalização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href} target={action.external ? "_blank" : undefined}>
                  <Button
                    variant={action.variant}
                    size="sm"
                    className="w-full justify-start gap-2 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 mb-1"
                  >
                    <action.icon className="w-3.5 h-3.5" />
                    {action.label}
                    {action.external && <ExternalLink className="w-3 h-3 ml-auto opacity-40" />}
                  </Button>
                </Link>
              ))}
              <div className="pt-3 border-t border-slate-800">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Acesso Interno</p>
                <Link href="/admin/studios?niche=dance">
                  <Button size="sm" className="w-full justify-start gap-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20">
                    <Building2 className="w-3.5 h-3.5" />
                    Ver Tenants DanceFlow
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Portais */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-pink-400" />
                Portais da Solução
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs">
                3 portais independentes por role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {portalLinks.map((portal) => (
                <Link key={portal.label} href={portal.href} target="_blank">
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer group hover:bg-slate-800/60 transition-all mb-1",
                    portal.bg
                  )}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", portal.bg)}>
                      <portal.icon className={cn("w-4 h-4", portal.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold", portal.color)}>{portal.label}</p>
                      <p className="text-slate-600 text-[10px] truncate">{portal.description}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-slate-400 flex-shrink-0" />
                  </div>
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-800">
                <Link href="/solutions/estudio-de-danca/dashboard/scanner" target="_blank">
                  <Button size="sm" variant="outline" className="w-full justify-start gap-2 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700">
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                    Scanner QR Check-in
                    <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Módulos */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Módulos Habilitados
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs">
                Funcionalidades disponíveis nesta verticalização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {featureModules.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", m.bg)}>
                      <m.icon className={cn("w-3.5 h-3.5", m.color)} />
                    </div>
                    <span className="text-slate-400 text-sm flex-1">{m.label}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Tenants Recentes */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-200 text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Estúdios Cadastrados
                </CardTitle>
                <CardDescription className="text-slate-600 text-xs">
                  Tenants que utilizam a verticalização DanceFlow (niche: dance)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadStats}
                disabled={loading}
                className="text-slate-500 hover:text-white"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="w-6 h-6 text-slate-600 animate-spin" />
              </div>
            ) : stats?.recentTenants && stats.recentTenants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.recentTenants.map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/admin/studios/${tenant.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-400 text-sm font-black">
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
                <Link
                  href="/admin/studios?niche=dance"
                  className="flex items-center justify-center gap-1.5 p-3 rounded-xl border border-dashed border-slate-800 hover:border-violet-500/30 text-[11px] font-bold text-slate-600 hover:text-violet-400 transition-all uppercase tracking-widest"
                >
                  Ver todos <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Music className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-semibold">Nenhum estúdio ainda</p>
                  <p className="text-slate-700 text-xs mt-1">
                    Estúdios cadastrados via{' '}
                    <Link href="/solutions/estudio-de-danca/register" target="_blank" className="text-violet-500 hover:underline">
                      landing page
                    </Link>{' '}
                    aparecerão aqui
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info: modelo de negócio CREDIT */}
        <Card className="bg-slate-900/30 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              Modelo de Negócio: CREDIT vs MONETARY
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs">
              Cada estúdio pode operar com créditos de aula ou mensalidade fixa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <p className="text-violet-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> Modelo CREDIT (padrão)
                </p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Alunos possuem saldo de créditos (aulas). Ao reservar uma aula via app, a RPC
                  <code className="text-violet-300 mx-1 bg-slate-900 px-1 rounded">enroll_student_in_class</code>
                  gera um <strong className="text-slate-300">QR Code DF-{"{id}"}</strong> para check-in.
                  O admin ajusta créditos via{' '}
                  <code className="text-violet-300 bg-slate-900 px-1 rounded">adjust_student_credits</code>.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-emerald-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Modelo MONETARY (opcional)
                </p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Estúdio opera com mensalidade fixa. O portal do aluno mostra cobranças na tabela
                  <code className="text-emerald-300 mx-1 bg-slate-900 px-1 rounded">payments</code>
                  (pending / overdue / paid). Alertas de inadimplência na tela principal.
                  Configurado em <code className="text-emerald-300 bg-slate-900 px-1 rounded">studios.business_model</code>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuração Técnica */}
        <Card className="bg-slate-900/30 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              Configuração Técnica
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs">
              Parâmetros desta verticalização no sistema Akaai Core
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {techConfig.map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                    {item.label}
                  </p>
                  <p className={cn("text-sm font-mono font-semibold truncate", item.color)}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fluxo QR Check-in */}
        <Card className="bg-slate-900/30 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-400" />
              Fluxo de QR Check-in
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs">
              Como funciona o sistema de check-in via QR Code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 items-center">
              {[
                { step: "1", label: "Aluno abre o portal", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
                { step: "→", label: "", color: "bg-transparent text-slate-600 border-transparent" },
                { step: "2", label: "Toca em \"Reservar Aula\"", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
                { step: "→", label: "", color: "bg-transparent text-slate-600 border-transparent" },
                { step: "3", label: "RPC enroll_student_in_class", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
                { step: "→", label: "", color: "bg-transparent text-slate-600 border-transparent" },
                { step: "4", label: "QR gerado: DF-{attendanceId}", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
                { step: "→", label: "", color: "bg-transparent text-slate-600 border-transparent" },
                { step: "5", label: "Admin escaneia no dashboard", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                { step: "→", label: "", color: "bg-transparent text-slate-600 border-transparent" },
                { step: "6", label: "Attendance: present ✓", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
              ].map((item, i) => (
                item.label ? (
                  <div key={i} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold", item.color)}>
                    <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[10px] font-black">{item.step}</span>
                    {item.label}
                  </div>
                ) : (
                  <ChevronRight key={i} className="w-3.5 h-3.5 text-slate-700" />
                )
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
