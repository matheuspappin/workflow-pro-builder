"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  ClipboardList, Plus, Search, Building2, Users, Calendar,
  MoreHorizontal, Eye, Pencil, Trash2, CheckCircle, Clock,
  AlertCircle, XCircle, Wrench, Loader2, RefreshCw, ChevronRight,
  QrCode, Printer, Package,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import QRCode from "react-qr-code"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Customer { id: string; name: string; phone?: string }
interface Professional { id: string; name: string }
interface OS {
  id: string
  tracking_code: string
  title: string
  description?: string
  observations?: string
  status: string
  priority: string
  scheduled_at?: string
  created_at: string
  finished_at?: string
  customer?: Customer
  professional?: Professional
}

// ─── Mapas de Status e Prioridade ─────────────────────────────────────────────

const statusMap: Record<string, { label: string; icon: any; className: string }> = {
  open:        { label: "Aberta",       icon: Clock,        className: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
  in_progress: { label: "Em Andamento", icon: Wrench,       className: "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400" },
  waiting_parts: { label: "Aguard. Peças", icon: Clock,     className: "bg-purple-100 text-purple-700 dark:bg-purple-600/20 dark:text-purple-400" },
  finished:    { label: "Concluída",    icon: CheckCircle,  className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  cancelled:   { label: "Cancelada",   icon: XCircle,      className: "bg-slate-100 text-slate-500 dark:bg-slate-600/20 dark:text-slate-400" },
}

const prioridadeMap: Record<string, string> = {
  urgente: "border-l-red-600",
  alta:    "border-l-orange-500",
  normal:  "border-l-slate-200 dark:border-l-white/10",
}

const TIPOS_OS = [
  "Recarga de Extintores",
  "Manutenção Preventiva",
  "Instalação de Detectores",
  "Manutenção de Hidrantes",
  "Instalação de Sprinklers",
  "Revisão de Alarmes",
  "Troca de Sinalização",
  "Laudo Técnico",
  "Outro",
]

// ─── Hook: Studio ID ───────────────────────────────────────────────────────────

function useStudioId() {
  const [studioId, setStudioId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStudioId(session?.user?.user_metadata?.studio_id ?? null)
    })
  }, [])
  return studioId
}

// ─── Dialog: Nova OS ──────────────────────────────────────────────────────────

function NovaOSDialog({
  studioId,
  onCreated,
}: {
  studioId: string
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [technicians, setTechnicians] = useState<Professional[]>([])
  const [form, setForm] = useState({
    title: "",
    customer_id: "",
    professional_id: "",
    priority: "normal",
    scheduled_at: "",
    description: "",
  })

  useEffect(() => {
    if (!open || !studioId) return
    Promise.all([
      fetch(`/api/fire-protection/customers?studioId=${studioId}`).then((r) => r.json()),
      fetch(`/api/fire-protection/technicians?studioId=${studioId}`).then((r) => r.json()),
    ]).then(([c, t]) => {
      setCustomers(Array.isArray(c) ? c : [])
      setTechnicians(Array.isArray(t) ? t : [])
    })
  }, [open, studioId])

  const handleSubmit = async () => {
    if (!form.title) return
    setLoading(true)
    try {
      await fetch("/api/fire-protection/os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studio_id: studioId, ...form, project_type: "common" }),
      })
      setOpen(false)
      setForm({ title: "", customer_id: "", professional_id: "", priority: "normal", scheduled_at: "", description: "" })
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20">
          <Plus className="w-4 h-4 mr-2" />Nova OS
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-600" />
            Abrir Ordem de Serviço
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Tipo de Serviço *</Label>
            <Select value={form.title} onValueChange={(v) => setForm({ ...form, title: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar tipo" /></SelectTrigger>
              <SelectContent>
                {TIPOS_OS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cliente / Edificação</Label>
            <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Técnico Responsável</Label>
              <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Técnico" /></SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Data Agendada</Label>
            <Input type="datetime-local" className="mt-1" value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea placeholder="Descreva o serviço a ser realizado..." className="mt-1" rows={3}
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleSubmit} disabled={loading || !form.title}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Abrir OS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog: Finalizar OS ─────────────────────────────────────────────────────

function FinalizarOSDialog({
  os,
  studioId,
  onUpdated,
}: {
  os: OS
  studioId: string
  onUpdated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [novoStatus, setNovoStatus] = useState(os.status)
  const [obs, setObs] = useState(os.observations ?? "")

  const handleSalvar = async () => {
    setLoading(true)
    try {
      await fetch(`/api/fire-protection/os/${os.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studio_id: studioId,
          status: novoStatus,
          observations: obs,
          previous_status: os.status,
        }),
      })
      setOpen(false)
      onUpdated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true) }}>
          <ChevronRight className="w-4 h-4 mr-2" />Atualizar status
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-600" />
            Atualizar OS — {os.tracking_code}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm">
            <p className="font-bold text-slate-700 dark:text-slate-300">{os.title}</p>
            {os.customer && (
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <Building2 className="w-3.5 h-3.5" />{os.customer.name}
              </p>
            )}
          </div>
          <div>
            <Label>Novo Status</Label>
            <Select value={novoStatus} onValueChange={setNovoStatus}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusMap).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações / Laudo</Label>
            <Textarea placeholder="Descreva o que foi realizado, diagnóstico ou motivo..." className="mt-1" rows={4}
              value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
          <Button
            className={cn(
              "flex-1 font-bold",
              novoStatus === "finished" ? "bg-emerald-600 hover:bg-emerald-700" :
              novoStatus === "cancelled" ? "bg-slate-600 hover:bg-slate-700" :
              "bg-red-600 hover:bg-red-700"
            )}
            onClick={handleSalvar}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {novoStatus === "finished" ? "Concluir OS" :
             novoStatus === "cancelled" ? "Cancelar OS" : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog: Gerar QR Codes em Massa (para retirada) ──────────────────────────

function GerarQRMassaDialog({
  os,
  studioId,
  onCreated,
}: {
  os: OS
  studioId: string
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<Array<{ id: string; name: string; qr_code: string }>>([])
  const [form, setForm] = useState({
    quantity: 1,
    agent_type: "PQS",
    capacity: "4 kg",
    is_our_extinguisher: false,
  })

  const handleGerar = async () => {
    if (form.quantity < 1 || form.quantity > 200) {
      toast({ title: "Quantidade inválida (1-200)", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/assets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studio_id: studioId,
          service_order_id: os.id,
          customer_id: form.is_our_extinguisher ? null : os.customer?.id,
          quantity: form.quantity,
          agent_type: form.agent_type,
          capacity: form.capacity,
          is_our_extinguisher: form.is_our_extinguisher,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao gerar")
      setCreated(data.assets || [])
      toast({ title: `${data.count} QR codes gerados!`, description: "Clique em Imprimir para ver os adesivos." })
      onCreated()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printEl = document.getElementById("bulk-qr-print-area")
    if (!printEl || created.length === 0) return
    setPrinting(true)
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>QR Codes - ${os.title}</title><style>body{font-family:sans-serif;padding:16px;}.g{display:flex;flex-wrap:wrap;gap:12px;}.c{text-align:center;padding:12px;border:1px solid #ddd;border-radius:8px;}</style></head><body><h2>${os.title}</h2><div class="g">${printEl.innerHTML}</div><p style="margin-top:24px;font-size:11px;color:#999;">Cole cada adesivo no extintor. Escaneie no app do técnico para registrar retirada/entrega.</p></body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); win.close(); setPrinting(false) }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true); setCreated([]) }}>
          <QrCode className="w-4 h-4 mr-2" />Gerar QR Codes para Retirada
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-red-600" />
            QR Codes em Massa
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500">
          Gere adesivos QR para os extintores desta OS. O técnico escaneia para registrar retirada e entrega.
        </p>
        {created.length === 0 ? (
          <div className="grid gap-4 py-2">
            <div>
              <Label>Quantidade de extintores</Label>
              <input
                type="number"
                min={1}
                max={200}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Math.max(1, Math.min(200, parseInt(e.target.value) || 1)) }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.agent_type} onValueChange={(v) => setForm((f) => ({ ...f, agent_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PQS">PQS</SelectItem>
                    <SelectItem value="CO2">CO2</SelectItem>
                    <SelectItem value="Água">Água</SelectItem>
                    <SelectItem value="Espuma">Espuma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacidade</Label>
                <Select value={form.capacity} onValueChange={(v) => setForm((f) => ({ ...f, capacity: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2 kg">2 kg</SelectItem>
                    <SelectItem value="4 kg">4 kg</SelectItem>
                    <SelectItem value="6 kg">6 kg</SelectItem>
                    <SelectItem value="10 L">10 L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="nosso-ext"
                checked={form.is_our_extinguisher}
                onChange={(e) => setForm((f) => ({ ...f, is_our_extinguisher: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="nosso-ext" className="text-sm cursor-pointer">
                Nosso extintor (sem cliente — recarga própria)
              </Label>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleGerar} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
              Gerar {form.quantity} QR Code{form.quantity > 1 ? "s" : ""}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div id="bulk-qr-print-area" className="flex flex-wrap gap-3 max-h-[300px] overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              {created.map((a) => (
                <div key={a.id} className="text-center p-2 border rounded-lg bg-white">
                  <div className="text-[10px] font-bold mb-1">{a.name}</div>
                  <QRCode value={a.qr_code} size={100} />
                  <div className="text-[9px] text-slate-500 mt-1 truncate w-[100px]">{a.qr_code}</div>
                </div>
              ))}
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handlePrint} disabled={printing}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir todos os QR Codes
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setCreated([]) }}>
              Gerar mais
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function OSPage() {
  const studioId = useStudioId()
  const [osList, setOsList] = useState<OS[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtro, setFiltro] = useState("todos")

  const fetchOS = useCallback(async () => {
    if (!studioId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/fire-protection/os?studioId=${studioId}`)
      const data = await res.json()
      setOsList(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [studioId])

  useEffect(() => { fetchOS() }, [fetchOS])

  const counts = {
    todos:       osList.length,
    open:        osList.filter((o) => o.status === "open").length,
    in_progress: osList.filter((o) => o.status === "in_progress").length,
    finished:    osList.filter((o) => o.status === "finished").length,
    cancelled:   osList.filter((o) => o.status === "cancelled").length,
  }

  const filtered = osList.filter((o) => {
    const matchSearch =
      (o.tracking_code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.name ?? "").toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === "todos" || o.status === filtro
    return matchSearch && matchFiltro
  })

  const handleCancelar = async (id: string) => {
    if (!studioId || !confirm("Deseja cancelar esta OS?")) return
    await fetch(`/api/fire-protection/os/${id}?studioId=${studioId}`, { method: "DELETE" })
    fetchOS()
  }

  const formatDate = (d?: string) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-red-600" />
            Ordens de Serviço
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {counts.open} abertas · {counts.in_progress} em andamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchOS} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          {studioId && <NovaOSDialog studioId={studioId} onCreated={fetchOS} />}
        </div>
      </div>

      {/* Cards de status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "open",        label: "Abertas",      icon: Clock,        color: "text-amber-500",  bg: "bg-amber-500/10" },
          { key: "in_progress", label: "Em Andamento", icon: Wrench,       color: "text-blue-500",   bg: "bg-blue-500/10" },
          { key: "finished",    label: "Concluídas",   icon: CheckCircle,  color: "text-emerald-500",bg: "bg-emerald-500/10" },
          { key: "cancelled",   label: "Canceladas",   icon: XCircle,      color: "text-slate-500",  bg: "bg-slate-500/10" },
        ].map((s) => (
          <Card
            key={s.key}
            onClick={() => setFiltro(filtro === s.key ? "todos" : s.key)}
            className={cn(
              "cursor-pointer transition-all border shadow-sm",
              filtro === s.key
                ? "border-red-600 bg-red-50 dark:bg-red-600/10"
                : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10"
            )}
          >
            <CardContent className="p-4">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {counts[s.key as keyof typeof counts]}
              </p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por número, cliente ou tipo de serviço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Carregando ordens de serviço...</span>
        </div>
      )}

      {/* Lista */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map((os) => {
            const st = statusMap[os.status] ?? statusMap.open
            const borda = prioridadeMap[os.priority ?? "normal"]
            return (
              <Card
                key={os.id}
                className={cn(
                  "bg-white dark:bg-slate-900/50 shadow-sm border-l-4 hover:shadow-md transition-shadow",
                  borda
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-600/10 px-2 py-0.5 rounded-lg">
                          {os.tracking_code}
                        </span>
                        <Badge className={cn("text-xs font-bold border-0", st.className)}>
                          {st.label}
                        </Badge>
                        {os.priority === "urgente" && (
                          <Badge className="text-xs font-bold border-0 bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400">
                            <AlertCircle className="w-3 h-3 mr-1" />Urgente
                          </Badge>
                        )}
                        {os.priority === "alta" && (
                          <Badge className="text-xs font-bold border-0 bg-orange-100 text-orange-700 dark:bg-orange-600/20 dark:text-orange-400">
                            Alta
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{os.title}</h3>
                      {os.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{os.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {os.customer && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />{os.customer.name}
                          </span>
                        )}
                        {os.professional && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />{os.professional.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Agendada: {formatDate(os.scheduled_at)}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />Ver detalhes
                        </DropdownMenuItem>
                        {studioId && (
                          <FinalizarOSDialog
                            os={os}
                            studioId={studioId}
                            onUpdated={fetchOS}
                          />
                        )}
                        {studioId && (os.title?.toLowerCase().includes("recarga") || os.title?.toLowerCase().includes("extintor")) && (
                          <GerarQRMassaDialog os={os} studioId={studioId} onCreated={fetchOS} />
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleCancelar(os.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />Cancelar OS
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">
            {osList.length === 0 ? "Nenhuma OS cadastrada" : "Nenhuma OS encontrada com esses filtros"}
          </p>
          {osList.length === 0 && studioId && (
            <p className="text-sm mt-1">Clique em "Nova OS" para começar</p>
          )}
        </div>
      )}
    </div>
  )
}
