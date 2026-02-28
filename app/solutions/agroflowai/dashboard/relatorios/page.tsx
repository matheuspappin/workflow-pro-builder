"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3, FileText, Download, TrendingUp, TrendingDown,
  Satellite, Users, ClipboardList, Calendar, Filter,
  CheckCircle2, AlertTriangle, Globe, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiData {
  osConcluidas: number
  osAbertas: number
  laudosEmitidos: number
  laudosTotal: number
  clientesAtivos: number
  receitaTotal: number
  alertasSatelite: number
}

interface ComplianceItem {
  property: string
  issue: string
  severity: "critical" | "warning"
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState("")
  const [kpis, setKpis] = useState<KpiData>({
    osConcluidas: 0,
    osAbertas: 0,
    laudosEmitidos: 0,
    laudosTotal: 0,
    clientesAtivos: 0,
    receitaTotal: 0,
    alertasSatelite: 0,
  })
  const [carStatus, setCarStatus] = useState({ regularizado: 0, em_processo: 0, pendente: 0, total: 0 })
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceItem[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const stored = localStorage.getItem("workflow_user")
        if (!stored) return
        const parsed = JSON.parse(stored)
        const sid = parsed.studioId || parsed.studio_id
        if (!sid) return
        setStudioId(sid)

        const [osRes, laudosRes, clientesRes, finRes, propsRes] = await Promise.all([
          fetch(`/api/agroflowai/os?studioId=${sid}`).then(r => r.json()).catch(() => []),
          fetch(`/api/agroflowai/laudos?studioId=${sid}`).then(r => r.json()).catch(() => []),
          fetch(`/api/agroflowai/clientes?studioId=${sid}`).then(r => r.json()).catch(() => []),
          fetch(`/api/agroflowai/financeiro?studioId=${sid}`).then(r => r.json()).catch(() => ({})),
          fetch(`/api/agroflowai/propriedades?studioId=${sid}`).then(r => r.json()).catch(() => []),
        ])

        const osList = Array.isArray(osRes) ? osRes : []
        const laudosList = Array.isArray(laudosRes) ? laudosRes : []
        const clientesList = Array.isArray(clientesRes) ? clientesRes : []
        const propsList = Array.isArray(propsRes) ? propsRes : []

        setKpis({
          osConcluidas: osList.filter((o: any) => o.status === 'completed' || o.status === 'finished').length,
          osAbertas: osList.filter((o: any) => ['pending', 'in_progress'].includes(o.status)).length,
          laudosEmitidos: laudosList.filter((l: any) => l.status === 'issued').length,
          laudosTotal: laudosList.length,
          clientesAtivos: clientesList.length,
          receitaTotal: finRes?.kpis?.receita_total || 0,
          alertasSatelite: 0,
        })

        const regularizado = propsList.filter((p: any) => p.car_status === 'regularizado').length
        const em_processo = propsList.filter((p: any) => p.car_status === 'em_processo').length
        const pendente = propsList.filter((p: any) => p.car_status === 'pendente' || p.car_status === 'irregular').length
        setCarStatus({ regularizado, em_processo, pendente, total: propsList.length })

        // Gerar alertas de compliance baseados em propriedades com CAR pendente/irregular
        const alerts: ComplianceItem[] = propsList
          .filter((p: any) => p.car_status === 'irregular' || p.car_status === 'pendente')
          .slice(0, 5)
          .map((p: any) => ({
            property: p.name,
            issue: p.car_status === 'irregular' ? 'Situação irregular — requer ação imediata' : 'CAR pendente de regularização',
            severity: p.car_status === 'irregular' ? 'critical' : 'warning',
          }))
        setComplianceAlerts(alerts)
      } catch {
        // mantém estado vazio em caso de erro
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const kpiCards = [
    { label: "OS Concluídas", value: kpis.osConcluidas, icon: ClipboardList, color: "text-emerald-400" },
    { label: "OS em Aberto",  value: kpis.osAbertas,    icon: ClipboardList, color: "text-amber-400" },
    { label: "Laudos Emitidos", value: kpis.laudosEmitidos, icon: FileText, color: "text-teal-400" },
    { label: "Laudos Total",  value: kpis.laudosTotal,  icon: FileText,     color: "text-violet-400" },
    { label: "Clientes Ativos", value: kpis.clientesAtivos, icon: Users,   color: "text-blue-400" },
    { label: "Receita (R$)",  value: `R$ ${kpis.receitaTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-pink-400", isString: true },
  ]

  const REPORTS = [
    {
      id: "os", title: "Relatório de Ordens de Serviço",
      description: `${kpis.osConcluidas} OS concluídas · ${kpis.osAbertas} em aberto`,
      type: "Operacional", icon: ClipboardList, color: "text-emerald-400", bg: "bg-emerald-400/10",
    },
    {
      id: "compliance", title: "Relatório de Compliance CAR",
      description: `${carStatus.regularizado} propriedades regularizadas de ${carStatus.total} no total`,
      type: "Ambiental", icon: FileText, color: "text-teal-400", bg: "bg-teal-400/10",
    },
    {
      id: "laudos", title: "Relatório de Laudos Técnicos",
      description: `${kpis.laudosEmitidos} laudos emitidos de ${kpis.laudosTotal} criados`,
      type: "Técnico", icon: FileText, color: "text-violet-400", bg: "bg-violet-400/10",
    },
    {
      id: "financeiro", title: "Relatório Financeiro",
      description: `Receita total: R$ ${kpis.receitaTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
      type: "Financeiro", icon: TrendingUp, color: "text-pink-400", bg: "bg-pink-400/10",
    },
    {
      id: "equipe", title: "Relatório de Equipe",
      description: "Engenheiros e técnicos — produtividade e OS atribuídas",
      type: "RH", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10",
    },
    {
      id: "satelite", title: "Relatório Satelital — NDVI",
      description: "Monitoramento de vegetação e alertas de desmatamento",
      type: "Satelital", icon: Satellite, color: "text-indigo-400", bg: "bg-indigo-400/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Relatórios & CAR</h1>
          <p className="text-slate-400 mt-1">Relatórios operacionais, ambientais e de compliance</p>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map(kpi => {
            const Icon = kpi.icon
            return (
              <Card key={kpi.label} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", `${kpi.color.replace('text-', 'bg-')}/10`)}>
                    <Icon className={cn("w-4 h-4", kpi.color)} />
                  </div>
                  <p className="text-xl font-black text-white">
                    {kpi.isString ? kpi.value : (typeof kpi.value === 'number' ? kpi.value : 0)}
                  </p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{kpi.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Compliance Status */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Painel de Compliance Ambiental
          </CardTitle>
          <CardDescription className="text-slate-500">Status de regularização das propriedades cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Regularizadas", value: carStatus.regularizado, color: "bg-emerald-500" },
              { label: "Em Processo", value: carStatus.em_processo, color: "bg-blue-500" },
              { label: "Pendentes/Irregulares", value: carStatus.pendente, color: "bg-amber-500" },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-2xl font-black text-white">
                  {item.value}
                  <span className="text-sm text-slate-500 font-normal">/{carStatus.total || 1}</span>
                </p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">{item.label}</p>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                  <div
                    className={cn("h-2 rounded-full transition-all", item.color)}
                    style={{ width: `${carStatus.total > 0 ? (item.value / carStatus.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {complianceAlerts.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Alertas Ativos de Compliance</p>
              <div className="space-y-2">
                {complianceAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl",
                      alert.severity === "critical"
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-amber-500/10 border border-amber-500/20"
                    )}
                  >
                    <AlertTriangle className={cn("w-4 h-4 flex-shrink-0", alert.severity === "critical" ? "text-red-400" : "text-amber-400")} />
                    <div>
                      <p className="text-sm font-bold text-white">{alert.property}</p>
                      <p className="text-xs text-slate-400">{alert.issue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {complianceAlerts.length === 0 && carStatus.total > 0 && (
            <div className="pt-4 border-t border-slate-800 flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-sm font-bold text-emerald-300">Todas as propriedades estão regularizadas ou em processo!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      <div>
        <h2 className="text-lg font-black text-white mb-4">Relatórios do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORTS.map(report => {
            const Icon = report.icon
            return (
              <Card key={report.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", report.bg)}>
                      <Icon className={cn("w-5 h-5", report.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-white text-sm">{report.title}</p>
                        <Badge className="text-[10px] font-bold border-0 text-slate-400 bg-slate-700 flex-shrink-0">
                          {report.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{report.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                    onClick={() => {}}
                  >
                    <Download className="w-3.5 h-3.5 mr-2" />
                    Exportar Relatório
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
