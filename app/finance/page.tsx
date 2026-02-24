"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Download,
} from "lucide-react"
import { useOrganization } from "@/components/providers/organization-provider"
import { supabase } from "@/lib/supabase"
import { getDashboardStats, getExpenses } from "@/lib/database-utils"
import { cn } from "@/lib/utils"

export default function FinanceDashboardPage() {
  const { studioId } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [businessModel, setBusinessModel] = useState<'CREDIT' | 'MONETARY'>('CREDIT')

  useEffect(() => {
    const load = async () => {
      const userStr = localStorage.getItem("danceflow_user")
      const studio = userStr ? JSON.parse(userStr)?.studio_id || studioId : studioId
      if (!studio) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data: studioData } = await supabase
          .from('studios')
          .select('business_model')
          .eq('id', studio)
          .single()
        
        if (studioData) setBusinessModel(studioData.business_model as any || 'CREDIT')

        const s = await getDashboardStats()
        const exp = await getExpenses()
        setStats(s)
        setExpenses(exp || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studioId])

  const totalDespesas = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const totalReceita = stats?.totalRevenue || 0
  const inadimplencia = stats?.inadimplencia || 0
  const saldo = totalReceita - totalDespesas

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const kpis = [
    {
      label: "Receitas",
      value: `R$ ${(totalReceita || 0).toLocaleString("pt-BR")}`,
      icon: ArrowUpRight,
      color: "text-emerald-600",
      bg: "bg-emerald-600/10",
      border: "border-l-emerald-600",
    },
    {
      label: "Despesas",
      value: `R$ ${totalDespesas.toLocaleString("pt-BR")}`,
      icon: ArrowDownRight,
      color: "text-red-600",
      bg: "bg-red-600/10",
      border: "border-l-red-600",
    },
    {
      label: "Saldo",
      value: `R$ ${saldo.toLocaleString("pt-BR")}`,
      icon: saldo >= 0 ? TrendingUp : TrendingDown,
      color: saldo >= 0 ? "text-blue-600" : "text-red-600",
      bg: saldo >= 0 ? "bg-blue-600/10" : "bg-red-600/10",
      border: saldo >= 0 ? "border-l-blue-600" : "border-l-red-600",
    },
    {
      label: "Inadimplência",
      value: `R$ ${(inadimplencia || 0).toLocaleString("pt-BR")}`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-600/10",
      border: "border-l-amber-600",
    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Portal Financeiro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Visão geral e indicadores financeiros
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className={cn("border-l-4 bg-white dark:bg-slate-900/50 shadow-sm", kpi.border)}
          >
            <CardContent className="p-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", kpi.bg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <p className={cn("text-2xl font-black", kpi.color)}>{kpi.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">
                {kpi.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Bem-vindo ao Portal Financeiro
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Use o menu lateral para acessar <strong>Lançamentos</strong>, <strong>Inadimplência</strong> e{" "}
            <strong>Relatórios</strong>. Você tem acesso apenas às funções financeiras, sem visibilidade
            sobre configurações gerais ou outros módulos do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
