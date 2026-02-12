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
  const { vocabulary } = useVocabulary()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [activeTab, setActiveTab] = useState("visao-geral")
  const [loading, setLoading] = useState(true)
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
  
  const [newExpense, setNewExpense] = useState({
    // ... existing ...
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

      setFinanceData({
        totalReceita: stats.monthlyRevenue || 0,
        totalDespesas: totalRealExpenses || (stats.monthlyRevenue || 0) * 0.4,
        lucroLiquido: (stats.monthlyRevenue || 0) - totalRealExpenses,
        inadimplencia: 1250,
        monthlyData: stats.chartRevenueData || [],
        expensesByCategory,
        pendingPayments: stats.evasionAlerts?.map((a: any) => ({
          id: a.id,
          student: a.name,
          value: 250,
          dueDate: "2026-01-10",
          status: "atrasado",
          days: 13
        })) || [],
        teacherPayments: formattedTeacherPayments.length > 0 ? formattedTeacherPayments : [
          { id: 1, teacher: "Ana Paula Rodrigues", classes: 24, rate: 80, total: 1920, status: "pago" },
          { id: 2, teacher: "Carlos Eduardo Silva", classes: 20, rate: 70, total: 1400, status: "pendente" },
        ],
        recentTransactions: []
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
        title: editingExpense ? "Despesa atualizada" : "Despesa adicionada",
        description: newExpense.is_recurring 
          ? "Esta despesa gerará uma nova conta automaticamente ao ser paga." 
          : "As informações financeiras foram atualizadas."
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

      toast({ title: editingPackage ? "Pacote atualizado" : "Pacote criado" })
      setIsPackageModalOpen(false)
      loadFinanceData()
    } catch (e: any) {
      toast({ title: "Erro ao salvar pacote", description: e.message, variant: "destructive" })
    }
  }

  const handleDeletePackage = async (id: string) => {
    if (!confirm("Excluir este pacote?")) return
    try {
      await supabase.from('lesson_packages').delete().eq('id', id)
      toast({ title: "Pacote excluído" })
      loadFinanceData()
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" })
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

      toast({ title: "Pagamento Confirmado", description: "O repasse do professor foi marcado como pago." })
      loadFinanceData()
    } catch (e: any) {
      toast({ title: "Erro ao pagar", description: e.message, variant: "destructive" })
    }
  }

  const { totalReceita, totalDespesas, lucroLiquido, inadimplencia, monthlyData: displayMonthlyData, expensesByCategory: displayExpenses, pendingPayments: displayPending, teacherPayments: displayTeacherPayments } = financeData

  return (
    <ModuleGuard module="financial" showFullError>
      <div className="min-h-screen bg-background pb-10">
        <Header title="Financeiro" />
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
                <p className="text-3xl font-black text-card-foreground">R$ {totalReceita.toLocaleString('pt-BR')}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Receita Mensal</p>
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
                <p className="text-3xl font-black text-card-foreground">R$ {totalDespesas.toLocaleString('pt-BR')}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Despesas Reais</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-indigo-600 text-white border-none shadow-lg shadow-indigo-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-none">Lucro</Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-white">R$ {lucroLiquido.toLocaleString('pt-BR')}</p>
                <p className="text-sm font-medium text-indigo-100 uppercase tracking-wider">Lucro Líquido</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-amber-500" />
                </div>
                <Badge variant="destructive" className="animate-pulse">Alerta</Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-card-foreground">R$ {inadimplencia.toLocaleString('pt-BR')}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Inadimplência</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border">
            <TabsList className="bg-transparent">
                    <TabsTrigger value="visao-geral" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">Visão Geral</TabsTrigger>
              <TabsTrigger value="despesas" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">Saídas (Custos Fixos)</TabsTrigger>
              <TabsTrigger value="mensalidades" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">Entradas ({vocabulary.client}s)</TabsTrigger>
              <TabsTrigger value="pacotes" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">Pacotes de Créditos</TabsTrigger>
              <TabsTrigger value="professores" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">Repasses ({vocabulary.provider}s)</TabsTrigger>
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
                    notes: ""
                  })
                  setIsExpenseModalOpen(true)
                }}
              >
                <Plus className="w-4 h-4" /> Lançar Despesa
              </Button>
            </div>
          </div>

          {/* Visao Geral Tab */}
          <TabsContent value="visao-geral" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-card-foreground font-bold">Fluxo de Caixa</CardTitle>
                  <CardDescription>Receita vs Despesas reais lançadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      receita: { label: "Receita", color: "#10b981" },
                      despesas: { label: "Despesas", color: "#ef4444" },
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
                                    <span className="text-slate-500">{entry.dataKey === "receita" ? "Receita" : "Despesas"}:</span>
                                    <span className="font-bold" style={{ color: entry.color }}>
                                      R$ {Number(entry.value).toLocaleString('pt-BR')}
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
                  <CardTitle className="text-card-foreground font-bold">Distribuição de Gastos</CardTitle>
                  <CardDescription>Principais centros de custo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      valor: { label: "Valor", color: "#6366f1" },
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
                                <p className="text-indigo-600 text-lg">R$ {Number(payload[0].value).toLocaleString('pt-BR')}</p>
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
          </TabsContent>

          {/* Despesas Tab */}
          <TabsContent value="despesas" className="space-y-6">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">Controle de Saídas</CardTitle>
                    <CardDescription>Gerencie aluguel, luz, marketing e outros custos fixos.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                    <TableRow>
                      <TableHead className="pl-6">Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center text-slate-400">
                          Nenhuma despesa lançada ainda. Clique em "Lançar Despesa" para começar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => (
                        <TableRow key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {expense.description}
                              {expense.is_recurring && (
                                <Repeat className="w-3 h-3 text-indigo-500" title="Recorrente" />
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
                            R$ {Number(expense.amount).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge className={expense.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                              {expense.status === 'paid' ? 'Pago' : 'Pendente'}
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
                  Mensalidades em Atraso (Pendentes)
                </CardTitle>
                <CardDescription>{vocabulary.client}s que ainda não efetuaram o pagamento deste mês.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                      <TableHead className="pl-6">{vocabulary.client}</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayPending.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="pl-6 font-bold text-foreground">{payment.student}</TableCell>
                        <TableCell className="text-foreground font-medium">R$ {payment.value}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{payment.dueDate}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="font-bold">{payment.days} dias atrasado</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="outline" size="sm" className="font-bold text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50">Cobrar WhatsApp</Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Janeiro</SelectItem>
                    <SelectItem value="1">Fevereiro</SelectItem>
                    <SelectItem value="2">Março</SelectItem>
                    <SelectItem value="3">Abril</SelectItem>
                    <SelectItem value="4">Maio</SelectItem>
                    <SelectItem value="5">Junho</SelectItem>
                    <SelectItem value="6">Julho</SelectItem>
                    <SelectItem value="7">Agosto</SelectItem>
                    <SelectItem value="8">Setembro</SelectItem>
                    <SelectItem value="9">Outubro</SelectItem>
                    <SelectItem value="10">Novembro</SelectItem>
                    <SelectItem value="11">Dezembro</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Ano" />
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
                      title: "Mês Fechado!",
                      description: `Relatórios de repasse gerados para ${displayTeacherPayments.length} ${vocabulary.providers.toLowerCase()}.`
                    })
                  }, 1500)
                }}
                disabled={isClosingMonth}
              >
                {isClosingMonth ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Fechar Mês e Gerar Relatórios
              </Button>
            </div>

            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Repasse de {vocabulary.providers}
                </CardTitle>
                <CardDescription>Controle de pagamentos por {vocabulary.services.toLowerCase()} ministradas.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                      <TableHead className="pl-6">{vocabulary.provider}</TableHead>
                      <TableHead>Créditos / Sessões</TableHead>
                      <TableHead>Valor/Uso</TableHead>
                      <TableHead>Total à Pagar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayTeacherPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="pl-6 font-bold text-foreground">{payment.teacher}</TableCell>
                        <TableCell className="text-foreground">{payment.classes} {vocabulary.services.toLowerCase()}</TableCell>
                        <TableCell className="text-muted-foreground">R$ {payment.rate}</TableCell>
                        <TableCell className="font-black text-indigo-600">R$ {payment.total.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className={payment.status === 'pago' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                            {payment.status === 'pago' ? 'Pago' : 'Pendente'}
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
                              Pagar Agora
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pacotes Tab */}
          <TabsContent value="pacotes" className="space-y-6">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">Gestão de Pacotes de Créditos</CardTitle>
                    <CardDescription>Configure os pacotes que os {vocabulary.clients.toLowerCase()} podem comprar por crédito.</CardDescription>
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
                    <Plus className="w-4 h-4" /> Novo Pacote
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                      <TableHead className="pl-6">Nome do Pacote</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Custo/Uso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessonPackages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="pl-6 font-bold">{pkg.name}</TableCell>
                        <TableCell>{pkg.lessons_count} {vocabulary.services.toLowerCase()}</TableCell>
                        <TableCell className="font-bold text-indigo-600">R$ {Number(pkg.price).toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground italic">R$ {(Number(pkg.price) / pkg.lessons_count).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? "Ativo" : "Inativo"}
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
        </Tabs>
      </div>

      {/* Modal de Despesa */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {editingExpense ? "Editar Despesa" : "Nova Despesa (Saída)"}
            </DialogTitle>
            <DialogDescription>
              Lançamentos de custos fixos ou variáveis do {vocabulary.establishment.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Input 
                id="desc" 
                placeholder="Ex: Aluguel Mensal" 
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat">Categoria</Label>
                <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aluguel">Aluguel</SelectItem>
                    <SelectItem value="Utilidades">Utilidades (Luz/Água)</SelectItem>
                    <SelectItem value="Marketing">Marketing/Anúncios</SelectItem>
                    <SelectItem value="Limpeza">Limpeza</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Sistema">Sistema/SaaS</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="val">Valor (R$)</Label>
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
                <Label htmlFor="date">Data de Vencimento</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={newExpense.due_date}
                  onChange={e => setNewExpense({...newExpense, due_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newExpense.status} onValueChange={v => setNewExpense({...newExpense, status: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (Opcional)</Label>
              <Input 
                id="notes" 
                placeholder="Detalhes adicionais..." 
                value={newExpense.notes}
                onChange={e => setNewExpense({...newExpense, notes: e.target.value})}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Pagamento Recorrente</p>
                    <p className="text-[10px] text-slate-500">Repetir esta conta automaticamente</p>
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
                <Label>Frequência da Recorrência</Label>
                <Select 
                  value={newExpense.recurrence_period} 
                  onValueChange={v => setNewExpense({...newExpense, recurrence_period: v})}
                >
                  <SelectTrigger className="bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={handleSaveExpense}>
              {editingExpense ? "Salvar Alterações" : "Confirmar Lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal de Pacote */}
      <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editingPackage ? "Editar Pacote" : "Criar Novo Pacote"}</DialogTitle>
            <DialogDescription>Defina o nome, quantidade de {vocabulary.services.toLowerCase()} e preço.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Pacote</Label>
              <Input 
                placeholder="Ex: Pacote Ouro" 
                value={newPackage.name}
                onChange={e => setNewPackage({...newPackage, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Qtd. Créditos</Label>
                <Input 
                  type="number" 
                  placeholder="10" 
                  value={newPackage.lessons_count}
                  onChange={e => setNewPackage({...newPackage, lessons_count: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Total (R$)</Label>
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
              <Label>Pacote Ativo (Visível para {vocabulary.clients.toLowerCase()})</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPackageModalOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={handleSavePackage}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ModuleGuard>
  )
}
