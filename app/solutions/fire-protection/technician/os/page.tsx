"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ClipboardList,
  Wrench,
  Calendar,
  Building2,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ChecklistItem {
  id: string
  title: string
  status: "pending" | "completed" | "failed"
  order_index: number
  category?: string
}

interface OS {
  id: string
  tracking_code: string
  title: string
  description?: string
  observations?: string
  status: string
  priority?: string
  project_type: string
  scheduled_at?: string
  opened_at?: string
  finished_at?: string
  conformidade_score?: number
  customer?: { id: string; name: string; phone?: string; email?: string; address?: string }
  milestones?: ChecklistItem[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open:        { label: "Aberta",         color: "bg-amber-100 text-amber-700" },
  in_progress: { label: "Em Andamento",   color: "bg-blue-100 text-blue-700" },
  finished:    { label: "Concluída",      color: "bg-emerald-100 text-emerald-700" },
  nao_conforme:{ label: "Não Conforme",   color: "bg-rose-100 text-rose-700" },
  cancelled:   { label: "Cancelada",      color: "bg-slate-100 text-slate-600" },
}

const prioridadeBorder: Record<string, string> = {
  urgente: "border-l-rose-600",
  alta:    "border-l-orange-500",
  normal:  "border-l-slate-300",
}

function formatDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function OSDetailDialog({
  os,
  open,
  onClose,
  onUpdated,
}: {
  os: OS
  open: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [observations, setObservations] = useState("")
  const [score, setScore] = useState<number>(100)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (os && open) {
      setChecklist((os.milestones || []).map(m => ({ ...m })))
      setObservations(os.observations || "")
      const completedCount = (os.milestones || []).filter(m => m.status === "completed").length
      const total = (os.milestones || []).length
      setScore(total > 0 ? Math.round((completedCount / total) * 100) : 100)
    }
  }, [os, open])

  const isVistoria = os.project_type === "vistoria"
  const canAct = os.status === "open" || os.status === "in_progress"

  const toggleCheckItem = (id: string) => {
    setChecklist(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item
        const next = item.status === "completed" ? "pending" : item.status === "pending" ? "failed" : "completed"
        return { ...item, status: next as ChecklistItem["status"] }
      })
      const completedCount = updated.filter(m => m.status === "completed").length
      setScore(updated.length > 0 ? Math.round((completedCount / updated.length) * 100) : 100)
      return updated
    })
  }

  const handleSave = async (newStatus: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/fire-protection/technician/os/${os.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: newStatus,
          observations,
          conformidade_score: isVistoria ? score : undefined,
          checklist_updates: isVistoria ? checklist.map(c => ({ id: c.id, status: c.status })) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar")
      toast({ title: "OS atualizada com sucesso!" })
      onUpdated()
      onClose()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const checkStatusColor = (status: string) => {
    if (status === "completed") return "text-emerald-600 bg-emerald-50"
    if (status === "failed") return "text-rose-600 bg-rose-50"
    return "text-slate-500 bg-slate-50"
  }

  const checkStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    if (status === "failed") return <XCircle className="w-4 h-4 text-rose-600" />
    return <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isVistoria ? <Calendar className="w-5 h-5 text-red-600" /> : <Wrench className="w-5 h-5 text-orange-600" />}
            {os.title}
            <span className="text-xs font-mono text-slate-400">#{os.tracking_code}</span>
          </DialogTitle>
          <DialogDescription>
            {isVistoria ? "Vistoria de segurança contra incêndio" : "Ordem de serviço técnico"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cliente / Endereço */}
          {os.customer && (
            <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Building2 className="w-4 h-4 text-red-600" />
                  {os.customer.name}
                </div>
                {os.customer.address && (
                  <div className="flex items-start gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {os.customer.address}
                  </div>
                )}
                {os.customer.phone && (
                  <a href={`tel:${os.customer.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Phone className="w-4 h-4" />
                    {os.customer.phone}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Agendamento */}
          {os.scheduled_at && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4 text-red-600" />
              <span>Agendada para: <strong>{formatDate(os.scheduled_at)}</strong></span>
            </div>
          )}

          {/* Descrição */}
          {os.description && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Descrição</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{os.description}</p>
            </div>
          )}

          {/* Checklist de Vistoria */}
          {isVistoria && checklist.length > 0 && canAct && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Checklist de Conformidade
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-black",
                    score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600"
                  )}>
                    {score}%
                  </span>
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500")}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {(expanded ? checklist : checklist.slice(0, 6)).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleCheckItem(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      item.status === "completed" ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10" :
                      item.status === "failed" ? "border-rose-200 bg-rose-50 dark:bg-rose-900/10" :
                      "border-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {checkStatusIcon(item.status)}
                    <span className={cn(
                      "text-sm font-medium",
                      item.status === "completed" ? "text-emerald-700 dark:text-emerald-400" :
                      item.status === "failed" ? "text-rose-700 dark:text-rose-400" :
                      "text-slate-700 dark:text-slate-300"
                    )}>
                      {item.title}
                    </span>
                  </button>
                ))}
                {checklist.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-xs text-red-600 font-bold flex items-center justify-center gap-1 py-2"
                  >
                    {expanded ? <><ChevronUp className="w-3 h-3" />Mostrar menos</> : <><ChevronDown className="w-3 h-3" />Ver mais {checklist.length - 6} itens</>}
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">Toque para alternar: ⬜ Pendente → ✓ Conforme → ✗ Não conforme</p>
            </div>
          )}

          {/* Observações */}
          {canAct && (
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isVistoria ? "Laudo / Observações da Vistoria" : "Observações do Serviço"}
              </Label>
              <Textarea
                className="mt-1.5 resize-none"
                rows={3}
                placeholder="Descreva o que foi realizado, condições encontradas, recomendações..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
          )}

          {/* Se já finalizado, mostrar observações */}
          {!canAct && os.observations && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Laudo / Observações</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">{os.observations}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={saving}>Fechar</Button>
          {os.status === "open" && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              onClick={() => handleSave("in_progress")}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wrench className="w-4 h-4 mr-2" />}
              Iniciar Atendimento
            </Button>
          )}
          {os.status === "in_progress" && (
            <>
              {isVistoria && score < 80 && (
                <Button
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  onClick={() => handleSave("nao_conforme")}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Não Conforme
                </Button>
              )}
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={() => handleSave("finished")}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Concluir {isVistoria ? "Vistoria" : "OS"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TechnicianOSPage() {
  const [osList, setOsList] = useState<OS[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("pendentes")
  const [selected, setSelected] = useState<OS | null>(null)
  const { toast } = useToast()

  const fetchOS = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/technician/os?tipo=all", { credentials: "include" })
      const data = await res.json()
      setOsList(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Erro ao carregar OS", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchOS() }, [fetchOS])

  const filtered = osList.filter(os =>
    (os.tracking_code || "").toLowerCase().includes(search.toLowerCase()) ||
    (os.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (os.customer?.name || "").toLowerCase().includes(search.toLowerCase())
  )

  const pendentes  = filtered.filter(o => o.status === "open")
  const andamento  = filtered.filter(o => o.status === "in_progress")
  const concluidas = filtered.filter(o => o.status === "finished" || o.status === "nao_conforme")

  const tabData: Record<string, OS[]> = { pendentes, andamento, concluidas }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-orange-600" />
            Minhas OS
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {pendentes.length} pendentes · {andamento.length} em andamento
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchOS} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pendentes", value: pendentes.length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10" },
          { label: "Em Andamento", value: andamento.length, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10" },
          { label: "Concluídas", value: concluidas.length, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className={cn("p-4 text-center", s.bg)}>
              <p className={cn("text-3xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por código, cliente ou tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="pendentes" className="flex-1">
            Pendentes {pendentes.length > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px] h-4 min-w-[16px] px-1">{pendentes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="andamento" className="flex-1">
            Em Andamento {andamento.length > 0 && <Badge className="ml-1 bg-blue-600 text-white text-[10px] h-4 min-w-[16px] px-1">{andamento.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="concluidas" className="flex-1">Concluídas</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          </div>
        ) : (
          (["pendentes", "andamento", "concluidas"] as const).map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {tabData[tab].length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Nenhuma OS aqui</p>
                </div>
              ) : (
                tabData[tab].map(os => {
                  const st = statusConfig[os.status] ?? statusConfig.open
                  const border = prioridadeBorder[os.priority ?? "normal"] ?? "border-l-slate-300"
                  const isVistoria = os.project_type === "vistoria"
                  return (
                    <Card
                      key={os.id}
                      className={cn(
                        "border-l-4 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md cursor-pointer transition-shadow",
                        border
                      )}
                      onClick={() => setSelected(os)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-lg">
                                #{os.tracking_code}
                              </span>
                              <Badge className={cn("text-xs border-0", st.color)}>{st.label}</Badge>
                              {isVistoria && (
                                <Badge className="text-xs border-0 bg-red-100 text-red-700">Vistoria</Badge>
                              )}
                              {os.priority === "urgente" && (
                                <Badge className="text-xs border-0 bg-rose-100 text-rose-700">
                                  <AlertCircle className="w-3 h-3 mr-1" />Urgente
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{os.title}</h3>
                            {os.customer && (
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />{os.customer.name}
                              </p>
                            )}
                            {os.scheduled_at && (
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />{formatDate(os.scheduled_at)}
                              </p>
                            )}
                          </div>
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            isVistoria ? "bg-red-50 dark:bg-red-900/20" : "bg-orange-50 dark:bg-orange-900/20"
                          )}>
                            {isVistoria
                              ? <Calendar className="w-5 h-5 text-red-600" />
                              : <Wrench className="w-5 h-5 text-orange-600" />
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          ))
        )}
      </Tabs>

      {/* Detail Dialog */}
      {selected && (
        <OSDetailDialog
          os={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { fetchOS(); setSelected(null) }}
        />
      )}
    </div>
  )
}
