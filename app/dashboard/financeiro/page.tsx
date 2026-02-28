"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Users,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  GraduationCap,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Repeat,
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
  Area,
  AreaChart,
} from "recharts"
import { 
  getDashboardStats, 
  getExpenses, 
  saveExpense, 
  deleteExpense 
} from "@/lib/database-utils"
import { supabase } from "@/lib/supabase"
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { ModuleGuard } from "@/components/providers/module-guard"

export default function FinanceiroPage() {
  const { toast } = useToast()
  const { vocabulary, t, language } = useVocabulary()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [activeTab, setActiveTab] = useState("visao-geral")
  const [loading, setLoading] = useState(true)
  const [businessModel, setBusinessModel] = useState<'CREDIT' | 'MONETARY'>('CREDIT')
  const [isClosingMonth, setIsClosingMonth] = useState(false)
  const [financeData, setFinanceData] = useState<any>({
    totalReceita: 0,
    totalDespesas: 0,
    lucroLiquido: 0,
    inadimplencia: 0,
    monthlyData: [],
    expensesByCategory: [],
    pendingPayments: [],
    teacherPayments: [],
    recentTransactions: []
  })
  
  const [expenses, setExpenses] = useState<any[]>([])
  const [lessonPackages, setLessonPackages] = useState<any[]>([])
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [editingPackage, setEditingPackage] = useState<any>(null)
  
  const [newExpense, setNewExpense] = useState<{
    description: string
    category: string
    amount: string
    due_date: string
    status: string
    notes: string
    is_recurring: boolean
    recurrence_period: string
  }>({
    description: "",
    category: "Outros",
    amount: "",
    due_date: "",
    status: "pending",
    notes: "",
    is_recurring: false,
    recurrence_period: "monthly"
  })

  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    lessons_count: "",
    price: "",
    is_active: true
  })

  const loadFinanceData = async () => {
    const userStr = localStorage.getItem("danceflow_user")
    if (!userStr) return
    const user = JSON.parse(userStr)
    const studioId = user.studio_id || user.studioId

    setLoading(true)
    try {
      // Carregar Business Model
      const { data: studioData } = await supabase
        .from('studios')
        .select('business_model')
        .eq('id', studioId)
        .single()
      
      if (studioData) {
        setBusinessModel(studioData.business_model as 'CREDIT' | 'MONETARY' || 'CREDIT')
      }

      const stats = await getDashboardStats()
      const realExpenses = await getExpenses()
      setExpenses(realExpenses)

      // Carregar Pacotes
      const { data: packages } = await supabase
        .from('lesson_packages')
        .select('*')
        .eq('studio_id', studioId)
        .order('lessons_count', { ascending: true })
      setLessonPackages(packages || [])

      // Calcular despesas reais
      const totalRealExpenses = realExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
      
      // Agrupar por categoria para o gráfico
      const categoryMap: Record<string, number> = {}
      realExpenses.forEach(exp => {
        categoryMap[exp.category] = (categoryMap[exp.category] || 0) + Number(exp.amount)
      })
      
      const expensesByCategory = Object.keys(categoryMap).map(cat => ({
        category: cat,
        valor: categoryMap[cat]
      }))

      // Fallback se não houver categorias reais ainda
      if (expensesByCategory.length === 0) {
        expensesByCategory.push(
          { category: "Aluguel", valor: 0 },
          { category: "Utilidades", valor: 0 },
          { category: "Marketing", valor: 0 }
        )
      }

      // Carregar Repasses de Professores Reais
      const { data: realTeacherFinances } = await supabase
        .from('teacher_finances')
        .select(`
          *,
          teacher:teachers(name)
        `)
        .order('created_at', { ascending: false })
      
      const formattedTeacherPayments = realTeacherFinances?.map(f => ({
        id: f.id,
        teacher: f.teacher?.name || vocabulary.provider,
        classes: f.student_count, // Usando student_count como referência de volume
        rate: f.base_amount,
        total: f.total_amount,
        status: f.payment_status
      })) || []

      // Carregar Pagamentos Pendentes Reais
      const { data: realPendingPayments } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          due_date,
          status,
          student:student_id(name)
        `)
        .eq('studio_id', studioId)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true })

      const formattedPendingPayments = realPendingPayments?.map(p => {
        const dueDate = new Date(p.due_date)
        const diffTime = new Date().getTime() - dueDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return {
          id: p.id,
          student: (p.student as any)?.name || vocabulary.client,
          value: parseFloat(p.amount),
          dueDate: p.due_date,
          status: diffDays > 0 ? "atrasado" : "pendente",
          days: diffDays > 0 ? diffDays : 0
        }
      }) || []

      setFinanceData({
        totalReceita: stats.monthlyRevenue || 0,
        totalDespesas: totalRealExpenses || (stats.monthlyRevenue || 0) * 0.4,
        lucroLiquido: (stats.monthlyRevenue || 0) - totalRealExpenses,
        inadimplencia: stats.totalOverdue || 0,
        monthlyData: stats.chartRevenueData || [],
        expensesByCategory,
        pendingPayments: formattedPendingPayments,
        teacherPayments: formattedTeacherPayments,
        recentTransactions: stats.recentTransactions || []
      })
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinanceData()
  }, [])

  const handleSaveExpense = async () => {
    try {
      if (!newExpense.description || !newExpense.amount || !newExpense.due_date) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha a descrição, valor e data de vencimento.",
          variant: "destructive"
        })
        return
      }

      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const user = JSON.parse(userStr)

      await saveExpense({
        ...newExpense,
        id: editingExpense?.id,
        studio_id: user.studio_id || user.studioId,
        amount: parseFloat(newExpense.amount)
      })

      toast({
        title: editingExpense ? t.finance.expenseUpdated : t.finance.expenseAdded,
        description: newExpense.is_recurring 
          ? t.finance.recurringInfo 
          : t.finance.infoUpdated
      })

      setIsExpenseModalOpen(false)
      setEditingExpense(null)
      setNewExpense({
        description: "",
        category: "Outros",
        amount: "",
        due_date: new Date().toISOString().split('T')[0],
        status: "pending",
        is_recurring: false,
        recurrence_period: "monthly",
        notes: ""
      })
      loadFinanceData()
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível registrar a despesa.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteExpense = async (id: string) => {
    // ... existing ...
  }

  const handleSavePackage = async () => {
    try {
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const user = JSON.parse(userStr)

      const { error } = await supabase
        .from('lesson_packages')
        .upsert({
          ...newPackage,
          id: editingPackage?.id,
          studio_id: user.studio_id || user.studioId,
          lessons_count: parseInt(newPackage.lessons_count),
          price: parseFloat(newPackage.price)
        })

      if (error) throw error

      toast({ title: editingPackage ? t.finance.packageUpdated : t.finance.packageCreated })
      setIsPackageModalOpen(false)
      loadFinanceData()
    } catch (e: any) {
      toast({ title: "Erro ao salvar pacote", description: e.message, variant: "destructive" })
    }
  }

  const handleDeletePackage = async (id: string) => {
    if (!confirm(t.finance.deletePackage)) return
    try {
      await supabase.from('lesson_packages').delete().eq('id', id)
      toast({ title: t.finance.packageDeleted })
      loadFinanceData()
    } catch (e: any) {
      toast({ title: t.common.error, description: e.message, variant: "destructive" })
    }
  }

  const handlePayTeacher = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_finances')
        .update({ 
          payment_status: 'pago',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', paymentId)

      if (error) throw error

      toast({ title: t.finance.paymentConfirmed, description: t.finance.paymentConfirmedDesc })
      loadFinanceData()
    } catch (e: any) {
      toast({ title: t.common.error, description: e.message, variant: "destructive" })
    }
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', paymentId)

      if (error) throw error

      toast({ title: "Pagamento confirmado!", description: "O recebimento foi registrado com sucesso." })
      loadFinanceData()
    } catch (e: any) {
      toast({ title: "Erro ao confirmar pagamento", description: e.message, variant: "destructive" })
    }
  }

  const { totalReceita, totalDespesas, lucroLiquido, inadimplencia, monthlyData: displayMonthlyData, expensesByCategory: displayExpenses, pendingPayments: displayPending, teacherPayments: displayTeacherPayments, recentTransactions: displayRecentTransactions } = financeData

  return (
    <ModuleGuard module="financial" showFullError>
      <div className="min-h-screen bg-background pb-10">
        <Header title={t.finance.title} />
        {/* ... restante do código ... */}

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex items-center gap-1 text-sm text-emerald-500 font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                  +12%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-card-foreground">{language === 'en' ? '$' : 'R$'} {totalReceita.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.dashboard.monthlyRevenue}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex items-center gap-1 text-sm text-red-500 font-bold">
                  <ArrowDownRight className="w-4 h-4" />
                  +3%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-card-foreground">{language === 'en' ? '$' : 'R$'} {totalDespesas.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.finance.outflows}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-indigo-600 text-white border-none shadow-lg shadow-indigo-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-none">{t.finance.cashFlow}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-white">{language === 'en' ? '$' : 'R$'} {lucroLiquido.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</p>
                <p className="text-sm font-medium text-indigo-100 uppercase tracking-wider">{t.finance.netProfit}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-amber-500" />
                </div>
                <Badge variant="destructive" className="animate-pulse">{t.common.status}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-card-foreground">{language === 'en' ? '$' : 'R$'} {inadimplencia.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.dashboard.overdue}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border">
            <TabsList className="bg-transparent">
                    <TabsTrigger value="visao-geral" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">{t.finance.overview}</TabsTrigger>
              <TabsTrigger value="despesas" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">{t.finance.outflows}</TabsTrigger>
              <TabsTrigger value="mensalidades" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">{t.finance.inflows.replace('{client}', vocabulary.client)}</TabsTrigger>
              {businessModel === 'CREDIT' && (
                <TabsTrigger value="pacotes" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">{t.finance.packages}</TabsTrigger>
              )}
              <TabsTrigger value="professores" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">{t.finance.transfers.replace('{provider}', vocabulary.provider)}</TabsTrigger>
            </TabsList>

            <div className="flex gap-2 px-2">
              <Button 
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                onClick={() => {
                  setEditingExpense(null)
                  setNewExpense({
                    description: "",
                    category: "Outros",
                    amount: "",
                    due_date: new Date().toISOString().split('T')[0],
                    status: "pending",
                    notes: "",
                    is_recurring: false,
                    recurrence_period: "monthly"
                  })
                  setIsExpenseModalOpen(true)
                }}
              >
                <Plus className="w-4 h-4" /> {t.finance.newExpense}
              </Button>
            </div>
          </div>

          {/* Visao Geral Tab */}
          <TabsContent value="visao-geral" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-card-foreground font-bold">{t.finance.cashFlow}</CardTitle>
                  <CardDescription>{t.finance.cashFlowDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      receita: { label: t.dashboard.revenue, color: "#10b981" },
                      despesas: { label: t.dashboard.expenses, color: "#ef4444" },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={displayMonthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                        <XAxis dataKey="month" className="text-[10px] text-muted-foreground uppercase" />
                        <YAxis className="text-[10px] text-muted-foreground" />
                        <ChartTooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 shadow-2xl">
                                <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
                                {payload.map((entry, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-slate-500">{entry.dataKey === "receita" ? t.dashboard.revenue : t.dashboard.expenses}:</span>
                                    <span className="font-bold" style={{ color: entry.color }}>
                                      {language === 'en' ? '$' : 'R$'} {Number(entry.value).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          }}
                        />
                        <Area type="monotone" dataKey="receita" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} />
                        <Area type="monotone" dataKey="despesas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Expenses by Category */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-card-foreground font-bold">{t.finance.expenseDistribution}</CardTitle>
                  <CardDescription>{t.finance.expenseDistributionDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      valor: { label: t.common.value, color: "#6366f1" },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displayExpenses} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                        <XAxis type="number" className="text-[10px] text-muted-foreground" />
                        <YAxis dataKey="category" type="category" width={100} className="text-[10px] font-bold text-slate-500 uppercase" />
                        <ChartTooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 shadow-2xl font-bold">
                                <p className="text-slate-900 dark:text-white mb-1 uppercase text-xs">{label}</p>
                                <p className="text-indigo-600 text-lg">{language === 'en' ? '$' : 'R$'} {Number(payload[0].value).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</p>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="valor" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600" />
                  Transações Recentes
                </CardTitle>
                <CardDescription>Últimas movimentações financeiras registradas (Vendas, OS, Mensalidades)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                      <TableHead className="pl-6">Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRecentTransactions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          Nenhuma transação recente encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayRecentTransactions?.map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            {tx.description}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {tx.student}
                          </TableCell>
                          <TableCell className="capitalize text-xs text-muted-foreground">
                            {tx.method || 'Outro'}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">
                            {language === 'en' ? '$' : 'R$'} {tx.amount.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}
                          </TableCell>
                          <TableCell className="pr-6">
                            <Badge className={
                              tx.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              tx.status === 'overdue' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }>
                              {tx.status === 'paid' ? 'Pago' : tx.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Despesas Tab */}
          <TabsContent value="despesas" className="space-y-6">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">{t.finance.controlOutflows}</CardTitle>
                    <CardDescription>{t.finance.controlOutflowsDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                    <TableRow>
                      <TableHead className="pl-6">{t.common.description}</TableHead>
                      <TableHead>{t.common.category}</TableHead>
                      <TableHead>{t.finance.dueDate}</TableHead>
                      <TableHead>{t.common.value}</TableHead>
                      <TableHead>{t.common.status}</TableHead>
                      <TableHead className="text-right pr-6">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center text-slate-400">
                          {t.finance.noExpenses}
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => (
                        <TableRow key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {expense.description}
                              {expense.is_recurring && (
                                <span title={t.finance.recurring}><Repeat className="w-3 h-3 text-indigo-500" /></span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider">{expense.category}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 font-medium font-mono text-sm">
                            {new Date(expense.due_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-black text-red-500">
                            {language === 'en' ? '$' : 'R$'} {Number(expense.amount).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge className={expense.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                              {expense.status === 'paid' ? t.common.paid : t.common.pending}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                onClick={() => {
                                  setEditingExpense(expense)
                                  setNewExpense({
                                    description: expense.description,
                                    category: expense.category,
                                    amount: expense.amount.toString(),
                                    due_date: expense.due_date,
                                    status: expense.status,
                                    is_recurring: expense.is_recurring || false,
                                    recurrence_period: expense.recurrence_period || "monthly",
                                    notes: expense.notes || ""
                                  })
                                  setIsExpenseModalOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mensalidades Tab (Existing UI) */}
          <TabsContent value="mensalidades" className="space-y-6">
            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  {t.finance.overduePayments}
                </CardTitle>
                <CardDescription>{t.finance.overduePaymentsDesc.replace('{client}', vocabulary.client)}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                      <TableHead className="pl-6">{vocabulary.client}</TableHead>
                      <TableHead>{t.common.value}</TableHead>
                      <TableHead>{t.finance.dueDate}</TableHead>
                      <TableHead>{t.common.status}</TableHead>
                      <TableHead className="text-right pr-6">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayPending?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          Nenhum pagamento pendente no momento.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayPending.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="pl-6 font-bold text-foreground">{payment.student}</TableCell>
                          <TableCell className="text-foreground font-medium">{language === 'en' ? '$' : 'R$'} {payment.value.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'atrasado' ? "destructive" : "secondary"} className="font-bold">
                              {payment.status === 'atrasado' ? t.finance.daysLate.replace('{days}', payment.days) : t.common.pending}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="font-bold text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleMarkAsPaid(payment.id)}
                              >
                                {t.common.confirm}
                              </Button>
                              <Button variant="outline" size="sm" className="font-bold text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50">{t.finance.whatsappCharge}</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professores Tab */}
          <TabsContent value="professores" className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-100 shadow-sm">
              <div className="flex items-center gap-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t.common.month} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.months).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder={t.common.year} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold gap-2"
                onClick={async () => {
                  setIsClosingMonth(true)
                  // Simular fechamento de mês
                  setTimeout(() => {
                    setIsClosingMonth(false)
                    toast({
                      title: t.finance.monthClosed,
                      description: t.finance.transferReportsGenerated
                        .replace('{count}', displayTeacherPayments.length.toString())
                        .replace('{providers}', vocabulary.providers.toLowerCase())
                    })
                  }, 1500)
                }}
                disabled={isClosingMonth}
              >
                {isClosingMonth ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {t.finance.closeMonth}
              </Button>
            </div>

            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  {t.finance.providerTransfers.replace('{provider}', vocabulary.provider)}
                </CardTitle>
                <CardDescription>{t.finance.providerTransfersDesc.replace('{service}', vocabulary.services.toLowerCase())}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                      <TableHead className="pl-6">{vocabulary.provider}</TableHead>
                      <TableHead>{t.finance.creditsSessions}</TableHead>
                      <TableHead>{t.finance.rateUsage}</TableHead>
                      <TableHead>{t.finance.totalToPay}</TableHead>
                      <TableHead>{t.common.status}</TableHead>
                      <TableHead className="text-right pr-6">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayTeacherPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          Nenhum repasse registrado para {vocabulary.providers.toLowerCase()} neste período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayTeacherPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="pl-6 font-bold text-foreground">{payment.teacher}</TableCell>
                          <TableCell className="text-foreground">{payment.classes} {vocabulary.services.toLowerCase()}</TableCell>
                          <TableCell className="text-muted-foreground">{language === 'en' ? '$' : 'R$'} {payment.rate}</TableCell>
                          <TableCell className="font-black text-indigo-600">{language === 'en' ? '$' : 'R$'} {payment.total.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</TableCell>
                          <TableCell>
                            <Badge className={payment.status === 'pago' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                              {payment.status === 'pago' ? t.common.paid : t.common.pending}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            {payment.status === "pendente" && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs"
                                onClick={() => handlePayTeacher(payment.id)}
                              >
                                {t.finance.payNow}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pacotes Tab */}
          {businessModel === 'CREDIT' && (
            <TabsContent value="pacotes" className="space-y-6">
              <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">{t.finance.packageManagement}</CardTitle>
                      <CardDescription>{t.finance.packageManagementDesc.replace('{client}', vocabulary.client.toLowerCase())}</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      className="gap-2 bg-white dark:bg-slate-900 shadow-sm"
                      onClick={() => {
                        setEditingPackage(null)
                        setNewPackage({ name: "", description: "", lessons_count: "", price: "", is_active: true })
                        setIsPackageModalOpen(true)
                      }}
                    >
                      <Plus className="w-4 h-4" /> {t.finance.newPackage}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                        <TableHead className="pl-6">{t.finance.packageName}</TableHead>
                        <TableHead>{t.finance.credits}</TableHead>
                        <TableHead>{t.finance.price}</TableHead>
                        <TableHead>{t.finance.costUsage}</TableHead>
                        <TableHead>{t.common.status}</TableHead>
                        <TableHead className="text-right pr-6">{t.common.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lessonPackages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="pl-6 font-bold">{pkg.name}</TableCell>
                          <TableCell>{pkg.lessons_count} {vocabulary.services.toLowerCase()}</TableCell>
                          <TableCell className="font-bold text-indigo-600">{language === 'en' ? '$' : 'R$'} {Number(pkg.price).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</TableCell>
                          <TableCell className="text-xs text-muted-foreground italic">{language === 'en' ? '$' : 'R$'} {(Number(pkg.price) / pkg.lessons_count).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={pkg.is_active ? "default" : "secondary"}>
                              {pkg.is_active ? t.finance.active : t.finance.inactive}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                setEditingPackage(pkg)
                                setNewPackage({
                                  name: pkg.name,
                                  description: pkg.description || "",
                                  lessons_count: pkg.lessons_count.toString(),
                                  price: pkg.price.toString(),
                                  is_active: pkg.is_active
                                })
                                setIsPackageModalOpen(true)
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeletePackage(pkg.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modal de Despesa */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {editingExpense ? t.finance.editExpense : t.finance.newExpense}
            </DialogTitle>
            <DialogDescription>
              {t.finance.expenseDesc.replace('{establishment}', vocabulary.establishment.toLowerCase())}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="desc">{t.common.description}</Label>
              <Input 
                id="desc" 
                placeholder="Ex: Aluguel Mensal" 
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat">{t.common.category}</Label>
                <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                  <SelectTrigger><SelectValue placeholder={t.common.select} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aluguel">{t.finance.rent}</SelectItem>
                    <SelectItem value="Utilidades">{t.finance.utilities}</SelectItem>
                    <SelectItem value="Marketing">{t.finance.marketing}</SelectItem>
                    <SelectItem value="Limpeza">{t.finance.cleaning}</SelectItem>
                    <SelectItem value="Manutenção">{t.finance.maintenance}</SelectItem>
                    <SelectItem value="Sistema">{t.finance.system}</SelectItem>
                    <SelectItem value="Outros">{t.finance.others}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="val">{t.common.value} ({language === 'en' ? '$' : 'R$'})</Label>
                <Input 
                  id="val" 
                  type="number" 
                  placeholder="0.00" 
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t.finance.dueDate}</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={newExpense.due_date}
                  onChange={e => setNewExpense({...newExpense, due_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t.common.status}</Label>
                <Select value={newExpense.status} onValueChange={v => setNewExpense({...newExpense, status: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t.common.pending}</SelectItem>
                    <SelectItem value="paid">{t.common.paid}</SelectItem>
                    <SelectItem value="cancelled">{t.common.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t.finance.notes} ({t.common.optional})</Label>
              <Input 
                id="notes" 
                placeholder={t.finance.additionalDetails} 
                value={newExpense.notes}
                onChange={e => setNewExpense({...newExpense, notes: e.target.value})}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.finance.recurring}</p>
                    <p className="text-[10px] text-slate-500">{t.finance.recurringAccount}</p>
                  </div>
                </div>
                <Switch 
                  checked={newExpense.is_recurring} 
                  onCheckedChange={v => setNewExpense({...newExpense, is_recurring: v})}
                />
              </div>
            </div>

            {newExpense.is_recurring && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label>{t.finance.recurrenceFreq}</Label>
                <Select 
                  value={newExpense.recurrence_period} 
                  onValueChange={v => setNewExpense({...newExpense, recurrence_period: v})}
                >
                  <SelectTrigger className="bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t.finance.weekly}</SelectItem>
                    <SelectItem value="monthly">{t.finance.monthly}</SelectItem>
                    <SelectItem value="yearly">{t.finance.yearly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExpenseModalOpen(false)}>{t.common.cancel}</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={handleSaveExpense}>
              {editingExpense ? t.common.save : t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal de Pacote */}
      <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editingPackage ? t.finance.editPackage : t.finance.newPackage}</DialogTitle>
            <DialogDescription>{t.finance.packageManagementDesc.replace('{client}', vocabulary.client.toLowerCase())}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.finance.packageName}</Label>
              <Input 
                placeholder="Ex: Pacote Ouro" 
                value={newPackage.name}
                onChange={e => setNewPackage({...newPackage, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.finance.quantityCredits}</Label>
                <Input 
                  type="number" 
                  placeholder="10" 
                  value={newPackage.lessons_count}
                  onChange={e => setNewPackage({...newPackage, lessons_count: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.finance.packagePrice} ({language === 'en' ? '$' : 'R$'})</Label>
                <Input 
                  type="number" 
                  placeholder="350.00" 
                  value={newPackage.price}
                  onChange={e => setNewPackage({...newPackage, price: e.target.value})}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={newPackage.is_active}
                onCheckedChange={v => setNewPackage({...newPackage, is_active: v})}
              />
              <Label>{t.finance.packageActive.replace('{client}', vocabulary.client.toLowerCase())}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPackageModalOpen(false)}>{t.common.cancel}</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={handleSavePackage}>
              {t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ModuleGuard>
  )
}
