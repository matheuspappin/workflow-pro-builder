"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { ModuleGuard } from "@/components/providers/module-guard"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  Wallet,
  Users,
  GraduationCap,
  Repeat,
  Edit,
  Trash2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ShoppingBag,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Payment {
  id: string
  amount: number
  description: string
  status: "paid" | "pending" | "overdue" | "cancelled"
  due_date: string | null
  payment_date: string | null
  payment_method: string | null
  reference_month: string | null
  student_name: string
  student_id: string | null
  payment_source?: string | null
  credits_used?: number | null
}

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  due_date: string
  payment_date: string | null
  status: "paid" | "pending" | "cancelled"
  notes: string | null
  is_recurring: boolean
  recurrence_period: string | null
}

interface ProfessionalFinance {
  id: string
  professional_name: string
  student_count: number
  base_amount: number
  total_amount: number
  payment_status: string
}

interface FinanceData {
  payments: Payment[]
  expenses: Expense[]
  professionalFinances: ProfessionalFinance[]
  stats: {
    totalReceita: number
    totalDespesas: number
    lucroLiquido: number
    inadimplencia: number
  }
  chartData: {
    monthly: { month: string; receita: number; despesas: number }[]
    byCategory: { category: string; valor: number }[]
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const statusMap: Record<string, { label: string; className: string; icon: LucideIcon }> = {
  paid:      { label: "Pago",      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400", icon: CheckCircle2 },
  pending:   { label: "Pendente",  className: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400",         icon: Clock },
  overdue:   { label: "Vencido",   className: "bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:text-rose-400",             icon: AlertCircle },
  cancelled: { label: "Cancelado", className: "bg-slate-100 text-slate-500 dark:bg-slate-700/30 dark:text-slate-400",         icon: AlertCircle },
}

const sourceMap: Record<string, { label: string; short: string }> = {
  credit_usage:    { label: "Uso de Crédito", short: "Crédito" },
  package_purchase: { label: "Compra de Pacote", short: "Pacote" },
  pos:             { label: "PDV", short: "PDV" },
  service_order:   { label: "Ordem de Serviço", short: "OS" },
  manual:          { label: "Manual", short: "Manual" },
}

const EXPENSE_CATEGORIES = [
  "Aluguel", "Utilidades", "Marketing", "Limpeza",
  "Manutenção", "Sistema", "Equipamentos", "Salários", "Outros",
]

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
]

type ExpenseFormStatus = "paid" | "pending" | "cancelled"
const EMPTY_EXPENSE: {
  description: string
  category: string
  amount: string
  due_date: string
  status: ExpenseFormStatus
  notes: string
  is_recurring: boolean
  recurrence_period: string
} = {
  description: "",
  category: "Outros",
  amount: "",
  due_date: new Date().toISOString().split("T")[0],
  status: "pending",
  notes: "",
  is_recurring: false,
  recurrence_period: "monthly",
}

const EMPTY_PAYMENT = {
  description: "",
  amount: "",
  due_date: "",
  student_id: "",
  payment_method: "",
  reference_month: "",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: string | null) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—"

// ─── Subcomponents ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
  trend,
}: {
  label: string
  value: number
  sub: string
  color: "emerald" | "red" | "indigo" | "amber"
  icon: LucideIcon
  trend?: "up" | "down"
}) {
  const colors = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", val: "text-emerald-600 dark:text-emerald-400", border: "border-l-emerald-500" },
    red:     { bg: "bg-red-500/10",     text: "text-red-500",     val: "text-red-600 dark:text-red-400",         border: "border-l-red-500" },
    indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-500",  val: "text-indigo-600 dark:text-indigo-400",   border: "border-l-indigo-500" },
    amber:   { bg: "bg-amber-500/10",   text: "text-amber-500",   val: "text-amber-600 dark:text-amber-400",     border: "border-l-amber-500" },
  }
  const c = colors[color]
  return (
    <Card className={cn("border-l-4 bg-white dark:bg-slate-900/50", c.border)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.bg)}>
            <Icon className={cn("w-5 h-5", c.text)} />
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-bold", trend === "up" ? "text-emerald-500" : "text-red-500")}>
              {trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            </div>
          )}
        </div>
        <p className={cn("text-2xl font-black", c.val)}>R$ {fmt(value)}</p>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const { toast } = useToast()
  const [studioId, setStudioId] = useState<string | null>(null)
  const [students, setStudents] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("visao-geral")

  const [data, setData] = useState<FinanceData>({
    payments: [],
    expenses: [],
    professionalFinances: [],
    stats: { totalReceita: 0, totalDespesas: 0, lucroLiquido: 0, inadimplencia: 0 },
    chartData: { monthly: [], byCategory: [] },
  })

  // Payment dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ ...EMPTY_PAYMENT })
  const [isSavingPayment, setIsSavingPayment] = useState(false)

  // Expense dialog
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseForm, setExpenseForm] = useState({ ...EMPTY_EXPENSE })
  const [isSavingExpense, setIsSavingExpense] = useState(false)

  // Mark as paid dialog
  const [markPaidTarget, setMarkPaidTarget] = useState<Payment | null>(null)
  const [markPaidMethod, setMarkPaidMethod] = useState("pix")
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/dance-studio/financeiro?studioId=${sid}`)
      if (!res.ok) throw new Error("Erro ao carregar dados financeiros")
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast({ title: "Erro ao carregar financeiro", description: err.message, variant: "destructive" })
    }
  }, [toast])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid)

      if (sid) {
        await loadData(sid)

        // Load students for payment form
        const { data: studs } = await supabase
          .from("students")
          .select("id, name")
          .eq("studio_id", sid)
          .order("name")
        setStudents(studs || [])
      }
      setLoading(false)
    }
    init()
  }, [loadData])

  // ─── Payments ─────────────────────────────────────────────────────────────

  const handleCreatePayment = async () => {
    if (!paymentForm.amount || !studioId) return
    setIsSavingPayment(true)
    try {
      const res = await fetch("/api/dance-studio/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          amount: paymentForm.amount,
          description: paymentForm.description || "Mensalidade",
          due_date: paymentForm.due_date || null,
          student_id: paymentForm.student_id || null,
          payment_method: paymentForm.payment_method || null,
          reference_month: paymentForm.reference_month || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Cobrança criada!", description: `R$ ${fmt(Number(paymentForm.amount))} adicionada como pendente.` })
      setPaymentForm({ ...EMPTY_PAYMENT })
      setIsPaymentDialogOpen(false)
      await loadData(studioId)
    } catch (err: any) {
      toast({ title: "Erro ao criar cobrança", description: err.message, variant: "destructive" })
    } finally {
      setIsSavingPayment(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!markPaidTarget || !studioId) return
    setIsMarkingPaid(true)
    try {
      const res = await fetch("/api/dance-studio/financeiro", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          paymentId: markPaidTarget.id,
          status: "paid",
          payment_method: markPaidMethod,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Pagamento confirmado!", description: `R$ ${fmt(markPaidTarget.amount)} recebido via ${markPaidMethod.toUpperCase()}.` })
      setMarkPaidTarget(null)
      await loadData(studioId)
    } catch (err: any) {
      toast({ title: "Erro ao confirmar pagamento", description: err.message, variant: "destructive" })
    } finally {
      setIsMarkingPaid(false)
    }
  }

  const handleDeletePayment = async (payment: Payment) => {
    if (!studioId || !confirm(`Excluir cobrança de R$ ${fmt(payment.amount)} de ${payment.student_name}?`)) return
    try {
      const res = await fetch(`/api/dance-studio/financeiro?studioId=${studioId}&paymentId=${payment.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Cobrança excluída" })
      await loadData(studioId)
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" })
    }
  }

  // ─── Expenses ──────────────────────────────────────────────────────────────

  const openNewExpense = () => {
    setEditingExpense(null)
    setExpenseForm({ ...EMPTY_EXPENSE })
    setIsExpenseDialogOpen(true)
  }

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseForm({
      description: expense.description,
      category: expense.category,
      amount: String(expense.amount),
      due_date: expense.due_date,
      status: expense.status,
      notes: expense.notes || "",
      is_recurring: expense.is_recurring,
      recurrence_period: expense.recurrence_period || "monthly",
    })
    setIsExpenseDialogOpen(true)
  }

  const handleSaveExpense = async () => {
    if (!studioId || !expenseForm.description || !expenseForm.amount || !expenseForm.due_date) {
      toast({ title: "Campos obrigatórios", description: "Preencha descrição, valor e data de vencimento.", variant: "destructive" })
      return
    }
    setIsSavingExpense(true)
    try {
      if (editingExpense) {
        const res = await fetch("/api/dance-studio/expenses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studioId, expenseId: editingExpense.id, ...expenseForm, amount: Number(expenseForm.amount) }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        toast({ title: "Despesa atualizada!" })
      } else {
        const res = await fetch("/api/dance-studio/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studioId, ...expenseForm, amount: Number(expenseForm.amount) }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        toast({ title: "Despesa cadastrada!", description: expenseForm.is_recurring ? "Recorrência ativada — próxima será gerada automaticamente." : undefined })
      }
      setIsExpenseDialogOpen(false)
      setEditingExpense(null)
      await loadData(studioId)
    } catch (err: any) {
      toast({ title: "Erro ao salvar despesa", description: err.message, variant: "destructive" })
    } finally {
      setIsSavingExpense(false)
    }
  }

  const handleDeleteExpense = async (expense: Expense) => {
    if (!studioId || !confirm(`Excluir despesa "${expense.description}" de R$ ${fmt(expense.amount)}?`)) return
    try {
      const res = await fetch(`/api/dance-studio/expenses?studioId=${studioId}&expenseId=${expense.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Despesa excluída" })
      await loadData(studioId)
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" })
    }
  }

  const handleMarkExpensePaid = async (expense: Expense) => {
    if (!studioId) return
    try {
      const res = await fetch("/api/dance-studio/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, expenseId: expense.id, status: "paid" }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Despesa paga!", description: expense.is_recurring ? "Próxima ocorrência gerada automaticamente." : undefined })
      await loadData(studioId)
    } catch (err: any) {
      toast({ title: "Erro ao atualizar despesa", description: err.message, variant: "destructive" })
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const { payments, expenses, professionalFinances, stats, chartData } = data
  const pendingPayments = payments.filter(p => p.status === "pending" || p.status === "overdue")
  const pendingExpenses = expenses.filter(e => e.status === "pending")

  if (loading) {
    return (
      <ModuleGuard module="financial" showFullError>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </ModuleGuard>
    )
  }

  return (
    <ModuleGuard module="financial" showFullError>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            Financeiro
          </h1>
          <p className="text-slate-500 text-sm mt-1">Receitas, despesas, cobranças e repasses</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={openNewExpense}
            className="font-bold rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
          <Button
            onClick={() => setIsPaymentDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Receita" value={stats.totalReceita} sub="Este mês (pago)" color="emerald" icon={TrendingUp} trend="up" />
        <StatCard label="Despesas" value={stats.totalDespesas} sub="Este mês" color="red" icon={TrendingDown} />
        <StatCard label="Lucro Líquido" value={stats.lucroLiquido} sub="Receita − Despesas" color="indigo" icon={Wallet} />
        <StatCard label="Inadimplência" value={stats.inadimplencia} sub="Pagamentos vencidos" color="amber" icon={AlertCircle} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-1.5 shadow-sm">
          <TabsList className="bg-transparent flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="visao-geral" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400 font-bold">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="mensalidades" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400 font-bold">
              Cobranças
              {pendingPayments.length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
                  {pendingPayments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="despesas" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400 font-bold">
              Despesas
              {pendingExpenses.length > 0 && (
                <span className="ml-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
                  {pendingExpenses.length}
                </span>
              )}
            </TabsTrigger>
            {professionalFinances.length > 0 && (
              <TabsTrigger value="professores" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400 font-bold">
                Professores
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* ── Visão Geral ─────────────────────────────────────────────────────── */}
        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue vs Expenses chart */}
            <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Fluxo de Caixa
                </CardTitle>
                <CardDescription>Receita vs Despesas nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.monthly.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
                    Sem dados suficientes para o gráfico.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData.monthly}>
                      <defs>
                        <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `R$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#fff", fontSize: 13 }}
                        formatter={(v: any, name: string) => [`R$ ${fmt(Number(v))}`, name === "receita" ? "Receita" : "Despesas"]}
                      />
                      <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2.5} fill="url(#gradReceita)" dot={{ r: 3, fill: "#10b981" }} />
                      <Area type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradDespesas)" dot={{ r: 3, fill: "#ef4444" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                <div className="flex gap-4 mt-2 justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-3 h-1.5 rounded-full bg-emerald-500" />
                    Receita
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-3 h-1.5 rounded-full bg-red-500" />
                    Despesas
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses by category */}
            <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-500" />
                  Despesas por Categoria
                </CardTitle>
                <CardDescription>Distribuição dos gastos cadastrados</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.byCategory.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
                    Nenhuma despesa cadastrada ainda.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData.byCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `R$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#fff", fontSize: 13 }}
                        formatter={(v: any) => [`R$ ${fmt(Number(v))}`, "Total"]}
                      />
                      <Bar dataKey="valor" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent transactions */}
          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-500" />
                Lançamentos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                    <TableHead className="pl-6">Aluno</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 10).map((p) => {
                    const st = statusMap[p.status] ?? statusMap.pending
                    const Icon = st.icon
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">{p.student_name}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 text-sm">{p.description}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{fmtDate(p.due_date)}</TableCell>
                        <TableCell className={cn("font-black", p.status === "paid" ? "text-emerald-600" : "text-slate-900 dark:text-white")}>
                          R$ {fmt(Number(p.amount))}
                        </TableCell>
                        <TableCell className="pr-6">
                          <Badge className={cn("text-xs border-0 font-bold flex items-center gap-1 w-fit", st.className)}>
                            <Icon className="w-3 h-3" />
                            {st.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                        Nenhum lançamento ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cobranças / Mensalidades ─────────────────────────────────────────── */}
        <TabsContent value="mensalidades" className="space-y-4">
          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    Cobranças e Mensalidades
                  </CardTitle>
                  <CardDescription>Todas as cobranças de alunos</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsPaymentDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nova Cobrança
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                    <TableHead className="pl-6">Aluno</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                        <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        Nenhuma cobrança cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => {
                      const st = statusMap[p.status] ?? statusMap.pending
                      const Icon = st.icon
                      return (
                        <TableRow key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-black text-emerald-600 text-xs flex-shrink-0">
                                {p.student_name[0]?.toUpperCase()}
                              </div>
                              <span className="font-bold text-sm text-slate-900 dark:text-white">{p.student_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                            <div className="flex flex-col gap-0.5">
                              {p.payment_source && sourceMap[p.payment_source] && (
                                <Badge variant="outline" className="text-[10px] w-fit font-medium text-slate-500 border-slate-200 dark:border-slate-600">
                                  {sourceMap[p.payment_source].short}
                                </Badge>
                              )}
                              <span>{p.description}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{fmtDate(p.due_date)}</TableCell>
                          <TableCell className="font-black text-slate-900 dark:text-white">
                            {p.credits_used ? (
                              <span className="text-indigo-600 dark:text-indigo-400">{p.credits_used} crédito{p.credits_used !== 1 ? "s" : ""}</span>
                            ) : (
                              <>R$ {fmt(Number(p.amount))}</>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs border-0 font-bold flex items-center gap-1 w-fit", st.className)}>
                              <Icon className="w-3 h-3" />
                              {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-1">
                              {(p.status === "pending" || p.status === "overdue") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="font-bold text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                                  onClick={() => { setMarkPaidTarget(p); setMarkPaidMethod("pix") }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Receber
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                onClick={() => handleDeletePayment(p)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Despesas ─────────────────────────────────────────────────────────── */}
        <TabsContent value="despesas" className="space-y-4">
          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-rose-500" />
                    Controle de Despesas
                  </CardTitle>
                  <CardDescription>Aluguel, contas, marketing e outros custos do estúdio</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={openNewExpense}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nova Despesa
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
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
                      <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        Nenhuma despesa cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((e) => (
                      <TableRow key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {e.description}
                            {e.is_recurring && (
                              <span title="Recorrente"><Repeat className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" /></span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{e.category}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{fmtDate(e.due_date)}</TableCell>
                        <TableCell className="font-black text-rose-600">R$ {fmt(Number(e.amount))}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs border-0 font-bold w-fit",
                            e.status === "paid"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400"
                              : e.status === "cancelled"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400"
                          )}>
                            {e.status === "paid" ? "Pago" : e.status === "cancelled" ? "Cancelado" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1">
                            {e.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="font-bold text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                                onClick={() => handleMarkExpensePaid(e)}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Pagar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                              onClick={() => openEditExpense(e)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-rose-600"
                              onClick={() => handleDeleteExpense(e)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* ── Professores ──────────────────────────────────────────────────────── */}
        {professionalFinances.length > 0 && (
          <TabsContent value="professores" className="space-y-4">
            <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-white/5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  Repasses de Professores
                </CardTitle>
                <CardDescription>Valores a pagar aos professores pelo mês</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                      <TableHead className="pl-6">Professor</TableHead>
                      <TableHead>Aulas</TableHead>
                      <TableHead>Base / Aula</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professionalFinances.map((pf) => (
                      <TableRow key={pf.id}>
                        <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">{pf.professional_name}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{pf.student_count} aulas</TableCell>
                        <TableCell className="text-slate-500 text-sm">R$ {fmt(Number(pf.base_amount))}</TableCell>
                        <TableCell className="font-black text-indigo-600">R$ {fmt(Number(pf.total_amount))}</TableCell>
                        <TableCell className="pr-6">
                          <Badge className={cn("text-xs border-0 font-bold w-fit",
                            pf.payment_status === "pago"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400"
                          )}>
                            {pf.payment_status === "pago" ? "Pago" : "Pendente"}
                          </Badge>
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

      {/* ── Dialog: Nova Cobrança ─────────────────────────────────────────────── */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Cobrança</DialogTitle>
            <DialogDescription>Crie uma cobrança ou mensalidade para um aluno.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aluno</Label>
              <Select
                value={paymentForm.student_id}
                onValueChange={(v) => setPaymentForm(f => ({ ...f, student_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Mensalidade Março 2026"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={paymentForm.due_date}
                  onChange={(e) => setPaymentForm(f => ({ ...f, due_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Forma de Pagamento</Label>
                <Select
                  value={paymentForm.payment_method}
                  onValueChange={(v) => setPaymentForm(f => ({ ...f, payment_method: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mês Referência</Label>
                <Input
                  type="month"
                  value={paymentForm.reference_month}
                  onChange={(e) => setPaymentForm(f => ({ ...f, reference_month: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreatePayment}
              disabled={isSavingPayment || !paymentForm.amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSavingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Criar Cobrança
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Marcar como Recebido ─────────────────────────────────────── */}
      <Dialog open={!!markPaidTarget} onOpenChange={(o) => !o && setMarkPaidTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
            <DialogDescription>
              {markPaidTarget && `R$ ${fmt(markPaidTarget.amount)} — ${markPaidTarget.student_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Forma de Pagamento</Label>
            <Select value={markPaidMethod} onValueChange={setMarkPaidMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidTarget(null)}>Cancelar</Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isMarkingPaid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isMarkingPaid ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Despesa ──────────────────────────────────────────────────── */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Atualize os dados da despesa." : "Registre um custo do seu estúdio."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Aluguel do Estúdio"
                value={expenseForm.description}
                onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={expenseForm.category} onValueChange={v => setExpenseForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vencimento *</Label>
                <Input
                  type="date"
                  value={expenseForm.due_date}
                  onChange={e => setExpenseForm(f => ({ ...f, due_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={expenseForm.status} onValueChange={v => setExpenseForm(f => ({ ...f, status: v as ExpenseFormStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                placeholder="Detalhes adicionais (opcional)"
                value={expenseForm.notes}
                onChange={e => setExpenseForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {/* Recorrência */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Despesa Recorrente</p>
                    <p className="text-[11px] text-slate-500">Gera automaticamente a próxima ao ser paga</p>
                  </div>
                </div>
                <Switch
                  checked={expenseForm.is_recurring}
                  onCheckedChange={v => setExpenseForm(f => ({ ...f, is_recurring: v }))}
                />
              </div>
              {expenseForm.is_recurring && (
                <div className="mt-3 space-y-1">
                  <Label>Frequência</Label>
                  <Select value={expenseForm.recurrence_period} onValueChange={v => setExpenseForm(f => ({ ...f, recurrence_period: v }))}>
                    <SelectTrigger className="bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveExpense}
              disabled={isSavingExpense}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isSavingExpense ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingExpense ? "Salvar Alterações" : "Cadastrar Despesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ModuleGuard>
  )
}
