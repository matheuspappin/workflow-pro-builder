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
  Utensils
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

import { useVocabulary } from "@/hooks/use-vocabulary"
import { NicheType } from "@/config/niche-dictionary"
import { getNicheIcon } from "@/lib/niche-utils"

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
  const { vocabulary, enabledModules, niche, loading: vocabLoading, language } = useVocabulary()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState("")
  const [studioSlug, setStudioSlug] = useState("")
  const [copying, setCopying] = useState(false)
  
  const TRANSLATIONS = {
    pt: {
      live: "ao Vivo",
      nowIn: "Ver quem está no",
      now: "agora",
      gate: "Portaria",
      validate: "Validar entrada",
      newOS: "Nova OS",
      openOS: "Abrir ordem de serviço",
      aiAnalysis: "Análise IA",
      insights: "Insights do negócio",
      invite: "Convite",
      copyLink: "Copiar Link",
      active: "Ativos",
      activeF: "Ativas",
      monthlyRevenue: "Receita Mensal",
      overdue: "Inadimplência",
      revenueVsExpenses: "Faturamento vs Despesas",
      last6Months: "Últimos 6 meses",
      revenue: "Receita",
      expenses: "Despesas",
      distribution: "Distribuição atual",
      moduleInactive: "Módulo Financeiro Desativado",
      activateModule: "Ative o módulo financeiro para ver métricas.",
      riskAlerts: "Alertas de Risco",
      lowActivity: "com baixa atividade",
      last: "Última",
      risk: "Risco",
      viewAll: "Ver todos os",
      upcoming: "Próximas",
      today: "hoje",
      freeSchedule: "Agenda livre hoje.",
      viewFull: "Ver agenda completa",
      profile: "Perfil dos",
      ageRange: "Faixa Etária",
      moduleNotActive: "Módulo de {service} não ativo.",
      riskNone: "Nenhum {client} em risco."
    },
    en: {
      live: "Live",
      nowIn: "See who is in the",
      now: "now",
      gate: "Gate",
      validate: "Validate entry",
      newOS: "New SO",
      openOS: "Open service order",
      aiAnalysis: "AI Analysis",
      insights: "Business insights",
      invite: "Invite",
      copyLink: "Copy Link",
      active: "Active",
      activeF: "Active",
      monthlyRevenue: "Monthly Revenue",
      overdue: "Overdue",
      revenueVsExpenses: "Revenue vs Expenses",
      last6Months: "Last 6 months",
      revenue: "Revenue",
      expenses: "Expenses",
      distribution: "Current distribution",
      moduleInactive: "Financial Module Inactive",
      activateModule: "Activate the financial module to see metrics.",
      riskAlerts: "Risk Alerts",
      lowActivity: "with low activity",
      last: "Last",
      risk: "Risk",
      viewAll: "View all",
      upcoming: "Upcoming",
      today: "today",
      freeSchedule: "Free schedule today.",
      viewFull: "View full schedule",
      profile: "Profile of",
      ageRange: "Age Range",
      moduleNotActive: "{service} module not active.",
      riskNone: "No {client} at risk."
    }
  }

  const t = TRANSLATIONS[language as 'pt' | 'en'] || TRANSLATIONS.pt

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
        setUserName(userData.name || "Usuario")
        setStudioSlug(userData.studioSlug || "")

        // Carregar dados reais do Supabase
        const stats = await getDashboardStats()
        console.log('📊 Dashboard Stats carregados:', stats)
        setDashboardData(stats)
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleCopyLink = () => {
    const link = `${window.location.origin}/s/${studioSlug}/join`
    navigator.clipboard.writeText(link)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  const ClientIcon = getNicheIcon(niche || 'dance', 'client');
  const ServiceIcon = getNicheIcon(niche || 'dance', 'service');
  const ProviderIcon = getNicheIcon(niche || 'dance', 'provider');

  if (!mounted || vocabLoading) return null

  // Usar dados reais se disponíveis, senão fallback para mocks
  const displayRevenueData = dashboardData.chartRevenueData?.length > 0 
    ? dashboardData.chartRevenueData 
    : revenueData

  const displayClassesData = dashboardData.chartClassesData?.length > 0 
    ? dashboardData.chartClassesData 
    : [
      { name: "Principal", alunos: 45 },
    ]

  const displayEvasionAlerts = dashboardData.evasionAlerts || []

  const displayUpcomingClasses = dashboardData.upcomingClasses || []

  const displayStudentDistribution = dashboardData.studentDistribution?.length > 0
    ? dashboardData.studentDistribution
    : [
      { name: "Ativos", value: 100, fill: "#9333ea" },
    ]

  return (
    <div className="min-h-screen bg-background">
      <Header title="Dashboard" />
      
      <div className="p-6">
        {/* Quick Actions & Shortcut */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          {/* Módulo Aulas/Serviços ao Vivo */}
          {enabledModules.classes && (
            <Link href="/dashboard/ao-vivo">
              <Card className="bg-rose-500 text-white border-none shadow-lg hover:bg-rose-600 transition-all cursor-pointer group relative overflow-hidden h-full">
                <CardContent className="p-6 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{language === 'pt' ? `${vocabulary.services} ${t.live}` : `${t.live} ${vocabulary.services}`}</p>
                      <p className="text-xs text-rose-100">{t.nowIn} {vocabulary.establishment.toLowerCase()} {t.now}</p>
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
              <Card className="bg-primary text-primary-foreground border-none shadow-lg hover:bg-primary/90 transition-all cursor-pointer group h-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <QrCodeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{t.gate}</p>
                      <p className="text-xs text-primary-foreground/70">{t.validate}</p>
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
              <Card className="bg-blue-600 text-white border-none shadow-lg hover:bg-blue-700 transition-all cursor-pointer group h-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{t.newOS}</p>
                      <p className="text-xs text-blue-100">{t.openOS}</p>
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
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{t.aiAnalysis}</p>
                      <p className="text-xs text-muted-foreground">{t.insights}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Convite do Studio (Sempre visível se tiver slug) */}
          {studioSlug && (
            <Card className="bg-card border-border shadow-sm h-full">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 overflow-hidden w-full">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    <Share2 className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{t.invite}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button size="icon" variant="ghost" className="h-8 w-full justify-start gap-2 px-2 bg-secondary/50 hover:bg-secondary" onClick={handleCopyLink}>
                        {copying ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                        <span className="text-[10px] truncate">{t.copyLink}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card: Clientes Ativos */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClientIcon className="w-6 h-6 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${dashboardData.studentGrowth?.startsWith('-') ? 'text-destructive' : 'text-success'}`}>
                  {dashboardData.studentGrowth?.startsWith('-') ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {loading ? "..." : dashboardData.studentGrowth}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-card-foreground">
                  {loading ? "..." : dashboardData.activeStudents}
                </p>
                <p className="text-sm text-muted-foreground">{vocabulary.clients} {t.active}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Provedores/Equipe */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <ProviderIcon className="w-6 h-6 text-success" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-card-foreground">
                  {loading ? "..." : dashboardData.activeTeachers}
                </p>
                <p className="text-sm text-muted-foreground">{vocabulary.providers} {t.active}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Serviços/Aulas Ativas */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <ServiceIcon className="w-6 h-6 text-warning" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-card-foreground">
                  {loading ? "..." : dashboardData.activeClasses}
                </p>
                <p className="text-sm text-muted-foreground">{vocabulary.services} {t.activeF}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Financeiro */}
          {enabledModules.financial && (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-accent" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${dashboardData.revenueGrowth?.startsWith('-') ? 'text-destructive' : 'text-success'}`}>
                    {dashboardData.revenueGrowth?.startsWith('-') ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {loading ? "..." : dashboardData.revenueGrowth}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-card-foreground">
                    {loading ? "..." : `${language === 'pt' ? 'R$' : '$'} ${dashboardData.monthlyRevenue.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.monthlyRevenue}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card: Inadimplência (Só se financeiro estiver ativo) */}
          {enabledModules.financial && (
            <Card className="bg-card border-border border-destructive/20 bg-destructive/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  {dashboardData.totalOverdue > 0 && (
                    <Badge variant="destructive" className="animate-pulse">{language === 'pt' ? 'Alerta' : 'Alert'}</Badge>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-destructive">
                    {loading ? "..." : `${language === 'pt' ? 'R$' : '$'} ${dashboardData.totalOverdue.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}`}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">{t.overdue}</p>
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
                <CardTitle className="text-card-foreground">{t.revenueVsExpenses}</CardTitle>
                <CardDescription>{t.last6Months}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    receita: { label: t.revenue, color: "#9333ea" },
                    despesas: { label: t.expenses, color: "#db2777" },
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
                                  {entry.dataKey === "receita" ? t.revenue : t.expenses}: {language === 'pt' ? 'R$' : '$'} {Number(entry.value).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}
                                </p>
                              ))}
                            </div>
                          )
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="receita"
                        stroke="#9333ea"
                        strokeWidth={2}
                        dot={{ fill: "#9333ea" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="despesas"
                        stroke="#db2777"
                        strokeWidth={2}
                        dot={{ fill: "#db2777" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>{t.moduleInactive}</CardTitle></CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t.activateModule}
              </CardContent>
            </Card>
          )}

          {/* Classes Distribution - Only if Classes Enabled */}
          {enabledModules.classes ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">{vocabulary.clients} {language === 'pt' ? 'por' : 'by'} {vocabulary.category}</CardTitle>
                <CardDescription>{t.distribution}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    alunos: { label: vocabulary.clients, color: "#9333ea" },
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
                              <p className="text-sm text-primary">{payload[0].value} {vocabulary.clients.toLowerCase()}</p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="alunos" fill="#9333ea" radius={[0, 4, 4, 0]} />
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
                {t.moduleNotActive.replace('{service}', vocabulary.services.toLowerCase())}
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
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  {t.riskAlerts}
                 </CardTitle>
                <CardDescription>{vocabulary.clients} {t.lowActivity}</CardDescription>
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
                        {t.last} {vocabulary.service.toLowerCase()}: {alert.lastClass}
                      </p>
                    </div>
                    <Badge
                      variant={alert.risk === "alto" ? "destructive" : "secondary"}
                      className={alert.risk === "alto" ? "" : "bg-warning/20 text-warning-foreground"}
                    >
                      {t.risk} {alert.risk === "alto" ? (language === 'pt' ? "alto" : "high") : (language === 'pt' ? "médio" : "medium")}
                    </Badge>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-success opacity-20" />
                    <p>{t.riskNone.replace('{client}', vocabulary.client.toLowerCase())}</p>
                  </div>
                )}
              </div>
              <Link href="/dashboard/alunos">
                <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80">
                  {t.viewAll} {vocabulary.clients.toLowerCase()}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Classes / Appointments */}
          {enabledModules.classes ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t.upcoming} {vocabulary.services}
                </CardTitle>
                <CardDescription>{vocabulary.services} {t.today}</CardDescription>
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
                          <p className="font-medium text-primary">{classItem.time}</p>
                          <p className="text-sm text-muted-foreground">
                            {classItem.students} {vocabulary.clients.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>{t.freeSchedule}</p>
                    </div>
                  )}
                </div>
                <Link href="/dashboard/aulas">
                  <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80">
                    {t.viewFull}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>{language === 'pt' ? 'Agenda' : 'Schedule'}</CardTitle></CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
                {language === 'pt' ? 'Funcionalidade de agenda não ativa.' : 'Schedule feature not active.'}
              </CardContent>
            </Card>
          )}

          {/* Student Age Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-accent" />
                {t.profile} {vocabulary.clients}
              </CardTitle>
              <CardDescription>{t.ageRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  Criancas: { label: language === 'pt' ? "Crianças" : "Children", color: "#9333ea" },
                  Adolescentes: { label: language === 'pt' ? "Adolescentes" : "Teens", color: "#db2777" },
                  Adultos: { label: language === 'pt' ? "Adultos" : "Adults", color: "#06b6d4" },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayStudentDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={0}
                    >
                      {displayStudentDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
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
                {displayStudentDistribution.map((item: any) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.name === "Criancas" ? (language === 'pt' ? 'Crianças' : 'Children') : 
                       item.name === "Adolescentes" ? (language === 'pt' ? 'Adolescentes' : 'Teens') : 
                       item.name === "Adultos" ? (language === 'pt' ? 'Adultos' : 'Adults') : item.name} ({item.value}%)
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
