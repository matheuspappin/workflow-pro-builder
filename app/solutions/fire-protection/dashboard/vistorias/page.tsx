"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Calendar, Plus, Search, Building2, Users, CheckCircle, Clock,
  XCircle, MoreHorizontal, Eye, FileText, Pencil, Trash2,
  AlertTriangle, Loader2, RefreshCw, ClipboardCheck, ShieldAlert,
  ChevronRight,
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

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Customer { id: string; name: string; phone?: string }
interface Professional { id: string; name: string }
interface ChecklistItem { id: string; title: string; status: string; order_index: number; completed_at?: string }
interface Vistoria {
  id: string
  tracking_code: string
  title: string
  vistoria_type?: string
  description?: string
  observations?: string
  status: string
  conformidade_score?: number
  scheduled_at?: string
  finished_at?: string
  created_at: string
  customer?: Customer
  professional?: Professional
  milestones?: ChecklistItem[]
}

// ─── Mapas ────────────────────────────────────────────────────────────────────

const statusMap: Record<string, { label: string; icon: any; className: string }> = {
  open:         { label: "Agendada",    icon: Calendar,    className: "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400" },
  in_progress:  { label: "Em Andamento",icon: Clock,       className: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
  finished:     { label: "Concluída",   icon: CheckCircle, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  nao_conforme: { label: "Não Conforme",icon: XCircle,     className: "bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400" },
  cancelled:    { label: "Cancelada",   icon: XCircle,     className: "bg-slate-100 text-slate-500 dark:bg-slate-600/20 dark:text-slate-400" },
}

const TIPOS_VISTORIA = [
  "Anual — AVCB",
  "Preventiva Semestral",
  "Rotineira",
  "Urgente — Hidrantes",
  "Urgente — Extintores",
  "Recarga Periódica",
  "Laudo de Conformidade",
  "Pré-vistoria AVCB",
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

// ─── Dialog: Agendar Vistoria ─────────────────────────────────────────────────

function AgendarVistoriaDialog({
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
    vistoria_type: "",
    customer_id: "",
    professional_id: "",
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
    if (!form.vistoria_type) return
    setLoading(true)
    try {
      await fetch("/api/fire-protection/vistorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studio_id: studioId, ...form, with_checklist: true }),
      })
      setOpen(false)
      setForm({ vistoria_type: "", customer_id: "", professional_id: "", scheduled_at: "", description: "" })
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20">
          <Plus className="w-4 h-4 mr-2" />Agendar Vistoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            Agendar Vistoria
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Tipo de Vistoria *</Label>
            <Select value={form.vistoria_type} onValueChange={(v) => setForm({ ...form, vistoria_type: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar tipo" /></SelectTrigger>
              <SelectContent>
                {TIPOS_VISTORIA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
              <Label>Data Agendada</Label>
              <Input type="datetime-local" className="mt-1" value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea placeholder="Detalhes ou requisitos da vistoria..." className="mt-1" rows={3}
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-600/10 text-xs text-blue-700 dark:text-blue-400">
            <ClipboardCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Checklist padrão de conformidade (12 itens) será criado automaticamente.</p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={handleSubmit}
            disabled={loading || !form.vistoria_type}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Agendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog: Finalizar Vistoria ───────────────────────────────────────────────

function FinalizarVistoriaDialog({
  vistoria,
  studioId,
  onUpdated,
}: {
  vistoria: Vistoria
  studioId: string
  onUpdated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [obs, setObs] = useState(vistoria.observations ?? "")
  const [scoreManual, setScoreManual] = useState<number | null>(null)

  const isFinalizavel = vistoria.status === "open" || vistoria.status === "in_progress"

  useEffect(() => {
    if (!open || !studioId) return
    setLoadingChecklist(true)
    fetch(`/api/fire-protection/vistorias/${vistoria.id}?studioId=${studioId}`)
      .then((r) => r.json())
      .then((data) => {
        const milestones = data.milestones ?? vistoria.milestones ?? []
        const sorted = [...milestones].sort((a: ChecklistItem, b: ChecklistItem) => a.order_index - b.order_index)
        setChecklist(sorted)
        setLoadingChecklist(false)
      })
      .catch(() => {
        setChecklist(vistoria.milestones ? [...vistoria.milestones].sort((a, b) => a.order_index - b.order_index) : [])
        setLoadingChecklist(false)
      })
  }, [open, studioId, vistoria.id, vistoria.milestones])

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "completed" ? "pending" : "completed" }
          : item
      )
    )
  }

  const concluidos = checklist.filter((i) => i.status === "completed").length
  const total = checklist.length
  const scoreAuto = total > 0 ? Math.round((concluidos / total) * 100) : 0
  const score = scoreManual !== null ? scoreManual : scoreAuto

  const isConforme = score >= 80

  const handleFinalizar = async (statusFinal: "finished" | "nao_conforme") => {
    setLoading(true)
    try {
      const checklistUpdates = checklist.map((item) => ({
        id: item.id,
        status: item.status,
      }))

      await fetch(`/api/fire-protection/vistorias/${vistoria.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studio_id: studioId,
          status: statusFinal,
          observations: obs,
          conformidade_score: score,
          checklist_updates: checklistUpdates,
          previous_status: vistoria.status,
        }),
      })
      setOpen(false)
      onUpdated()
    } finally {
      setLoading(false)
    }
  }

  const handleIniciar = async () => {
    setLoading(true)
    try {
      await fetch(`/api/fire-protection/vistorias/${vistoria.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studio_id: studioId,
          status: "in_progress",
          previous_status: vistoria.status,
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
          <ClipboardCheck className="w-4 h-4 mr-2" />
          {vistoria.status === "open" ? "Iniciar / Finalizar" : "Finalizar vistoria"}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-red-600" />
            Finalizar Vistoria — {vistoria.tracking_code}
          </DialogTitle>
        </DialogHeader>

        {/* Info da vistoria */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-200">{vistoria.title}</p>
          {vistoria.customer && (
            <p className="text-slate-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />{vistoria.customer.name}
            </p>
          )}
          {vistoria.professional && (
            <p className="text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />{vistoria.professional.name}
            </p>
          )}
        </div>

        {/* Se ainda agendada, oferecer iniciar */}
        {vistoria.status === "open" && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-600/10 border border-amber-200 dark:border-amber-600/30">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Vistoria ainda não iniciada</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Marque como "Em Andamento" para começar a preencher o checklist.</p>
            </div>
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={handleIniciar} disabled={loading}>
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Iniciar"}
            </Button>
          </div>
        )}

        {/* Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-bold">Checklist de Conformidade</Label>
            <span className="text-sm font-bold text-slate-500">
              {concluidos}/{total} itens
            </span>
          </div>

          {/* Barra de progresso */}
          {total > 0 && (
            <div className="mb-4 space-y-1.5">
              <Progress
                value={scoreAuto}
                className={cn("h-2", scoreAuto >= 80 ? "[&>div]:bg-emerald-500" : scoreAuto >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500")}
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Conformidade automática</span>
                <span className={cn(
                  "font-black",
                  scoreAuto >= 80 ? "text-emerald-600" : scoreAuto >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {scoreAuto}%
                </span>
              </div>
            </div>
          )}

          {loadingChecklist ? (
            <div className="flex items-center justify-center py-6 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Carregando checklist...</span>
            </div>
          ) : checklist.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum item de checklist encontrado</p>
          ) : (
            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    item.status === "completed"
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-600/10 dark:border-emerald-600/30"
                      : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900/50 dark:border-white/10"
                  )}
                >
                  <Checkbox
                    checked={item.status === "completed"}
                    onCheckedChange={() => toggleItem(item.id)}
                    className={cn(
                      "flex-shrink-0",
                      item.status === "completed" && "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    )}
                  />
                  <span className={cn(
                    "text-sm flex-1",
                    item.status === "completed"
                      ? "text-emerald-700 dark:text-emerald-400 line-through opacity-75"
                      : "text-slate-700 dark:text-slate-300"
                  )}>
                    {item.title}
                  </span>
                  {item.status === "completed" && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score manual */}
        <div>
          <Label className="text-sm font-bold">Score de Conformidade Final</Label>
          <div className="flex items-center gap-3 mt-1">
            <Input
              type="number"
              min={0}
              max={100}
              value={scoreManual !== null ? scoreManual : scoreAuto}
              onChange={(e) => setScoreManual(Math.min(100, Math.max(0, Number(e.target.value))))}
              className="w-24"
            />
            <span className="text-sm text-slate-500">%</span>
            {scoreManual !== null && (
              <Button variant="ghost" size="sm" className="text-xs text-slate-400"
                onClick={() => setScoreManual(null)}>
                Usar automático ({scoreAuto}%)
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculado automaticamente com base nos itens marcados. Pode ser ajustado manualmente.
          </p>
        </div>

        {/* Observações */}
        <div>
          <Label>Laudo / Observações</Label>
          <Textarea
            placeholder="Descreva o resultado da vistoria, itens não conformes encontrados, recomendações..."
            className="mt-1"
            rows={4}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>

        {/* Preview do resultado */}
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-xl border",
          isConforme
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-600/10 dark:border-emerald-600/30"
            : "bg-red-50 border-red-200 dark:bg-red-600/10 dark:border-red-600/30"
        )}>
          {isConforme
            ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            : <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          }
          <div>
            <p className={cn(
              "text-sm font-bold",
              isConforme ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
            )}>
              {isConforme ? `Conforme — Score ${score}%` : `Não Conforme — Score ${score}%`}
            </p>
            <p className={cn(
              "text-xs mt-0.5",
              isConforme ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
            )}>
              {isConforme
                ? "Edificação aprovada. Laudo de conformidade pode ser emitido."
                : "Irregularidades detectadas. Ações corretivas necessárias antes da aprovação."}
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={() => handleFinalizar("nao_conforme")}
            disabled={loading || !isFinalizavel}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
            Não Conforme
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            onClick={() => handleFinalizar("finished")}
            disabled={loading || !isFinalizavel}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Concluída
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function VistoriasPage() {
  const studioId = useStudioId()
  const [vistorias, setVistorias] = useState<Vistoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtro, setFiltro] = useState("todos")

  const fetchVistorias = useCallback(async () => {
    if (!studioId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/fire-protection/vistorias?studioId=${studioId}`)
      const data = await res.json()
      setVistorias(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [studioId])

  useEffect(() => { fetchVistorias() }, [fetchVistorias])

  const counts = {
    todos:        vistorias.length,
    open:         vistorias.filter((v) => v.status === "open").length,
    in_progress:  vistorias.filter((v) => v.status === "in_progress").length,
    finished:     vistorias.filter((v) => v.status === "finished").length,
    nao_conforme: vistorias.filter((v) => v.status === "nao_conforme").length,
  }

  const filtered = vistorias.filter((v) => {
    const matchSearch =
      (v.tracking_code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.customer?.name ?? "").toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === "todos" || v.status === filtro
    return matchSearch && matchFiltro
  })

  const handleCancelar = async (id: string) => {
    if (!studioId || !confirm("Deseja cancelar esta vistoria?")) return
    await fetch(`/api/fire-protection/vistorias/${id}?studioId=${studioId}`, { method: "DELETE" })
    fetchVistorias()
  }

  const formatDate = (d?: string) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-red-600" />
            Vistorias
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {counts.open} agendadas · {counts.nao_conforme > 0 ? `${counts.nao_conforme} não conforme` : `${counts.finished} concluídas`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchVistorias} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          {studioId && <AgendarVistoriaDialog studioId={studioId} onCreated={fetchVistorias} />}
        </div>
      </div>

      {/* Alerta não-conformidades */}
      {counts.nao_conforme > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-600/10 border border-red-200 dark:border-red-600/30">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">
            {counts.nao_conforme === 1
              ? "Há 1 vistoria com não-conformidades pendentes de resolução"
              : `Há ${counts.nao_conforme} vistorias com não-conformidades pendentes de resolução`}
          </p>
          <Button size="sm" variant="outline" className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => setFiltro("nao_conforme")}>
            Ver
          </Button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por número, cliente ou tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "todos", label: "Todas" },
            { key: "open", label: "Agendadas" },
            { key: "in_progress", label: "Em Andamento" },
            { key: "finished", label: "Concluídas" },
            { key: "nao_conforme", label: "Não Conforme" },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filtro === f.key ? "default" : "outline"}
              size="sm"
              className={cn(filtro === f.key && "bg-red-600 hover:bg-red-700 border-red-600")}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
              {f.key !== "todos" && counts[f.key as keyof typeof counts] > 0 && (
                <span className={cn(
                  "ml-1.5 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center",
                  filtro === f.key ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                )}>
                  {counts[f.key as keyof typeof counts]}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Carregando vistorias...</span>
        </div>
      )}

      {/* Lista */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map((vst) => {
            const st = statusMap[vst.status] ?? statusMap.open
            const milestones = vst.milestones ?? []
            const checklistTotal = milestones.length
            const checklistConcluidos = milestones.filter((m) => m.status === "completed").length
            return (
              <Card
                key={vst.id}
                className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-600/10 px-2 py-0.5 rounded-lg">
                          {vst.tracking_code}
                        </span>
                        <Badge className={cn("text-xs font-bold border-0", st.className)}>
                          {st.label}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{vst.title}</h3>
                      {vst.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{vst.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {vst.customer && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />{vst.customer.name}
                          </span>
                        )}
                        {vst.professional && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />{vst.professional.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(vst.scheduled_at)}
                        </span>
                        {vst.conformidade_score !== null && vst.conformidade_score !== undefined && (
                          <span className={cn(
                            "flex items-center gap-1 font-bold",
                            vst.conformidade_score >= 80 ? "text-emerald-600" : "text-red-600"
                          )}>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Conformidade: {vst.conformidade_score}%
                          </span>
                        )}
                      </div>

                      {/* Mini checklist progress */}
                      {checklistTotal > 0 && vst.status === "in_progress" && (
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Checklist</span>
                            <span className="font-bold">{checklistConcluidos}/{checklistTotal}</span>
                          </div>
                          <Progress
                            value={Math.round((checklistConcluidos / checklistTotal) * 100)}
                            className="h-1.5"
                          />
                        </div>
                      )}
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
                        {studioId && (vst.status === "open" || vst.status === "in_progress") && (
                          <FinalizarVistoriaDialog
                            vistoria={vst}
                            studioId={studioId}
                            onUpdated={fetchVistorias}
                          />
                        )}
                        {(vst.status === "finished" || vst.status === "nao_conforme") && (
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />Emitir laudo
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleCancelar(vst.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />Cancelar vistoria
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
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">
            {vistorias.length === 0 ? "Nenhuma vistoria cadastrada" : "Nenhuma vistoria encontrada com esses filtros"}
          </p>
          {vistorias.length === 0 && studioId && (
            <p className="text-sm mt-1">Clique em "Agendar Vistoria" para começar</p>
          )}
        </div>
      )}
    </div>
  )
}
