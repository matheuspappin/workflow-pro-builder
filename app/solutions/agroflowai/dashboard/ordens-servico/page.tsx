"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardList, Plus, Search, MapPin, Calendar,
  Loader2, X, User, Play, CheckCircle2, XCircle,
  MessageSquare, Send, ChevronDown, ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type OSStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
type OSType = 'laudo_car' | 'vistoria_ndvi' | 'regularizacao' | 'licenciamento' | 'monitoramento' | 'outro'

interface OS {
  id: string
  code: string
  client_name: string
  property_name?: string
  type: OSType
  status: OSStatus
  assigned_to?: string
  scheduled_date?: string
  created_at: string
  description?: string
}

const statusConfig: Record<OSStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pendente", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-l-amber-400" },
  in_progress: { label: "Em Andamento", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-l-blue-400" },
  completed: { label: "Concluída", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-l-emerald-400" },
  cancelled: { label: "Cancelada", color: "text-red-400", bg: "bg-red-400/10", border: "border-l-red-400" },
}

const typeLabels: Record<OSType, string> = {
  laudo_car: "Laudo CAR",
  vistoria_ndvi: "Vistoria NDVI",
  regularizacao: "Regularização Ambiental",
  licenciamento: "Licenciamento",
  monitoramento: "Monitoramento",
  outro: "Outro",
}

export default function OrdensServicoPage() {
  const [orders, setOrders] = useState<OS[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<OSStatus | "all">("all")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, { id: string; text: string; author: string; date: string }[]>>({})
  const [loadingComments, setLoadingComments] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [sendingComment, setSendingComment] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState({
    client_name: "",
    property_name: "",
    type: "laudo_car" as OSType,
    description: "",
    scheduled_date: "",
    assigned_to: "",
  })

  const getStudioId = () => {
    try { return JSON.parse(localStorage.getItem("workflow_user") || "{}").studioId || "" } catch { return "" }
  }

  useEffect(() => {
    const studioId = getStudioId()
    if (!studioId) { setLoading(false); return }
    fetch(`/api/agroflowai/os?studioId=${studioId}`)
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (os: OS, newStatus: OSStatus) => {
    setUpdatingId(os.id)
    setOrders(prev => prev.map(o => o.id === os.id ? { ...o, status: newStatus } : o))
    try {
      const studioId = getStudioId()
      const res = await fetch(`/api/agroflowai/os/${os.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, status: newStatus }),
      })
      if (!res.ok) throw new Error("Erro ao atualizar")
      const statusLabels = { pending: "Pendente", in_progress: "Em Andamento", completed: "Concluída", cancelled: "Cancelada" }
      toast({ title: `OS atualizada → ${statusLabels[newStatus]}` })
    } catch {
      setOrders(prev => prev.map(o => o.id === os.id ? { ...o, status: os.status } : o))
      toast({ title: "Erro ao atualizar status", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const loadComments = async (osId: string) => {
    const studioId = getStudioId()
    if (!studioId || comments[osId]) return
    setLoadingComments(osId)
    try {
      const res = await fetch(`/api/agroflowai/os/${osId}/history?studioId=${studioId}`)
      const data = await res.json()
      const mapped = (Array.isArray(data) ? data : []).map((h: any) => ({
        id: h.id,
        text: h.content,
        author: h.author_name || "Equipe",
        date: new Date(h.created_at).toLocaleString("pt-BR"),
      }))
      setComments(prev => ({ ...prev, [osId]: mapped }))
    } catch {
      setComments(prev => ({ ...prev, [osId]: [] }))
    } finally {
      setLoadingComments(null)
    }
  }

  const handleSendComment = async (osId: string) => {
    if (!commentText.trim()) return
    setSendingComment(true)
    try {
      const user = JSON.parse(localStorage.getItem("workflow_user") || "{}")
      const studioId = getStudioId()
      const res = await fetch(`/api/agroflowai/os/${osId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          content: commentText.trim(),
          authorName: user.name || user.email || "Equipe",
          authorId: user.id || null,
        }),
      })
      if (!res.ok) throw new Error("Erro ao salvar comentário")
      const saved = await res.json()
      const newComment = {
        id: saved.id,
        text: saved.content,
        author: saved.author_name || "Equipe",
        date: new Date(saved.created_at).toLocaleString("pt-BR"),
      }
      setComments(prev => ({ ...prev, [osId]: [...(prev[osId] || []), newComment] }))
      setCommentText("")
      toast({ title: "Comentário salvo!" })
    } catch {
      toast({ title: "Erro ao salvar comentário", variant: "destructive" })
    } finally {
      setSendingComment(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_name || !form.type) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const studioId = getStudioId()
      const res = await fetch("/api/agroflowai/os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, ...form, type: form.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar OS")
      setOrders(prev => [data, ...prev])
      toast({ title: "Ordem de Serviço criada!", description: `${data.code} - ${form.client_name}` })
      setShowForm(false)
      setForm({ client_name: "", property_name: "", type: "laudo_car", description: "", scheduled_date: "", assigned_to: "" })
    } catch (err: any) {
      toast({ title: "Erro ao criar OS", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const filtered = orders.filter(os => {
    const matchSearch = os.client_name.toLowerCase().includes(search.toLowerCase()) ||
      os.code.toLowerCase().includes(search.toLowerCase()) ||
      (os.property_name || "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || os.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    in_progress: orders.filter(o => o.status === "in_progress").length,
    completed: orders.filter(o => o.status === "completed").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Ordens de Serviço</h1>
          <p className="text-slate-400 mt-1">Gerencie laudos, vistorias e serviços ambientais</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova OS
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "all", label: `Todas (${counts.all})` },
          { key: "pending", label: `Pendentes (${counts.pending})` },
          { key: "in_progress", label: `Em Andamento (${counts.in_progress})` },
          { key: "completed", label: `Concluídas (${counts.completed})` },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              filterStatus === f.key
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Buscar por cliente, código ou propriedade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-slate-900 z-10">
              <CardTitle className="text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                Nova Ordem de Serviço
              </CardTitle>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cliente / Propriedade *</label>
                  <Input
                    value={form.client_name}
                    onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                    placeholder="Nome do cliente ou fazenda"
                    required
                    className="bg-slate-800 border-slate-700 text-white rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Setor / Área (opcional)</label>
                  <Input
                    value={form.property_name}
                    onChange={(e) => setForm({ ...form, property_name: e.target.value })}
                    placeholder="Ex: Setor A, Gleba Norte..."
                    className="bg-slate-800 border-slate-700 text-white rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Serviço *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(typeLabels) as [OSType, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, type: key })}
                        className={cn(
                          "py-2.5 px-3 rounded-xl text-xs font-bold text-left border transition-all",
                          form.type === key
                            ? "border-emerald-500 bg-emerald-600/20 text-emerald-400"
                            : "border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data Prevista</label>
                    <Input
                      type="date"
                      value={form.scheduled_date}
                      onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Responsável</label>
                    <Input
                      value={form.assigned_to}
                      onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                      placeholder="Nome do engenheiro/técnico"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detalhes do serviço..."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-slate-700 text-slate-400">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar OS"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["pending", "in_progress", "completed", "cancelled"] as OSStatus[]).map(s => {
          const st = statusConfig[s]
          return (
            <Card key={s} className={cn("bg-slate-900/50 border-l-4 border-slate-800", st.border)}>
              <CardContent className="p-4">
                <p className={cn("text-2xl font-black", st.color)}>{counts[s]}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{st.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">
              {search ? "Nenhuma OS encontrada" : "Nenhuma OS cadastrada ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((os) => {
            const st = statusConfig[os.status]
            const isExpanded = expandedId === os.id
            const isUpdating = updatingId === os.id
            const osComments = comments[os.id] || []
            return (
              <Card key={os.id} className={cn("bg-slate-900/50 border-l-4 border-slate-800 transition-colors", st.border)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-500 font-mono">{os.code}</span>
                        <Badge className={cn("text-[10px] font-bold border-0", st.color, st.bg)}>{st.label}</Badge>
                        <Badge className="text-[10px] font-bold border-0 text-violet-400 bg-violet-400/10">{typeLabels[os.type as OSType] || os.type}</Badge>
                        {osComments.length > 0 && (
                          <Badge className="text-[10px] font-bold border-0 text-slate-400 bg-slate-400/10">
                            <MessageSquare className="w-2.5 h-2.5 mr-1" />{osComments.length}
                          </Badge>
                        )}
                      </div>
                      <p className="font-bold text-white truncate">{os.client_name}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                        {os.property_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{os.property_name}</span>}
                        {os.scheduled_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{os.scheduled_date}</span>}
                        {os.assigned_to && <span className="flex items-center gap-1"><User className="w-3 h-3" />{os.assigned_to}</span>}
                      </div>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : (
                        <>
                          {os.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(os, "in_progress")}
                              className="h-7 px-2 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/20 rounded-lg font-bold"
                            >
                              <Play className="w-3 h-3 mr-1" /> Iniciar
                            </Button>
                          )}
                          {os.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(os, "completed")}
                              className="h-7 px-2 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Concluir
                            </Button>
                          )}
                          {(os.status === "pending" || os.status === "in_progress") && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(os, "cancelled")}
                              className="h-7 w-7 p-0 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg"
                              title="Cancelar OS"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => {
                          const next = isExpanded ? null : os.id
                          setExpandedId(next)
                          if (next) loadComments(next)
                        }}
                        className="p-1.5 text-slate-500 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: description + comments */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                      {os.description && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Descrição</p>
                          <p className="text-sm text-slate-300">{os.description}</p>
                        </div>
                      )}

                      {/* Comments */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3" /> Histórico / Comentários
                        </p>
                        {loadingComments === os.id ? (
                          <p className="text-xs text-slate-600 italic flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Carregando histórico...</p>
                        ) : osComments.length === 0 ? (
                          <p className="text-xs text-slate-600 italic">Nenhum comentário ainda</p>
                        ) : (
                          <div className="space-y-2 mb-3">
                            {osComments.map(c => (
                              <div key={c.id} className="flex gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-emerald-400 text-[10px] font-black">{c.author.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 bg-slate-800/60 rounded-xl p-2.5">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-300">{c.author}</span>
                                    <span className="text-[10px] text-slate-600">{c.date}</span>
                                  </div>
                                  <p className="text-xs text-slate-400">{c.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            placeholder="Adicionar atualização ou comentário..."
                            className="bg-slate-800 border-slate-700 text-white rounded-xl text-sm h-9"
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(os.id) } }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSendComment(os.id)}
                            disabled={sendingComment || !commentText.trim()}
                            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex-shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
