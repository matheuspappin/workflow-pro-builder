"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Building2,
  FireExtinguisher,
  ClipboardList,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Users,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const relatoriosDisponiveis = [
  {
    id: "1",
    titulo: "Extintores por Status",
    descricao: "Situação atual de todos os extintores cadastrados",
    icone: FireExtinguisher,
    color: "text-red-600",
    bg: "bg-red-600/10",
    badge: "Operacional",
    badgeClass: "bg-red-100 text-red-700",
    dados: [
      { label: "Em dia", valor: 38, pct: 63 },
      { label: "Vencendo (30d)", valor: 14, pct: 23 },
      { label: "Vencidos", valor: 8, pct: 14 },
    ],
  },
  {
    id: "2",
    titulo: "OS por Período",
    descricao: "Ordens de serviço abertas, concluídas e canceladas",
    icone: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-600/10",
    badge: "Operacional",
    badgeClass: "bg-blue-100 text-blue-700",
    dados: [
      { label: "Concluídas", valor: 42, pct: 70 },
      { label: "Em andamento", valor: 10, pct: 17 },
      { label: "Abertas", valor: 8, pct: 13 },
    ],
  },
  {
    id: "3",
    titulo: "Vistorias por Conformidade",
    descricao: "Taxa de conformidade nas vistorias realizadas",
    icone: Calendar,
    color: "text-purple-600",
    bg: "bg-purple-600/10",
    badge: "Qualidade",
    badgeClass: "bg-purple-100 text-purple-700",
    dados: [
      { label: "Conformes", valor: 28, pct: 82 },
      { label: "Não-conformes", valor: 6, pct: 18 },
    ],
  },
  {
    id: "4",
    titulo: "Faturamento Mensal",
    descricao: "Receitas e despesas dos últimos 6 meses",
    icone: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-600/10",
    badge: "Financeiro",
    badgeClass: "bg-emerald-100 text-emerald-700",
    dados: [
      { label: "Receitas", valor: 19000, pct: 66 },
      { label: "Despesas", valor: 11700, pct: 34 },
    ],
  },
  {
    id: "5",
    titulo: "Clientes Ativos vs. Inativos",
    descricao: "Situação dos contratos de clientes",
    icone: Building2,
    color: "text-orange-600",
    bg: "bg-orange-600/10",
    badge: "Comercial",
    badgeClass: "bg-orange-100 text-orange-700",
    dados: [
      { label: "Ativos", valor: 18, pct: 72 },
      { label: "Pendentes", valor: 5, pct: 20 },
      { label: "Inativos", valor: 2, pct: 8 },
    ],
  },
  {
    id: "6",
    titulo: "Performance de Técnicos",
    descricao: "OS concluídas e avaliação por técnico",
    icone: Users,
    color: "text-indigo-600",
    bg: "bg-indigo-600/10",
    badge: "Equipe",
    badgeClass: "bg-indigo-100 text-indigo-700",
    dados: [
      { label: "Paulo Mendes", valor: 210, pct: 46 },
      { label: "Ricardo Alves", valor: 142, pct: 31 },
      { label: "Fernanda Souza", valor: 87, pct: 19 },
      { label: "Juliana Castro", valor: 18, pct: 4 },
    ],
  },
]

const resumoKPIs = [
  { label: "Total de Clientes", valor: "25", icone: Building2, color: "text-orange-600", bg: "bg-orange-600/10", tendencia: "+3 este mês" },
  { label: "OS Concluídas", valor: "42", icone: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-600/10", tendencia: "+8 vs. mês anterior" },
  { label: "Taxa Conformidade", valor: "82%", icone: TrendingUp, color: "text-blue-600", bg: "bg-blue-600/10", tendencia: "+4% vs. mês anterior" },
  { label: "Faturamento", valor: "R$ 19k", icone: DollarSign, color: "text-red-600", bg: "bg-red-600/10", tendencia: "+12% vs. mês anterior" },
]

function BarRow({ label, valor, pct, financeiro }: { label: string; valor: number; pct: number; financeiro?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400 font-medium">{label}</span>
        <span className="font-black text-slate-900 dark:text-white">
          {financeiro ? `R$ ${valor.toLocaleString("pt-BR")}` : valor} <span className="text-slate-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState("mes_atual")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-600" />
            Relatórios
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Análise e indicadores do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Este mês</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="semestre">Último semestre</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="font-bold">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {resumoKPIs.map((kpi) => (
          <Card key={kpi.label} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
            <CardContent className="p-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", kpi.bg)}>
                <kpi.icone className={cn("w-5 h-5", kpi.color)} />
              </div>
              <p className={cn("text-3xl font-black", kpi.color)}>{kpi.valor}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">{kpi.label}</p>
              <p className="text-xs text-emerald-600 flex items-center gap-0.5 mt-1 font-medium">
                <ArrowUpRight className="w-3 h-3" />
                {kpi.tendencia}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Relatórios detalhados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatoriosDisponiveis.map((rel) => (
          <Card key={rel.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", rel.bg)}>
                    <rel.icone className={cn("w-5 h-5", rel.color)} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black">{rel.titulo}</CardTitle>
                    <CardDescription className="text-xs">{rel.descricao}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {rel.dados.map((d) => (
                <BarRow
                  key={d.label}
                  label={d.label}
                  valor={d.valor}
                  pct={d.pct}
                  financeiro={rel.badge === "Financeiro"}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Relatórios prontos para baixar */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            Relatórios para Download
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Laudo Geral — Fev/2026", sub: "PDF · 2,4 MB", icone: FileText },
              { label: "Extintores Vencidos", sub: "Excel · 185 KB", icone: AlertTriangle },
              { label: "DRE Mensal", sub: "PDF · 1,1 MB", icone: DollarSign },
            ].map((doc) => (
              <Button key={doc.label} variant="outline" className="h-auto p-4 flex-col items-start gap-2 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-600/5 transition-all">
                <doc.icone className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.label}</p>
                  <p className="text-xs text-slate-400">{doc.sub}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
