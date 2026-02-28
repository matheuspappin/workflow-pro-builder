"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, TrendingUp, Users, DollarSign, Calendar, FileText } from "lucide-react"

const REPORTS = [
  { icon: Users,      title: "Frequência por Aluno",    desc: "Relatório completo de presença por aluno e turma.", color: "text-violet-600 bg-violet-100 dark:bg-violet-600/20" },
  { icon: DollarSign, title: "Financeiro Mensal",        desc: "Resumo de recebimentos, inadimplência e projeções.", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-600/20" },
  { icon: TrendingUp, title: "Captação de Alunos",       desc: "Matrículas, desistências e taxa de retenção.",       color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-600/20" },
  { icon: Calendar,   title: "Turmas e Ocupação",        desc: "Lotação das turmas e horários mais procurados.",     color: "text-pink-600 bg-pink-100 dark:bg-pink-600/20" },
  { icon: FileText,   title: "Declaração de Matrícula",  desc: "Gere declarações individuais para os responsáveis.", color: "text-amber-600 bg-amber-100 dark:bg-amber-600/20" },
  { icon: BarChart3,  title: "Desempenho Geral",         desc: "Visão consolidada do estúdio por período.",          color: "text-teal-600 bg-teal-100 dark:bg-teal-600/20" },
]

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-500" />
            Relatórios
          </h1>
          <p className="text-slate-500 text-sm mt-1">Análises e relatórios do estúdio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <Card key={r.title} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${r.color}`}>
                <r.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{r.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{r.desc}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-xl font-bold text-xs border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
