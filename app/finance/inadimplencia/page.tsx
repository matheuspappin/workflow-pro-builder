"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mockInadimplentes = [
  { id: "1", cliente: "Condomínio Residencial Alegre", valor: 3600, diasAtraso: 15, ultimoContato: "10/02/2026" },
  { id: "2", cliente: "Escola Municipal Primeiro Passo", valor: 1800, diasAtraso: 24, ultimoContato: "05/02/2026" },
  { id: "3", cliente: "Empresa Logística Norte", valor: 4200, diasAtraso: 8, ultimoContato: "18/02/2026" },
]

export default function InadimplenciaPage() {
  const total = mockInadimplentes.reduce((s, i) => s + i.valor, 0)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Inadimplência
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Clientes com pagamentos em atraso
          </p>
        </div>
        <Button variant="outline" className="font-bold">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      <Card className={cn("border-l-4 border-l-amber-600 bg-white dark:bg-slate-900/50 shadow-sm")}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-amber-600">
                R$ {total.toLocaleString("pt-BR")}
              </p>
              <p className="text-sm font-bold text-slate-500">Total em atraso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {mockInadimplentes.map((item) => (
          <Card key={item.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-600/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{item.cliente}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {item.diasAtraso} dias em atraso • Último contato: {item.ultimoContato}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-black text-amber-600">
                  R$ {item.valor.toLocaleString("pt-BR")}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Phone className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm"><Mail className="w-4 h-4" /></Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Registrar pagamento</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
