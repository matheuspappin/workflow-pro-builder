"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const mockData = [
  { mes: "Ago", receita: 42000, despesa: 31000 },
  { mes: "Set", receita: 48000, despesa: 32000 },
  { mes: "Out", receita: 52000, despesa: 35000 },
  { mes: "Nov", receita: 45000, despesa: 33000 },
  { mes: "Dez", receita: 61000, despesa: 38000 },
  { mes: "Jan", receita: 58000, despesa: 36000 },
  { mes: "Fev", receita: 55000, despesa: 34000 },
]

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState("7meses")

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Relatórios
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Análise e histórico financeiro
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7meses">Últimos 7 meses</SelectItem>
              <SelectItem value="12meses">Últimos 12 meses</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="font-bold">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Receita x Despesa
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `R$ ${(v/1000)}k`} />
                <Line type="monotone" dataKey="receita" stroke="#059669" strokeWidth={2} name="Receita" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="despesa" stroke="#dc2626" strokeWidth={2} name="Despesa" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Relatórios disponíveis</h2>
            <ul className="space-y-2">
              {["Fluxo de caixa", "Demonstrativo de resultados", "Inadimplência por período", "Receitas por cliente"].map((r, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{r}</span>
                  <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Resumo do período</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Total receita:</span><span className="font-bold text-emerald-600">R$ 361.000</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total despesa:</span><span className="font-bold text-red-600">R$ 239.000</span></div>
              <div className="flex justify-between pt-2 border-t"><span className="text-slate-500">Saldo:</span><span className="font-black text-blue-600">R$ 122.000</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
