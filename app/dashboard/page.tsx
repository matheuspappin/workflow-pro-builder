"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Share2,
  Copy,
  Check,
  CheckCircle,
  QrCode as QrCodeIcon,
  Video,
  ShoppingBag,
  Wrench,
  Package,
  Briefcase,
  Activity,
  User,
  PawPrint,
  Car,
  Home,
  Utensils,
  Link2,
  RefreshCw,
  CheckCheck,
  Loader2,
} from "lucide-react"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { getDashboardStats } from "@/lib/database-utils"
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useOrganization } from "@/components/providers/organization-provider"
import { NicheType } from "@/config/niche-dictionary"
import { getNicheIcon } from "@/lib/niche-utils"
import { monetaryBasedNiches } from "@/config/niche-modules"
import { cn } from "@/lib/utils"

interface InviteCodeCardProps {
  type: 'teacher' | 'student'
  label: string
  description: string
  color: string
  borderColor: string
  titleColor: string
  buttonColor: string
  registerPath?: string
}

function InviteCodeCard({ type, label, description, color, borderColor, titleColor, registerPath = "/register" }: InviteCodeCardProps) {
  const { toast } = useToast()
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const loadCode = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/studio/invite-code", { credentials: "include" })
      const data = await res.json()
      const code = type === 'teacher' ? data.teacher_invite_code : data.student_invite_code
      if (code) setInviteCode(code)
    } catch {
      setInviteCode("—")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCode() }, [type])

  const handleCopy = () => {
    if (!inviteCode || inviteCode === "—") return
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast({ title: "Código copiado!", description: `Compartilhe com o ${label.toLowerCase()} para que se vincule ao estabelecimento.` })
    setTimeout(() => setCopied(false), 2500)
  }

  const handleCopyLink = () => {
    if (!inviteCode || inviteCode === "—") return
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const link = `${origin}${registerPath}?role=${type}&code=${inviteCode}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    toast({ title: "Link copiado!", description: `Envie este link para o ${label.toLowerCase()} criar a conta e já entrar vinculado.` })
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleRegenerate = async () => {
    if (!confirm(`Gerar um novo código invalidará o código atual de ${label}. Continuar?`)) return
    setRegenerating(true)
    try {
      const res = await fetch("/api/studio/invite-code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (data.invite_code) {
        setInviteCode(data.invite_code)
        toast({ title: "Novo código gerado com sucesso!" })
      }
    } catch {
      toast({ title: "Erro ao regenerar código", variant: "destructive" })
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <Card className={cn("border shadow-sm", borderColor, color)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("text-base font-bold flex items-center gap-2", titleColor)}>
          <Link2 className="w-4 h-4" />
          {label}
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando código...
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Código</p>
              <p className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-[0.3em]">
                {inviteCode || "—"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                variant="outline"
                className={cn("h-10 w-10 rounded-xl transition-all", copied && "bg-emerald-50 border-emerald-300 text-emerald-600")}
                onClick={handleCopy}
                title="Copiar código"
              >
                {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className={cn("h-10 w-10 rounded-xl transition-all", copiedLink && "bg-emerald-50 border-emerald-300 text-emerald-600")}
                onClick={handleCopyLink}
                title="Copiar link"
              >
                {copiedLink ? <CheckCheck className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-xl"
                onClick={handleRegenerate}
                disabled={regenerating}
                title="Gerar novo código"
              >
                <RefreshCw className={cn("w-4 h-4", regenerating && "animate-spin")} />
              </Button>
            </div>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-3">
          Envie o link (recomendado) ou o código. Quem já tem conta pode acessar <span className="font-bold text-slate-600 dark:text-slate-300">Meu Perfil → Estabelecimento Vinculado</span> e inserir o código.
        </p>
      </CardContent>
    </Card>
  )
}

// Mock data
const revenueData = [
  { month: "Jan", receita: 12500, despesas: 8200 },
  { month: "Fev", receita: 14200, despesas: 8500 },
  { month: "Mar", receita: 13800, despesas: 8100 },
  { month: "Abr", receita: 15600, despesas: 8800 },
  { month: "Mai", receita: 16200, despesas: 9200 },
  { month: "Jun", receita: 18500, despesas: 9500 },
]

export default function DashboardPage() {
  const { vocabulary, enabledModules, niche, isLoading: vocabLoading, language, t, businessModel } = useOrganization()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState("")
  const [studioSlug, setStudioSlug] = useState("")
  const [studioId, setStudioId] = useState<string | null>(null)
  
  // Business mode logic direto no componente
  const isServiceOrderBased = businessModel === 'MONETARY'
  const isScheduleBased = businessModel === 'CREDIT'
  
  const [dashboardData, setDashboardData] = useState<any>({
    activeStudents: 0,
    activeTeachers: 0,
    activeClasses: 0,
    monthlyRevenue: 0,
    totalOverdue: 0,
    chartRevenueData: [],
    chartClassesData: [],
    evasionAlerts: [],
    upcomingClasses: [],
    studentDistribution: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setMounted(true)
        const user = localStorage.getItem("danceflow_user")
        if (!user) {
          console.log("Aguardando autenticação...")
          return
        }
        
        const userData = JSON.parse(user)
        setUserName(userData.name || "Usuário")
        
        // Tentar pegar o slug de várias fontes possíveis no objeto user
        const slug = userData.studioSlug || userData.studio_slug || (userData.studio && userData.studio.slug) || ""
        setStudioSlug(slug)

        // Carregar dados reais do Supabase
        const sid = userData.studio_id || userData.studioId || userData.studio?.id
        setStudioId(sid || null)
        if (sid) {
          const stats = await getDashboardStats(sid)
          console.log('📊 Dashboard Stats carregados:', stats)
          setDashboardData(stats)
        } else {
          console.warn('⚠️ Studio ID não encontrado no userData')
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, []) // ✅ Sem dependências - executa apenas uma vez

  const ClientIcon = getNicheIcon(niche || 'dance', 'client');
  const ServiceIcon = getNicheIcon(niche || 'dance', 'service');
  const ProviderIcon = getNicheIcon(niche || 'dance', 'provider');

  if (!mounted || vocabLoading) return null

  // Usar dados reais se disponíveis; durante loading NÃO usar fallback (evita flash de mock)
  const hasRevenueData = (dashboardData.chartRevenueData?.length ?? 0) > 0
  const displayRevenueData = loading ? [] : (hasRevenueData ? dashboardData.chartRevenueData : revenueData)

  const hasClassesData = (dashboardData.chartClassesData?.length ?? 0) > 0
  const displayClassesData = loading ? [] : (hasClassesData ? dashboardData.chartClassesData : [{ name: "Principal", alunos: 45 }])

  const displayEvasionAlerts = dashboardData.evasionAlerts || []

  const displayUpcomingClasses = dashboardData.upcomingClasses || []

  const hasDistributionData = (dashboardData.studentDistribution?.length ?? 0) > 0
  const displayStudentDistribution = loading ? [] : (hasDistributionData ? dashboardData.studentDistribution : [{ name: "Ativos", value: 100, fill: "#9333ea" }])

  return (
    <div className="min-h-screen bg-background relative z-10">
      <Header title={t.sidebar.dashboard} />
      
      <div className="p-6">
        {/* Quick Actions & Shortcut */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          {/* Módulo Aulas/Serviços ao Vivo */}
          {enabledModules.classes && !(niche && monetaryBasedNiches.includes(niche as any)) && (
            <Link href="/dashboard/ao-vivo">
              <Card className="bg-red-600 text-white border-none shadow-lg hover:bg-red-700 transition-all cursor-pointer group relative overflow-hidden h-full">
                <CardContent className="p-6 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{language === 'pt' ? `${vocabulary.service} ${t.dashboard.live}` : `${t.dashboard.live} ${vocabulary.service}`}</p>
                      <p className="text-xs text-red-100">{t.dashboard.nowIn} {vocabulary.establishment.toLowerCase()} {t.dashboard.now}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-all" />
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              </Card>
            </Link>
          )}

          {/* Módulo Scanner (Portaria) */}
          {enabledModules.scanner && (
            <Link href="/dashboard/scanner">
              <Card className="bg-slate-900 text-white border-none shadow-lg hover:bg-slate-800 transition-all cursor-pointer group h-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
                      <QrCodeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{t.dashboard.gate}</p>
                      <p className="text-xs text-slate-400">{t.dashboard.validate}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Módulo Service Orders (OS) */}
          {enabledModules.service_orders && (
            <Link href="/dashboard/os">
              <Card className="bg-orange-600 text-white border-none shadow-lg hover:bg-orange-700 transition-all cursor-pointer group h-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{t.dashboard.newOS}</p>
                      <p className="text-xs text-orange-100">{t.dashboard.openOS}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Módulo AI Chat (Insights) */}
          {enabledModules.ai_chat && (
            <Link href="/dashboard/chat">
              <Card className="bg-slate-900 text-white border-none shadow-lg hover:bg-slate-800 transition-all cursor-pointer group h-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{t.dashboard.aiAnalysis}</p>
                      <p className="text-xs text-slate-400">{t.dashboard.insights}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Convites por código (padrão DanceFlow — todos os nichos genéricos) */}
          {studioId && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InviteCodeCard
                type="student"
                label={`${t.dashboard.invite} ${vocabulary.client}`}
                description={`Código para ${vocabulary.client.toLowerCase()} se vincular ao estabelecimento`}
                color="bg-red-50 dark:bg-red-950/20"
                borderColor="border-red-200 dark:border-red-800/50"
                titleColor="text-red-600 dark:text-red-400"
                buttonColor=""
              />
              <InviteCodeCard
                type="teacher"
                label={`${t.dashboard.invite} ${vocabulary.provider}`}
                description={`Código para ${vocabulary.provider.toLowerCase()} se vincular ao estabelecimento`}
                color="bg-emerald-50 dark:bg-emerald-950/20"
                borderColor="border-emerald-200 dark:border-emerald-800/50"
                titleColor="text-emerald-600 dark:text-emerald-400"
                buttonColor=""
              />
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card: Clientes Ativos */}
          <Card className="bg-card border-border border-l-4 border-l-red-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center">
                  <ClientIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${dashboardData.studentGrowth?.startsWith('-') ? 'text-destructive' : 'text-emerald-600'}`}>
                  {dashboardData.studentGrowth?.startsWith('-') ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {loading ? "..." : dashboardData.studentGrowth}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-card-foreground">
                  {loading ? "..." : dashboardData.activeStudents}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{vocabulary.client} {t.common.active}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Provedores/Equipe */}
          <Card className="bg-card border-border border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <ProviderIcon className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-card-foreground">
                  {loading ? "..." : dashboardData.activeTeachers}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{vocabulary.provider} {t.common.active}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Serviços/Aulas Ativas */}
          <Card className="bg-card border-border border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <ServiceIcon className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-card-foreground">
                  {loading ? "..." : dashboardData.activeClasses}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{vocabulary.service} {t.common.activeF}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Financeiro */}
          {enabledModules.financial && (
            <Card className="bg-card border-border border-l-4 border-l-slate-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-900/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-slate-900" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${dashboardData.revenueGrowth?.startsWith('-') ? 'text-destructive' : 'text-emerald-600'}`}>
                    {dashboardData.revenueGrowth?.startsWith('-') ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {loading ? "..." : dashboardData.revenueGrowth}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-card-foreground">
                    {loading ? "..." : `${language === 'pt' ? 'R$' : '$'} ${dashboardData.monthlyRevenue.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}`}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.dashboard.monthlyRevenue}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card: Inadimplência (Só se financeiro estiver ativo) */}
          {enabledModules.financial && (
            <Card className="bg-card border-border border-destructive/20 bg-destructive/5 border-l-4 border-l-destructive">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  {dashboardData.totalOverdue > 0 && (
                    <Badge variant="destructive" className="animate-pulse">{t.dashboard.alert}</Badge>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-destructive">
                    {loading ? "..." : `${language === 'pt' ? 'R$' : '$'} ${dashboardData.totalOverdue.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}`}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-destructive/70">{t.dashboard.overdue}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart - Only if Financial Enabled */}
          {enabledModules.financial ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">{t.dashboard.revenueVsExpenses}</CardTitle>
                <CardDescription>{t.dashboard.last6Months}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    receita: { label: t.dashboard.revenue, color: "#dc2626" },
                    despesas: { label: t.dashboard.expenses, color: "#ea580c" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-muted-foreground" />
                      <YAxis className="text-muted-foreground" />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                              <p className="font-medium text-foreground mb-1">{label}</p>
                              {payload.map((entry, index) => (
                                <p key={index} className="text-sm" style={{ color: entry.color }}>
                                  {entry.dataKey === "receita" ? t.dashboard.revenue : t.dashboard.expenses}: {language === 'pt' ? 'R$' : '$'} {Number(entry.value).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}
                                </p>
                              ))}
                            </div>
                          )
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="receita"
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={{ fill: "#dc2626" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="despesas"
                        stroke="#ea580c"
                        strokeWidth={2}
                        dot={{ fill: "#ea580c" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>{t.dashboard.moduleInactive}</CardTitle></CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t.dashboard.activateModule}
              </CardContent>
            </Card>
          )}

          {/* Classes Distribution - Only if Classes Enabled */}
          {enabledModules.classes ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">{vocabulary.client} {language === 'pt' ? 'por' : 'by'} {vocabulary.category}</CardTitle>
                <CardDescription>{t.dashboard.distribution}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    alunos: { label: vocabulary.client, color: "#dc2626" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayClassesData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-muted-foreground" />
                      <YAxis dataKey="name" type="category" width={100} className="text-muted-foreground" />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                              <p className="font-medium text-foreground">{label}</p>
                              <p className="text-sm text-red-600">{payload[0].value} {vocabulary.client.toLowerCase()}</p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="alunos" fill="#dc2626" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : (
            // Placeholder for non-class businesses (e.g. Retail)
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>{language === 'pt' ? 'Distribuição' : 'Distribution'}</CardTitle></CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t.dashboard.moduleNotActive.replace('{service}', vocabulary.service.toLowerCase())}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Evasion Alerts / Risk Analysis */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  {t.dashboard.riskAlerts}
                 </CardTitle>
                <CardDescription>{vocabulary.client} {t.dashboard.lowActivity}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayEvasionAlerts.length > 0 ? displayEvasionAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{alert.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.dashboard.last} {vocabulary.service.toLowerCase()}: {alert.lastClass}
                      </p>
                    </div>
                    <Badge
                      variant={alert.risk === "alto" ? "destructive" : "secondary"}
                      className={alert.risk === "alto" ? "" : "bg-amber-100 text-amber-600 border-none"}
                    >
                      {t.dashboard.risk} {alert.risk === "alto" ? t.common.high : t.common.medium}
                    </Badge>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-20" />
                    <p>{t.dashboard.riskNone.replace('{client}', vocabulary.client.toLowerCase())}</p>
                  </div>
                )}
              </div>
              <Button type="button" variant="ghost" className="w-full mt-4 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold uppercase tracking-widest text-[10px]" asChild>
                <Link href="/dashboard/alunos">
                  {t.dashboard.viewAll} {vocabulary.client.toLowerCase()}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Classes OR Service Orders (based on Business Mode) */}
          {isServiceOrderBased ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-600" />
                  {t.dashboard.openOS || "OS em Andamento"}
                </CardTitle>
                <CardDescription>{t.dashboard.inProgress || "Serviços sendo executados"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock de OS em andamento */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border-l-4 border-l-orange-500">
                    <div>
                      <p className="font-medium text-foreground">OS #1023 - {vocabulary.client} Silva</p>
                      <p className="text-sm text-muted-foreground">Manutenção Geral</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-orange-100 text-orange-600 border-none">
                        Em Andamento
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border-l-4 border-l-amber-500">
                    <div>
                      <p className="font-medium text-foreground">OS #1024 - {vocabulary.client} Santos</p>
                      <p className="text-sm text-muted-foreground">Troca de Peças</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-amber-100 text-amber-600 border-none">
                        Aguardando
                      </Badge>
                    </div>
                  </div>
                </div>
                  <Button type="button" variant="ghost" className="w-full mt-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold uppercase tracking-widest text-[10px]" asChild>
                    <Link href="/dashboard/os">
                      {t.dashboard.viewAll} OS
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
              </CardContent>
            </Card>
          ) : (enabledModules.classes ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  {t.dashboard.upcoming} {vocabulary.service}
                </CardTitle>
                <CardDescription>{vocabulary.service} {t.dashboard.today}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayUpcomingClasses.length > 0 ? (
                    displayUpcomingClasses.map((classItem: any) => (
                      <div
                        key={classItem.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div>
                          <p className="font-medium text-foreground">{classItem.name}</p>
                          <p className="text-sm text-muted-foreground">{classItem.teacher}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">{classItem.time}</p>
                          <p className="text-sm text-muted-foreground">
                            {classItem.students} {vocabulary.client.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20 text-red-600" />
                      <p>{t.dashboard.freeSchedule}</p>
                    </div>
                  )}
                </div>
                <Button type="button" variant="ghost" className="w-full mt-4 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold uppercase tracking-widest text-[10px]" asChild>
                  <Link href="/dashboard/aulas">
                    {t.dashboard.viewFull}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>{t.dashboard.schedule}</CardTitle></CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
                {t.dashboard.moduleNotActive.replace('{service}', vocabulary.service.toLowerCase())}
              </CardContent>
            </Card>
          ))}

          {/* Student Age Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-red-600" />
                {t.dashboard.profile} {vocabulary.client}
              </CardTitle>
              <CardDescription>{t.dashboard.ageRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  Criancas: { label: t.dashboard.children, color: "#dc2626" },
                  Adolescentes: { label: t.dashboard.teens, color: "#ea580c" },
                  Adultos: { label: t.dashboard.adults, color: "#0f172a" },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayStudentDistribution.map((item: any, i: number) => ({
                        ...item,
                        fill: [ "#dc2626", "#ea580c", "#0f172a" ][i % 3]
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={0}
                    >
                      {displayStudentDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={[ "#dc2626", "#ea580c", "#0f172a" ][index % 3]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                            <p className="font-medium text-foreground">{data.name}</p>
                            <p className="text-sm text-muted-foreground">{data.value}%</p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {displayStudentDistribution.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: [ "#dc2626", "#ea580c", "#0f172a" ][i % 3] }}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.name === "Criancas" ? t.dashboard.children : 
                       item.name === "Adolescentes" ? t.dashboard.teens : 
                       item.name === "Adultos" ? t.dashboard.adults : item.name} ({item.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
