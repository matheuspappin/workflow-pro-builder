"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const statusMap: Record<string, { label: string; className: string; icon: any }> = {
  paid:    { label: "Pago",    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400", icon: CheckCircle2 },
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400",   icon: Clock },
  overdue: { label: "Vencido", className: "bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:text-rose-400",         icon: AlertCircle },
}

export default function FinanceiroPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ recebido: 0, pendente: 0, vencido: 0 })
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null

      if (sid) {
        try {
          const res = await fetch(`/api/fire-protection/financeiro?studioId=${sid}`)
          const data = await res.json()
          if (Array.isArray(data)) {
            setPayments(data)
            setStats({
              recebido: data.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
              pendente: data.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
              vencido:  data.filter((p: any) => p.status === 'overdue').reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
            })
          }
        } catch {
          // Sem dados de financeiro ainda
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            Financeiro
          </h1>
          <p className="text-slate-500 text-sm mt-1">Mensalidades, cobranças e pagamentos</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Nova Cobrança
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recebido</p>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-emerald-600">R$ {fmt(stats.recebido)}</p>
            <p className="text-xs text-slate-400 mt-1">Este mês</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 bg-white dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendente</p>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-amber-600">R$ {fmt(stats.pendente)}</p>
            <p className="text-xs text-slate-400 mt-1">A receber</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500 bg-white dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Vencido</p>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-3xl font-black text-rose-600">R$ {fmt(stats.vencido)}</p>
            <p className="text-xs text-slate-400 mt-1">Em atraso</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pagamentos */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white text-base font-bold">Lançamentos Recentes</CardTitle>
          <CardDescription>Histórico de cobranças e pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhum lançamento encontrado</p>
              <p className="text-sm mt-1">Crie sua primeira cobrança de mensalidade.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p, i) => {
                const st = statusMap[p.status] ?? statusMap.pending
                const StatusIcon = st.icon
                return (
                  <div key={p.id ?? i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-600/20 flex items-center justify-center font-black text-emerald-600 text-sm flex-shrink-0">
                        {p.student_name?.[0]?.toUpperCase() || "A"}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{p.student_name || "Aluno"}</p>
                        <p className="text-xs text-slate-500">{p.description || "Mensalidade"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="font-black text-slate-900 dark:text-white">R$ {fmt(Number(p.amount || 0))}</p>
                      <Badge className={cn("text-xs border-0 font-bold flex items-center gap-1", st.className)}>
                        <StatusIcon className="w-3 h-3" />
                        {st.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
