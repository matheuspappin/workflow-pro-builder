"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  FireExtinguisher,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building2,
  QrCode,
  Calendar,
  Loader2,
  Printer,
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
import { useToast } from "@/hooks/use-toast"
import QRCode from "react-qr-code"

interface Asset {
  id: string
  name: string
  type?: string
  qr_code?: string
  serial_number?: string
  capacity?: string
  agent_type?: string
  location?: string
  status?: string
  expiration_date?: string
  last_inspection_at?: string
  manufacture_date?: string
  studio_id: string
  student_id?: string
  customer?: { id: string; name: string; phone?: string }
}

const statusMap = {
  ok: { label: "Em dia", icon: CheckCircle, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  vencendo: { label: "Vencendo em 30d", icon: AlertTriangle, className: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
  vencido: { label: "Vencido", icon: XCircle, className: "bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400" },
}

function computeStatus(expiration_date?: string): "ok" | "vencendo" | "vencido" {
  if (!expiration_date) return "ok"
  const exp = new Date(expiration_date)
  const now = new Date()
  const in30 = new Date(now)
  in30.setDate(in30.getDate() + 30)
  if (exp <= now) return "vencido"
  if (exp <= in30) return "vencendo"
  return "ok"
}

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function displayTipo(a: Asset) {
  const agent = a.agent_type || a.type || ""
  const cap = a.capacity || ""
  if (agent && cap) return `${agent} — ${cap}`
  if (agent) return agent
  if (cap) return cap
  return a.type || "—"
}

function NovoExtintorDialog({ studioId, customers, onCreated }: {
  studioId: string | null
  customers: { id: string; name: string }[]
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    student_id: "",
    agent_type: "",
    capacity: "",
    location: "",
    manufacture_date: "",
    last_inspection: "",
    expiration_date: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId) {
      toast({ title: "Erro", description: "Studio não identificado.", variant: "destructive" })
      return
    }
    const typeStr = [form.agent_type, form.capacity].filter(Boolean).join(" ")
    const name = typeStr ? `Extintor ${typeStr}` : "Extintor"
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studio_id: studioId,
          student_id: form.student_id || null,
          name,
          type: typeStr || null,
          agent_type: form.agent_type || null,
          capacity: form.capacity || null,
          location: form.location || null,
          manufacture_date: form.manufacture_date || null,
          last_inspection_at: form.last_inspection || null,
          expiration_date: form.expiration_date || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar")
      toast({ title: "Extintor cadastrado!", description: `QR Code gerado. Imprima e cole no equipamento.` })
      setOpen(false)
      setForm({ student_id: "", agent_type: "", capacity: "", location: "", manufacture_date: "", last_inspection: "", expiration_date: "" })
      onCreated()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20" disabled={!studioId}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Extintor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FireExtinguisher className="w-5 h-5 text-red-600" />
            Cadastrar Extintor
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div>
            <Label>Cliente / Edificação</Label>
            <Select value={form.student_id} onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar cliente (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Sem cliente —</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo / Agente</Label>
              <Select value={form.agent_type} onValueChange={(v) => setForm((f) => ({ ...f, agent_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CO2">CO2</SelectItem>
                  <SelectItem value="PQS">PQS</SelectItem>
                  <SelectItem value="Água">Água</SelectItem>
                  <SelectItem value="Espuma">Espuma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacidade</Label>
              <Select value={form.capacity} onValueChange={(v) => setForm((f) => ({ ...f, capacity: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Ex.: 4 kg" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2 kg">2 kg</SelectItem>
                  <SelectItem value="4 kg">4 kg</SelectItem>
                  <SelectItem value="6 kg">6 kg</SelectItem>
                  <SelectItem value="10 L">10 L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Localização</Label>
            <Input
              placeholder="Ex.: Térreo — Hall de entrada"
              className="mt-1"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ano de Fabricação</Label>
              <Input
                placeholder="2022"
                className="mt-1"
                value={form.manufacture_date}
                onChange={(e) => setForm((f) => ({ ...f, manufacture_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Última Recarga</Label>
              <Input
                type="date"
                className="mt-1"
                value={form.last_inspection}
                onChange={(e) => setForm((f) => ({ ...f, last_inspection: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Próxima Recarga (Validade)</Label>
            <Input
              type="date"
              className="mt-1"
              value={form.expiration_date}
              onChange={(e) => setForm((f) => ({ ...f, expiration_date: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function QRCodeDialog({ asset, open, onOpenChange }: { asset: Asset; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qrValue = asset.qr_code || asset.id
  const handlePrint = () => {
    const printContent = document.getElementById("qr-print-area")
    if (!printContent) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>QR Code - ${asset.name}</title>
      <style>body{font-family:sans-serif;padding:24px;text-align:center;} .name{font-size:16px;font-weight:bold;margin-bottom:8px;} .code{font-size:12px;color:#666;}</style>
      </head><body>
      <div class="name">${asset.name}</div>
      <div class="code">Código: ${qrValue}</div>
      <div style="margin:16px 0;">${printContent.innerHTML}</div>
      <p style="font-size:11px;color:#999;">Cole este adesivo no extintor. Escaneie para registrar vistorias.</p>
      </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 250)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-red-600" />
            QR Code — {asset.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div id="qr-print-area" className="bg-white p-4 rounded-xl">
            <QRCode value={qrValue} size={200} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
          </div>
          <p className="text-xs text-slate-500 text-center">
            Código: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{qrValue}</code>
          </p>
          <p className="text-xs text-slate-400 text-center">
            Imprima e cole no extintor. O técnico escaneia este QR para registrar vistorias.
          </p>
          <Button onClick={handlePrint} className="w-full bg-red-600 hover:bg-red-700" size="lg">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ExtintoresPage() {
  const [studioId, setStudioId] = useState<string | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [qrAsset, setQrAsset] = useState<Asset | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sid = session?.user?.user_metadata?.studio_id ?? null
      setStudioId(sid)
    })
  }, [])

  const fetchAssets = () => {
    if (!studioId) return
    fetch(`/api/fire-protection/assets?studioId=${studioId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAssets(data)
        else if (data.error) toast({ title: "Erro", description: data.error, variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (studioId) {
      setLoading(true)
      fetchAssets()
      fetch(`/api/fire-protection/customers?studioId=${studioId}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => Array.isArray(data) ? setCustomers(data) : [])
    }
  }, [studioId])

  const counts = {
    ok: assets.filter((a) => computeStatus(a.expiration_date) === "ok").length,
    vencendo: assets.filter((a) => computeStatus(a.expiration_date) === "vencendo").length,
    vencido: assets.filter((a) => computeStatus(a.expiration_date) === "vencido").length,
  }

  const filtered = assets.filter((a) => {
    const status = computeStatus(a.expiration_date)
    const tipo = displayTipo(a)
    const cliente = a.customer?.name || ""
    const local = a.location || ""
    const matchSearch =
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      tipo.toLowerCase().includes(search.toLowerCase()) ||
      cliente.toLowerCase().includes(search.toLowerCase()) ||
      local.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === "todos" || status === filtro
    return matchSearch && matchFiltro
  })

  const displayId = (a: Asset) => a.qr_code ? a.qr_code.slice(0, 8).toUpperCase() : a.id.slice(0, 8).toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FireExtinguisher className="w-6 h-6 text-red-600" />
            Extintores
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {loading ? "Carregando..." : `${assets.length} extintores cadastrados`}
          </p>
        </div>
        <NovoExtintorDialog studioId={studioId} customers={customers} onCreated={fetchAssets} />
      </div>

      {!studioId && !loading && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Faça login com uma conta de empresa para gerenciar extintores.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alertas de status */}
      {counts.vencido > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-600/10 border border-red-200 dark:border-red-600/30">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">
            {counts.vencido} extintor(es) com recarga VENCIDA — ação imediata necessária!
          </p>
        </div>
      )}
      {counts.vencendo > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-600/10 border border-amber-200 dark:border-amber-600/30">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            {counts.vencendo} extintor(es) vencendo nos próximos 30 dias
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por ID, tipo, cliente ou localização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "ok", "vencendo", "vencido"] as const).map((f) => (
            <Button
              key={f}
              variant={filtro === f ? "default" : "outline"}
              size="sm"
              className={cn(filtro === f && "bg-red-600 hover:bg-red-700 border-red-600")}
              onClick={() => setFiltro(f)}
            >
              {f === "todos" ? "Todos" : statusMap[f]?.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hidden md:table-cell">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hidden lg:table-cell">Localização</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Próx. Recarga</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ext, i) => {
                const status = computeStatus(ext.expiration_date)
                const st = statusMap[status]
                return (
                  <tr key={ext.id} className={cn("border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors", i === filtered.length - 1 && "border-0")}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-600/10 px-2 py-0.5 rounded-lg">{displayId(ext)}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{displayTipo(ext)}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {ext.customer?.name || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{ext.location || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(ext.expiration_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-xs font-bold border-0", st.className)}>
                        {st.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setQrAsset(ext)}>
                            <QrCode className="w-4 h-4 mr-2" />QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />Ver</DropdownMenuItem>
                          <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <FireExtinguisher className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhum extintor encontrado</p>
              <p className="text-xs mt-1">Cadastre o primeiro extintor para gerar QR codes.</p>
            </div>
          )}
        </div>
      )}

      {qrAsset && (
        <QRCodeDialog
          asset={qrAsset}
          open={!!qrAsset}
          onOpenChange={(v) => !v && setQrAsset(null)}
        />
      )}
    </div>
  )
}
