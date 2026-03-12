"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Wrench,
  Star,
  MapPin,
  ShieldCheck,
  Link2,
  Copy,
  RefreshCw,
  Loader2,
  CheckCheck,
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
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const mockTecnicos = [
  {
    id: "1",
    nome: "Ricardo Alves",
    crea: "CREA-SP 123456",
    telefone: "(11) 99001-1111",
    email: "ricardo@firecontrol.com",
    status: "disponivel",
    especialidade: "Extintores e Hidrantes",
    cidade: "São Paulo, SP",
    osRealizadas: 142,
    avaliacao: 4.9,
    osAtivas: 3,
  },
  {
    id: "2",
    nome: "Fernanda Souza",
    crea: "CREA-SP 234567",
    telefone: "(11) 99002-2222",
    email: "fernanda@firecontrol.com",
    status: "em_campo",
    especialidade: "Sistemas de Sprinkler",
    cidade: "Guarulhos, SP",
    osRealizadas: 87,
    avaliacao: 4.7,
    osAtivas: 1,
  },
  {
    id: "3",
    nome: "Paulo Mendes",
    crea: "CREA-SP 345678",
    telefone: "(11) 99003-3333",
    email: "paulo@firecontrol.com",
    status: "disponivel",
    especialidade: "Alarmes e Detectores",
    cidade: "Santo André, SP",
    osRealizadas: 210,
    avaliacao: 5.0,
    osAtivas: 0,
  },
  {
    id: "4",
    nome: "Juliana Castro",
    crea: "CREA-SP 456789",
    telefone: "(11) 99004-4444",
    email: "juliana@firecontrol.com",
    status: "folga",
    especialidade: "Hidrantes e Mangueiras",
    cidade: "Osasco, SP",
    osRealizadas: 64,
    avaliacao: 4.8,
    osAtivas: 0,
  },
]

const statusMap = {
  disponivel: { label: "Disponível", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  em_campo: { label: "Em Campo", className: "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400" },
  folga: { label: "Folga", className: "bg-slate-100 text-slate-600 dark:bg-slate-600/20 dark:text-slate-400" },
}

function NovoTecnicoDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Novo Técnico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-red-600" />
            Cadastrar Técnico
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome Completo</Label>
              <Input placeholder="Nome do técnico" className="mt-1" />
            </div>
            <div>
              <Label>CREA</Label>
              <Input placeholder="CREA-SP 000000" className="mt-1" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>E-mail</Label>
              <Input placeholder="tecnico@empresa.com.br" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Especialidade</Label>
              <Input placeholder="Ex.: Extintores e Hidrantes" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Cidade / UF</Label>
              <Input placeholder="São Paulo, SP" className="mt-1" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => setOpen(false)}>
            Salvar Técnico
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InviteCodeCard() {
  const { toast } = useToast()
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const loadCode = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/studio/invite-code", { credentials: "include" })
      const data = await res.json()
      if (data.invite_code) setInviteCode(data.invite_code)
    } catch {
      setInviteCode("—")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCode() }, [])

  const handleCopy = () => {
    if (!inviteCode || inviteCode === "—") return
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast({ title: "Código copiado!", description: "Compartilhe com o técnico para que ele se vincule." })
    setTimeout(() => setCopied(false), 2500)
  }

  const handleCopyLink = () => {
    if (!inviteCode || inviteCode === "—") return
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const link = `${origin}/solutions/fire-protection/register?role=teacher&code=${inviteCode}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    toast({ title: "Link copiado!", description: "Envie este link para o técnico criar a conta e já entrar vinculado." })
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleRegenerate = async () => {
    if (!confirm("Gerar um novo código invalidará o código atual. Técnicos que ainda não se vincularam precisarão usar o novo código. Continuar?")) return
    setRegenerating(true)
    try {
      const res = await fetch("/api/fire-protection/studio/invite-code", {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (data.invite_code) {
        setInviteCode(data.invite_code)
        toast({ title: "Novo código gerado com sucesso!" })
      }
    } catch {
      toast({ title: "Erro ao regenerar código", variant: "destructive" })
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-600/10 dark:to-red-600/10 border border-orange-200 dark:border-orange-600/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <Link2 className="w-4 h-4" />
          Link de Convite para Técnicos
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Compartilhe este código com técnicos para que se vinculem automaticamente à sua empresa no portal deles.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando código...
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-600/30 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Código de Convite</p>
              <p className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-[0.3em]">
                {inviteCode || "—"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                variant="outline"
                className={cn(
                  "border-orange-200 dark:border-orange-600/30 h-10 w-10 rounded-xl transition-all",
                  copied && "bg-emerald-50 border-emerald-300 text-emerald-600"
                )}
                onClick={handleCopy}
                title="Copiar código"
              >
                {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className={cn(
                  "border-orange-200 dark:border-orange-600/30 h-10 w-10 rounded-xl transition-all",
                  copiedLink && "bg-emerald-50 border-emerald-300 text-emerald-600"
                )}
                onClick={handleCopyLink}
                title="Copiar link"
              >
                {copiedLink ? <CheckCheck className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="border-orange-200 dark:border-orange-600/30 h-10 w-10 rounded-xl"
                onClick={handleRegenerate}
                disabled={regenerating}
                title="Gerar novo código"
              >
                <RefreshCw className={cn("w-4 h-4", regenerating && "animate-spin")} />
              </Button>
            </div>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-3">
          Envie o link (recomendado) ou o código. Quem já tem conta pode acessar <span className="font-bold text-slate-600 dark:text-slate-300">Meu Perfil → Empresa Vinculada</span> e inserir o código.
        </p>
      </CardContent>
    </Card>
  )
}

export default function TecnicosPage() {
  const [search, setSearch] = useState("")
  const [filtro, setFiltro] = useState("todos")

  const filtered = mockTecnicos.filter((t) => {
    const matchSearch =
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      t.especialidade.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === "todos" || t.status === filtro
    return matchSearch && matchFiltro
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-red-600" />
            Técnicos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {mockTecnicos.length} técnicos cadastrados
          </p>
        </div>
        <NovoTecnicoDialog />
      </div>

      {/* Card de Código de Convite */}
      <InviteCodeCard />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou especialidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["todos", "disponivel", "em_campo", "folga"].map((f) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((tecnico) => {
          const st = statusMap[tecnico.status as keyof typeof statusMap]
          return (
            <Card key={tecnico.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {tecnico.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{tecnico.nome}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {tecnico.crea}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs font-bold border-0", st.className)}>{st.label}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{tecnico.especialidade}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{tecnico.cidade}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{tecnico.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{tecnico.email}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-white">{tecnico.osRealizadas}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">OS Realizadas</p>
                  </div>
                  <div>
                    <p className={cn("text-base font-black", tecnico.osAtivas > 0 ? "text-orange-500" : "text-slate-900 dark:text-white")}>
                      {tecnico.osAtivas}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">OS Ativas</p>
                  </div>
                  <div>
                    <p className="text-base font-black text-amber-500 flex items-center justify-center gap-0.5">
                      {tecnico.avaliacao}
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Avaliação</p>
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
