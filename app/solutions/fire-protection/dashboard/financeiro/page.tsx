"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  MoreHorizontal,
  Eye,
  Pencil,
  Download,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const mockLancamentos = [
  {
    id: "FIN-001",
    descricao: "Recarga de 24 extintores — Cond. Alegre",
    cliente: "Condomínio Residencial Alegre",
    valor: 3600,
    tipo: "receita",
    status: "recebido",
    vencimento: "15/02/2026",
    pagamento: "15/02/2026",
  },
  {
    id: "FIN-002",
    descricao: "Vistoria anual AVCB — Hospital São Lucas",
    cliente: "Hospital São Lucas",
    valor: 8200,
    tipo: "receita",
    status: "pendente",
    vencimento: "28/02/2026",
    pagamento: null,
  },
  {
    id: "FIN-003",
    descricao: "Manutenção preventiva — Shopping Centervale",
    cliente: "Shopping Centervale",
    valor: 5400,
    tipo: "receita",
    status: "recebido",
    vencimento: "20/02/2026",
    pagamento: "20/02/2026",
  },
  {
    id: "FIN-004",
    descricao: "Compra de agentes extintores (PQS 4kg x 50)",
    cliente: "Fornecedor Alfa",
    valor: 2100,
    tipo: "despesa",
    status: "pago",
    vencimento: "10/02/2026",
    pagamento: "10/02/2026",
  },
  {
    id: "FIN-005",
    descricao: "Instalação detectores — Escola Primeiro Passo",
    cliente: "Escola Municipal Primeiro Passo",
    valor: 1800,
    tipo: "receita",
    status: "vencido",
    vencimento: "01/02/2026",
    pagamento: null,
  },
  {
    id: "FIN-006",
    descricao: "Salários técnicos — Fev/2026",
    cliente: "Folha de pagamento",
    valor: 9600,
    tipo: "despesa",
    status: "pago",
    vencimento: "05/02/2026",
    pagamento: "05/02/2026",
  },
]

const statusMap = {
  recebido: { label: "Recebido", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
  vencido: { label: "Vencido", className: "bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400" },
  pago: { label: "Pago", className: "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400" },
}

function NovoLancamentoDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Novo Lançamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            Novo Lançamento Financeiro
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input placeholder="0,00" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Input placeholder="Ex.: Recarga de extintores" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Cliente / Fornecedor</Label>
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Condomínio Residencial Alegre</SelectItem>
                  <SelectItem value="2">Hospital São Lucas</SelectItem>
                  <SelectItem value="3">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vencimento</Label>
              <Input type="date" className="mt-1" />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Forma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => setOpen(false)}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function FinanceiroPage() {
  const [filtro, setFiltro] = useState("todos")

  const receitas = mockLancamentos.filter(l => l.tipo === "receita")
  const despesas = mockLancamentos.filter(l => l.tipo === "despesa")
  const totalReceitas = receitas.reduce((a, l) => a + l.valor, 0)
  const totalDespesas = despesas.reduce((a, l) => a + l.valor, 0)
  const saldo = totalReceitas - totalDespesas
  const pendentes = receitas.filter(l => l.status === "pendente" || l.status === "vencido").reduce((a, l) => a + l.valor, 0)

  const filtered = mockLancamentos.filter((l) => {
    if (filtro === "todos") return true
    if (filtro === "receitas") return l.tipo === "receita"
    if (filtro === "despesas") return l.tipo === "despesa"
    if (filtro === "pendentes") return l.status === "pendente" || l.status === "vencido"
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-red-600" />
            Financeiro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Fevereiro 2026
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <NovoLancamentoDialog />
        </div>
      </div>

      {/* Cards KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Receitas",
            value: `R$ ${totalReceitas.toLocaleString("pt-BR")}`,
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
            label: "A Receber",
            value: `R$ ${pendentes.toLocaleString("pt-BR")}`,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-600/10",
            border: "border-l-amber-600",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className={cn("border-l-4 bg-white dark:bg-slate-900/50 shadow-sm", kpi.border)}>
            <CardContent className="p-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", kpi.bg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <p className={cn("text-2xl font-black", kpi.color)}>{kpi.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {["todos", "receitas", "despesas", "pendentes"].map((f) => (
          <Button
            key={f}
            variant={filtro === f ? "default" : "outline"}
            size="sm"
            className={cn(filtro === f && "bg-red-600 hover:bg-red-700 border-red-600")}
            onClick={() => setFiltro(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Descrição</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hidden md:table-cell">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Valor</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:table-cell">Vencimento</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => {
              const st = statusMap[l.status as keyof typeof statusMap]
              return (
                <tr key={l.id} className={cn("border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors", i === filtered.length - 1 && "border-0")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        l.tipo === "receita" ? "bg-emerald-500" : "bg-red-500"
                      )} />
                      <span className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{l.descricao}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />{l.cliente}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("font-black text-sm", l.tipo === "receita" ? "text-emerald-600" : "text-red-600")}>
                      {l.tipo === "despesa" ? "−" : "+"} R$ {l.valor.toLocaleString("pt-BR")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">{l.vencimento}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs font-bold border-0", st.className)}>{st.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />Ver</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem><CheckCircle className="w-4 h-4 mr-2" />Marcar como pago</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
