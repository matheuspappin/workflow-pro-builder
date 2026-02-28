"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp, Plus, Search, Phone, Mail, MapPin,
  X, Loader2, ArrowRight, UserPlus, MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type LeadStatus = 'new' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  region?: string
  interest: string
  status: LeadStatus
  estimated_value?: number
  created_at: string
  notes?: string
}

const statusConfig: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: "Novo", color: "text-blue-400", bg: "bg-blue-400/10" },
  contacted: { label: "Contatado", color: "text-violet-400", bg: "bg-violet-400/10" },
  proposal: { label: "Proposta Enviada", color: "text-amber-400", bg: "bg-amber-400/10" },
  negotiation: { label: "Em Negociação", color: "text-orange-400", bg: "bg-orange-400/10" },
  won: { label: "Convertido", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  lost: { label: "Perdido", color: "text-red-400", bg: "bg-red-400/10" },
}

// Mapeamento entre etapa da API e status da UI
const etapaToStatus: Record<string, LeadStatus> = {
  novo: "new",
  qualificado: "contacted",
  proposta: "proposal",
  negociacao: "negotiation",
  ganho: "won",
  perdido: "lost",
}

const statusToEtapa: Record<LeadStatus, string> = {
  new: "novo",
  contacted: "qualificado",
  proposal: "proposta",
  negotiation: "negociacao",
  won: "ganho",
  lost: "perdido",
}

const STAGE_ORDER: LeadStatus[] = ["new", "contacted", "proposal", "negotiation", "won", "lost"]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    region: "",
    interest: "",
    estimated_value: "",
    notes: "",
  })

  const getStudioId = () => {
    try { return JSON.parse(localStorage.getItem("workflow_user") || "{}").studioId || "" } catch { return "" }
  }

  useEffect(() => {
    const studioId = getStudioId()
    if (!studioId) { setLoading(false); return }
    fetch(`/api/agroflowai/leads?studioId=${studioId}`)
      .then(r => r.json())
      .then(data => {
        const mapped: Lead[] = (Array.isArray(data) ? data : []).map((l: any) => ({
          id: l.id,
          name: l.nome,
          email: l.email || "",
          phone: l.telefone || "",
          region: l.origem || "",
          interest: l.notes || "Interesse em compliance ambiental",
          status: etapaToStatus[l.etapa] || "new",
          estimated_value: l.valor_estimado || 0,
          created_at: l.criado,
        }))
        setLeads(mapped)
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) {
      toast({ title: "Informe o nome do lead", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const studioId = getStudioId()
      const res = await fetch("/api/agroflowai/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, nome: form.name, email: form.email, telefone: form.phone, origem: form.region || "Direto", valor_estimado: form.estimated_value ? Number(form.estimated_value) : 0, notes: form.interest }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar lead")
      const newLead: Lead = {
        id: data.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        region: form.region,
        interest: form.interest,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
        status: "new",
        created_at: new Date().toLocaleDateString("pt-BR"),
      }
      setLeads(prev => [newLead, ...prev])
      toast({ title: "Lead adicionado ao CRM!" })
      setShowForm(false)
      setForm({ name: "", email: "", phone: "", region: "", interest: "", estimated_value: "", notes: "" })
    } catch (err: any) {
      toast({ title: "Erro ao criar lead", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "")
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15)
  }

  const moveToStage = async (leadId: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
    toast({ title: "Status atualizado!", description: statusConfig[newStatus].label })
    try {
      const studioId = getStudioId()
      await fetch("/api/agroflowai/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, studioId, etapa: statusToEtapa[newStatus] }),
      })
    } catch {}
  }

  const handleConvertToClient = async (lead: Lead) => {
    if (!confirm(`Converter "${lead.name}" em cliente? Isso criará um cadastro de proprietário rural.`)) return
    try {
      const studioId = getStudioId()
      const res = await fetch("/api/agroflowai/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          property_location: lead.region || "",
          car_status: "pendente",
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao converter")
      }
      // Mark lead as won
      await moveToStage(lead.id, "won")
      toast({
        title: "Lead convertido em cliente!",
        description: `${lead.name} foi cadastrado como proprietário rural.`,
      })
    } catch (err: any) {
      toast({ title: "Erro ao converter lead", description: err.message, variant: "destructive" })
    }
  }

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.region || "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || l.status === filterStatus
    return matchSearch && matchStatus
  })

  const pipeline = STAGE_ORDER.slice(0, 4).map(s => ({
    status: s,
    count: leads.filter(l => l.status === s).length,
    value: leads.filter(l => l.status === s).reduce((a, l) => a + (l.estimated_value || 0), 0),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Leads / CRM</h1>
          <p className="text-slate-400 mt-1">Pipeline de captação de novos clientes</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {pipeline.map(p => {
          const st = statusConfig[p.status]
          return (
            <Card key={p.status} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <Badge className={cn("text-[10px] font-bold border-0 mb-2", st.color, st.bg)}>{st.label}</Badge>
                <p className={cn("text-2xl font-black", st.color)}>{p.count}</p>
                <p className="text-xs text-slate-500 font-bold">
                  R$ {p.value.toLocaleString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Buscar leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", filterStatus === "all" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}
          >
            Todos ({leads.length})
          </button>
          {STAGE_ORDER.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", filterStatus === s ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}
            >
              {statusConfig[s].label} ({leads.filter(l => l.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Novo Lead
              </CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do prospect" required className="bg-slate-800 border-slate-700 text-white rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@..." className="bg-slate-800 border-slate-700 text-white rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Telefone</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" className="bg-slate-800 border-slate-700 text-white rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Região</label>
                    <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Cidade, UF" className="bg-slate-800 border-slate-700 text-white rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor Estimado</label>
                    <Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} placeholder="R$ 0" className="bg-slate-800 border-slate-700 text-white rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interesse / Serviço</label>
                  <Input value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} placeholder="Ex: Regularização CAR, Laudo..." className="bg-slate-800 border-slate-700 text-white rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observações</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas sobre o lead..." rows={2} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-slate-700 text-slate-400">Cancelar</Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Lead"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leads List */}
      {filtered.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">Nenhum lead encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const st = statusConfig[lead.status]
            const currentIdx = STAGE_ORDER.indexOf(lead.status)
            const nextStatus = STAGE_ORDER[currentIdx + 1] as LeadStatus | undefined
            return (
              <Card key={lead.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-400 font-black text-lg">{lead.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-white">{lead.name}</p>
                        <Badge className={cn("text-[10px] font-bold border-0", st.color, st.bg)}>{st.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        {lead.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.region}</span>}
                      </div>
                      {lead.interest && <p className="text-xs text-indigo-400 font-bold mt-1.5">{lead.interest}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {lead.estimated_value ? (
                        <p className="text-emerald-400 font-black text-sm">
                          R$ {lead.estimated_value.toLocaleString("pt-BR")}
                        </p>
                      ) : null}
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {lead.phone && (
                          <a
                            href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}?text=Olá ${lead.name}, tudo bem? Sou da consultoria ambiental e gostaria de conversar sobre os serviços.`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" className="h-7 w-7 p-0 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/20 rounded-lg" title="WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                        {nextStatus && nextStatus !== "lost" && nextStatus !== "won" && (
                          <Button
                            size="sm"
                            onClick={() => moveToStage(lead.id, nextStatus)}
                            className="h-7 px-2 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/20 rounded-lg"
                          >
                            {statusConfig[nextStatus].label} <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        {/* Convert to client button when in negotiation or won */}
                        {(lead.status === "negotiation" || lead.status === "won") && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertToClient(lead)}
                            className="h-7 px-2 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold"
                          >
                            <UserPlus className="w-3 h-3 mr-1" /> Converter
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
