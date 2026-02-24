"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  TrendingUp,
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  MessageSquare,
  Calendar,
  ArrowRight,
  DollarSign,
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

const mockLeads = [
  {
    id: "L-001",
    nome: "Edificio Comercial Aurora",
    contato: "Roberto Lima",
    email: "roberto@aurora.com.br",
    telefone: "(11) 99100-0001",
    origem: "Site",
    etapa: "novo",
    valor: 3200,
    criado: "22/02/2026",
  },
  {
    id: "L-002",
    nome: "Colégio Estadual São Paulo",
    contato: "Diretora Cristina Souza",
    email: "cristina@colegiosp.edu.br",
    telefone: "(11) 99200-0002",
    origem: "Indicação",
    etapa: "qualificado",
    valor: 5800,
    criado: "20/02/2026",
  },
  {
    id: "L-003",
    nome: "Fábrica Metalúrgica Forte",
    contato: "Gerente Marcos Rocha",
    email: "marcos@forte.com.br",
    telefone: "(11) 99300-0003",
    origem: "WhatsApp",
    etapa: "proposta",
    valor: 12000,
    criado: "18/02/2026",
  },
  {
    id: "L-004",
    nome: "Hotel Villagio Beira-Mar",
    contato: "Gerente Ana Paula",
    email: "ana@villagio.com.br",
    telefone: "(11) 99400-0004",
    origem: "Google",
    etapa: "negociacao",
    valor: 8500,
    criado: "15/02/2026",
  },
  {
    id: "L-005",
    nome: "Clínica Saúde Total",
    contato: "Dr. Felipe Santos",
    email: "felipe@saudetotal.com.br",
    telefone: "(11) 99500-0005",
    origem: "Indicação",
    etapa: "ganho",
    valor: 4200,
    criado: "10/02/2026",
  },
]

const etapas = [
  { key: "novo", label: "Novo", color: "bg-blue-500", textColor: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-600/20" },
  { key: "qualificado", label: "Qualificado", color: "bg-purple-500", textColor: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-600/20" },
  { key: "proposta", label: "Proposta", color: "bg-amber-500", textColor: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-600/20" },
  { key: "negociacao", label: "Negociação", color: "bg-orange-500", textColor: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-600/20" },
  { key: "ganho", label: "Ganho", color: "bg-emerald-500", textColor: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-600/20" },
  { key: "perdido", label: "Perdido", color: "bg-red-500", textColor: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-600/20" },
]

function NovoLeadDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            Adicionar Lead
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome da Empresa / Edificação</Label>
              <Input placeholder="Ex.: Edifício Comercial Aurora" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Nome do Contato</Label>
              <Input placeholder="Nome do responsável" className="mt-1" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" className="mt-1" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input placeholder="email@empresa.com" className="mt-1" />
            </div>
            <div>
              <Label>Origem</Label>
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Como nos encontrou?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Estimado (R$)</Label>
              <Input placeholder="0,00" className="mt-1" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => setOpen(false)}>
            Adicionar Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function LeadsPage() {
  const [search, setSearch] = useState("")
  const [etapaFiltro, setEtapaFiltro] = useState("todos")

  const totalPotencial = mockLeads.reduce((acc, l) => acc + l.valor, 0)

  const filtered = mockLeads.filter((l) => {
    const matchSearch =
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.contato.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = etapaFiltro === "todos" || l.etapa === etapaFiltro
    return matchSearch && matchFiltro
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-red-600" />
            Leads / CRM
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {mockLeads.length} leads · R$ {totalPotencial.toLocaleString("pt-BR")} potencial
          </p>
        </div>
        <NovoLeadDialog />
      </div>

      {/* Funil visual */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {etapas.map((et) => {
          const count = mockLeads.filter(l => l.etapa === et.key).length
          return (
            <button
              key={et.key}
              onClick={() => setEtapaFiltro(etapaFiltro === et.key ? "todos" : et.key)}
              className={cn(
                "rounded-xl p-3 text-center transition-all border-2",
                etapaFiltro === et.key
                  ? "border-red-600 bg-red-50 dark:bg-red-600/10"
                  : "border-transparent bg-white dark:bg-slate-900/50 hover:border-slate-200"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full mx-auto mb-2", et.color)} />
              <p className="text-lg font-black text-slate-900 dark:text-white">{count}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-tight">{et.label}</p>
            </button>
          )
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por empresa ou contato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((lead) => {
          const etapa = etapas.find(e => e.key === lead.etapa)!
          return (
            <Card key={lead.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{lead.nome}</h3>
                        <Badge className={cn("text-xs font-bold border-0 flex-shrink-0", etapa.bg, etapa.textColor)}>
                          {etapa.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{lead.contato} · {lead.origem}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.telefone}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />R$ {lead.valor.toLocaleString("pt-BR")}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{lead.criado}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-600/10">
                      <Phone className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-600/10">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem><ArrowRight className="w-4 h-4 mr-2" />Avançar etapa</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Remover</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
