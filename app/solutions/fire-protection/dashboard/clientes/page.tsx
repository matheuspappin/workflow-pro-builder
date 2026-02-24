"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Filter,
  FireExtinguisher,
  ClipboardList,
  Calendar,
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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const mockClientes = [
  {
    id: "1",
    nome: "Condomínio Residencial Alegre",
    cnpj: "12.345.678/0001-90",
    endereco: "Av. Brasil, 1200 — Centro",
    cidade: "São Paulo, SP",
    contato: "João Silva",
    telefone: "(11) 99999-0001",
    email: "joao@condalegre.com.br",
    status: "ativo",
    totalExtintores: 24,
    proximaVistoria: "15/03/2026",
    osAbertas: 2,
  },
  {
    id: "2",
    nome: "Shopping Centervale",
    cnpj: "98.765.432/0001-10",
    endereco: "Rua das Flores, 500 — Jardim",
    cidade: "Campinas, SP",
    contato: "Maria Oliveira",
    telefone: "(19) 98888-0002",
    email: "maria@centervale.com.br",
    status: "ativo",
    totalExtintores: 120,
    proximaVistoria: "20/02/2026",
    osAbertas: 0,
  },
  {
    id: "3",
    nome: "Hospital São Lucas",
    cnpj: "11.222.333/0001-44",
    endereco: "Rua da Saúde, 300 — Vila Nova",
    cidade: "Guarulhos, SP",
    contato: "Dr. Carlos Menezes",
    telefone: "(11) 97777-0003",
    email: "carlos@hospitalslucas.com.br",
    status: "vencido",
    totalExtintores: 56,
    proximaVistoria: "01/01/2026",
    osAbertas: 3,
  },
  {
    id: "4",
    nome: "Escola Municipal Primeiro Passo",
    cnpj: "55.666.777/0001-88",
    endereco: "Rua da Educação, 80 — Bairro Novo",
    cidade: "São Bernardo, SP",
    contato: "Diretora Ana Costa",
    telefone: "(11) 96666-0004",
    email: "ana@escolaprimeiropasso.edu.br",
    status: "pendente",
    totalExtintores: 18,
    proximaVistoria: "10/04/2026",
    osAbertas: 1,
  },
]

const statusMap = {
  ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  vencido: { label: "Vencido", className: "bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400" },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
}

function NovoClienteDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-600" />
            Cadastrar Cliente / Edificação
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Razão Social / Nome</Label>
              <Input placeholder="Ex.: Condomínio Residencial Alegre" className="mt-1" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input placeholder="00.000.000/0001-00" className="mt-1" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>E-mail</Label>
              <Input placeholder="contato@empresa.com.br" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Endereço</Label>
              <Input placeholder="Rua, número, bairro" className="mt-1" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input placeholder="São Paulo" className="mt-1" />
            </div>
            <div>
              <Label>UF</Label>
              <Input placeholder="SP" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Nome do Responsável</Label>
              <Input placeholder="Nome completo" className="mt-1" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => setOpen(false)}>
            Salvar Cliente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ClientesPage() {
  const [search, setSearch] = useState("")
  const [filtro, setFiltro] = useState<string>("todos")

  const filtered = mockClientes.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj.includes(search) ||
      c.cidade.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === "todos" || c.status === filtro
    return matchSearch && matchFiltro
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-red-600" />
            Clientes / Edificações
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {mockClientes.length} edificações cadastradas
          </p>
        </div>
        <NovoClienteDialog />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CNPJ ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["todos", "ativo", "pendente", "vencido"].map((f) => (
            <Button
              key={f}
              variant={filtro === f ? "default" : "outline"}
              size="sm"
              className={cn(filtro === f && "bg-red-600 hover:bg-red-700 border-red-600")}
              onClick={() => setFiltro(f)}
            >
              {f === "todos" ? "Todos" : statusMap[f as keyof typeof statusMap]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((cliente) => {
          const st = statusMap[cliente.status as keyof typeof statusMap]
          return (
            <Card key={cliente.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                        {cliente.nome}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{cliente.cnpj}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs font-bold border-0", st.className)}>
                      {st.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{cliente.endereco} — {cliente.cidade}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{cliente.contato} · {cliente.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{cliente.email}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <FireExtinguisher className="w-3 h-3" />
                    </div>
                    <p className="text-base font-black text-slate-900 dark:text-white">{cliente.totalExtintores}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Extintores</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <ClipboardList className="w-3 h-3" />
                    </div>
                    <p className={cn("text-base font-black", cliente.osAbertas > 0 ? "text-red-600" : "text-slate-900 dark:text-white")}>
                      {cliente.osAbertas}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">OS Abertas</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <Calendar className="w-3 h-3" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{cliente.proximaVistoria}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Próx. Vistoria</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhum cliente encontrado</p>
        </div>
      )}
    </div>
  )
}
