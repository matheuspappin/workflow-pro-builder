"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign, TrendingUp, TrendingDown, Plus, FileText,
  CheckCircle2, Clock, AlertTriangle, ChevronRight, X, Loader2,
  CreditCard, BarChart3,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type TransactionType = 'receita' | 'despesa'
type TransactionStatus = 'paid' | 'pending' | 'overdue'

interface Transaction {
  id: string
  description: string
  client?: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  due_date: string
  category: string
}

const statusConfig: Record<TransactionStatus, { label: string; color: string; bg: string }> = {
  paid: { label: "Pago", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  pending: { label: "Pendente", color: "text-amber-400", bg: "bg-amber-400/10" },
  overdue: { label: "Vencido", color: "text-red-400", bg: "bg-red-400/10" },
}

interface ApiLancamento {
  id: string
  descricao: string
  cliente: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  status: string
  vencimento: string
  pagamento: string | null
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [kpis, setKpis] = useState({ receita_total: 0, receita_recebida: 0, receita_pendente: 0, despesas_total: 0, lucro: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | TransactionType>("all")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState({
    description: "",
    client: "",
    amount: "",
    type: "receita" as TransactionType,
    due_date: "",
    category: "",
  })

  const getStudioId = () => {
    try { return JSON.parse(localStorage.getItem("workflow_user") || "{}").studioId || "" } catch { return "" }
  }

  useEffect(() => {
    const studioId = getStudioId()
    if (!studioId) { setLoading(false); return }
    fetch(`/api/agroflowai/financeiro?studioId=${studioId}`)
      .then(r => r.json())
      .then(data => {
        const lcs: ApiLancamento[] = Array.isArray(data) ? data : (data.lancamentos || [])
        const mapped: Transaction[] = lcs.map((l) => ({
          id: l.id,
          description: l.descricao,
          client: l.cliente || undefined,
          amount: l.valor,
          type: l.tipo,
          status: l.status === 'recebido' ? 'paid' : l.status === 'vencido' ? 'overdue' : 'pending',
          due_date: l.vencimento,
          category: l.categoria || 'Serviço',
        }))
        setTransactions(mapped)
        if (data.kpis) setKpis(data.kpis)
        else {
          const rec = mapped.filter(t => t.type === 'receita')
          setKpis({
            receita_total: rec.reduce((a, t) => a + t.amount, 0),
            receita_recebida: rec.filter(t => t.status === 'paid').reduce((a, t) => a + t.amount, 0),
            receita_pendente: rec.filter(t => t.status !== 'paid').reduce((a, t) => a + t.amount, 0),
            despesas_total: 0,
            lucro: rec.filter(t => t.status === 'paid').reduce((a, t) => a + t.amount, 0),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const receitas = transactions.filter(t => t.type === "receita")
  const despesas = transactions.filter(t => t.type === "despesa")
  const totalReceitas = kpis.receita_recebida || receitas.reduce((a, t) => a + (t.status === "paid" ? t.amount : 0), 0)
  const totalPendente = kpis.receita_pendente || receitas.filter(t => t.status === "pending" || t.status === "overdue").reduce((a, t) => a + t.amount, 0)
  const totalDespesas = kpis.despesas_total || despesas.reduce((a, t) => a + (t.status === "paid" ? t.amount : 0), 0)
  const saldo = kpis.lucro || (totalReceitas - totalDespesas)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description || !form.amount) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const studioId = getStudioId()
      const res = await fetch("/api/agroflowai/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, descricao: form.description, cliente: form.client, valor: Number(form.amount), tipo: form.type, categoria: form.category, vencimento: form.due_date }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar")
      const newT: Transaction = {
        id: data.id,
        description: form.description,
        client: form.client || undefined,
        amount: Number(form.amount),
        type: form.type,
        status: "pending",
        due_date: form.due_date ? new Date(form.due_date).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR"),
        category: form.category || "Outros",
      }
      setTransactions(prev => [newT, ...prev])
      toast({ title: "Lançamento adicionado!" })
      setShowForm(false)
      setForm({ description: "", client: "", amount: "", type: "receita", due_date: "", category: "" })
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const filtered = transactions.filter(t => filter === "all" || t.type === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Financeiro</h1>
          <p className="text-slate-400 mt-1">Controle de receitas, despesas e cobranças da consultoria</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Receita Confirmada", value: formatBRL(totalReceitas), color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-l-emerald-400" },
          { icon: Clock, label: "A Receber", value: formatBRL(totalPendente), color: "text-amber-400", bg: "bg-amber-400/10", border: "border-l-amber-400" },
          { icon: TrendingDown, label: "Despesas", value: formatBRL(totalDespesas), color: "text-red-400", bg: "bg-red-400/10", border: "border-l-red-400" },
          { icon: DollarSign, label: "Saldo do Mês", value: formatBRL(saldo), color: saldo >= 0 ? "text-emerald-400" : "text-red-400", bg: saldo >= 0 ? "bg-emerald-400/10" : "bg-red-400/10", border: saldo >= 0 ? "border-l-emerald-400" : "border-l-red-400" },
        ].map(k => (
          <Card key={k.label} className={cn("bg-slate-900/50 border-l-4 border-slate-800", k.border)}>
            <CardContent className="p-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", k.bg)}>
                <k.icon className={cn("w-5 h-5", k.color)} />
              </div>
              <p className={cn("text-2xl font-black", k.color)}>{k.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart placeholder */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Receitas por Categoria — Fevereiro 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { cat: "Laudos", value: 3500, pct: 30 },
              { cat: "Regularização", value: 8200, pct: 70 },
              { cat: "Vistorias", value: 2800, pct: 24 },
              { cat: "Assinatura", value: 1200, pct: 10 },
              { cat: "Licenciamento", value: 5600, pct: 48 },
            ].map(item => (
              <div key={item.cat} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold">{item.cat}</span>
                  <span className="text-emerald-400 font-black">{formatBRL(item.value)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Novo Lançamento
              </CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex gap-2">
                  {(["receita", "despesa"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest border transition-all",
                        form.type === t
                          ? t === "receita" ? "border-emerald-500 bg-emerald-600/20 text-emerald-400" : "border-red-500 bg-red-600/20 text-red-400"
                          : "border-slate-700 bg-slate-800 text-slate-500"
                      )}
                    >
                      {t === "receita" ? "Receita" : "Despesa"}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descrição *</label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Ex: Laudo CAR - Fazenda..."
                    required
                    className="bg-slate-800 border-slate-700 text-white rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor (R$) *</label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0,00"
                      required
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data Vencimento</label>
                    <Input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {form.type === "receita" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cliente</label>
                      <Input
                        value={form.client}
                        onChange={(e) => setForm({ ...form, client: e.target.value })}
                        placeholder="Nome do cliente"
                        className="bg-slate-800 border-slate-700 text-white rounded-xl"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categoria</label>
                    <Input
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Ex: Laudos, Software..."
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-slate-700 text-slate-400">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {([
          { key: "all", label: `Todos (${transactions.length})` },
          { key: "receita", label: `Receitas (${receitas.length})` },
          { key: "despesa", label: `Despesas (${despesas.length})` },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              filter === f.key
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filtered.map(t => {
          const st = statusConfig[t.status]
          return (
            <Card key={t.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    t.type === "receita" ? "bg-emerald-600/20" : "bg-red-600/20"
                  )}>
                    {t.type === "receita"
                      ? <TrendingUp className={cn("w-5 h-5", t.type === "receita" ? "text-emerald-400" : "text-red-400")} />
                      : <TrendingDown className="w-5 h-5 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{t.description}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                      {t.client && <span>{t.client}</span>}
                      <span>Venc: {t.due_date}</span>
                      <span className="text-slate-600">·</span>
                      <span>{t.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge className={cn("text-[10px] font-bold border-0 hidden sm:flex", st.color, st.bg)}>{st.label}</Badge>
                    <p className={cn("text-lg font-black", t.type === "receita" ? "text-emerald-400" : "text-red-400")}>
                      {t.type === "despesa" ? "-" : "+"}{formatBRL(t.amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
