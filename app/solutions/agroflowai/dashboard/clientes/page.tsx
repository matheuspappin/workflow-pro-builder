"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users, Plus, Search, Phone, Mail, MapPin, ClipboardList,
  Loader2, X, Copy, Check, Pencil, Trash2,
  AlertTriangle, CheckCircle2, Clock, MessageCircle, Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Cliente {
  id: string
  name: string
  email: string
  phone: string
  property_name: string
  property_location: string
  car_status: "regularizado" | "em_processo" | "pendente" | "irregular"
  status: "active" | "inactive"
  total_os: number
  created_at: string
}

const CAR_STATUS = {
  regularizado: { label: "Regularizado",  color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  em_processo:  { label: "Em Processo",   color: "text-blue-400",   bg: "bg-blue-400/10",   icon: Clock },
  pendente:     { label: "Pendente",      color: "text-amber-400",  bg: "bg-amber-400/10",  icon: AlertTriangle },
  irregular:    { label: "Irregular",     color: "text-red-400",    bg: "bg-red-400/10",    icon: AlertTriangle },
}

type CarStatus = "regularizado" | "em_processo" | "pendente" | "irregular"
const EMPTY_FORM: { name: string; email: string; phone: string; property_name: string; property_location: string; car_status: CarStatus } = {
  name: "", email: "", phone: "",
  property_name: "", property_location: "",
  car_status: "pendente",
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCAR, setFilterCAR] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [saving, setSaving] = useState(false)
  const [studioId, setStudioId] = useState("")
  const [studioSlug, setStudioSlug] = useState("")
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const { toast } = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const stored = localStorage.getItem("workflow_user")
      if (!stored) return
      const parsed = JSON.parse(stored)
      const sid = parsed.studioId || parsed.studio_id
      const slug = parsed.studioSlug || parsed.studio_slug || ""
      setStudioId(sid || "")
      setStudioSlug(slug)
      if (!sid) return
      const res = await fetch(`/api/agroflowai/clientes?studioId=${sid}`)
      const data = await res.json()
      if (Array.isArray(data)) setClientes(data)
    } catch {
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!studioSlug) { toast({ title: "Slug não encontrado", variant: "destructive" }); return }
    const link = `${window.location.origin}/s/${studioSlug}/join?role=client`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast({ title: "Link de convite do cliente copiado!" })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      toast({ title: "Nome e e-mail são obrigatórios", variant: "destructive" }); return
    }
    setSaving(true)
    try {
      const method = editing ? "PATCH" : "POST"
      const payload = editing ? { id: editing.id, studioId, ...form } : { studioId, ...form }
      const res = await fetch("/api/agroflowai/clientes", {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: editing ? "Cliente atualizado!" : "Cliente cadastrado!" })
      setShowForm(false)
      load()
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: Cliente) => {
    if (!confirm(`Desativar cliente "${c.name}"?`)) return
    try {
      await fetch(`/api/agroflowai/clientes?id=${c.id}&studioId=${studioId}`, { method: "DELETE" })
      toast({ title: "Cliente desativado" })
      setClientes(prev => prev.filter(cl => cl.id !== c.id))
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" })
    }
  }

  const openEdit = (c: Cliente) => {
    setEditing(c)
    setForm({
      name: c.name, email: c.email, phone: c.phone,
      property_name: c.property_name, property_location: c.property_location,
      car_status: c.car_status,
    })
    setShowForm(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const filtered = clientes.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.property_name.toLowerCase().includes(search.toLowerCase()) ||
      c.property_location.toLowerCase().includes(search.toLowerCase())
    const matchCAR = filterCAR === "all" || c.car_status === filterCAR
    return matchSearch && matchCAR
  })

  const stats = {
    total: clientes.length,
    regularizado: clientes.filter(c => c.car_status === "regularizado").length,
    pendente: clientes.filter(c => c.car_status === "pendente" || c.car_status === "irregular").length,
    osAbertas: clientes.reduce((acc, c) => acc + (c.total_os || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Clientes / Proprietários</h1>
          <p className="text-slate-400 mt-1">Proprietários rurais atendidos pela consultoria</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleCopyInvite}
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-white rounded-xl font-bold"
          >
            {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copiado!" : "Link de Convite"}
          </Button>
          <Button
            onClick={openNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total de Clientes", value: stats.total, color: "text-emerald-400" },
          { label: "CAR Regularizado", value: stats.regularizado, color: "text-teal-400" },
          { label: "CAR Pendente / Irregular", value: stats.pendente, color: "text-amber-400" },
          { label: "OS em Aberto", value: stats.osAbertas, color: "text-blue-400" },
        ].map(s => (
          <Card key={s.label} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome, e-mail ou propriedade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {[{ key: "all", label: "Todos" }, ...Object.entries(CAR_STATUS).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterCAR(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  filterCAR === f.key ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-slate-900 z-10 border-b border-slate-800 pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                {editing ? "Editar Cliente" : "Novo Proprietário Rural"}
              </CardTitle>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Completo *</label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="João da Silva"
                    required
                    className="bg-slate-800 border-slate-700 text-white rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail *</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      required
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Telefone / WhatsApp</label>
                    <Input
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome da Propriedade</label>
                    <Input
                      value={form.property_name}
                      onChange={e => setForm({ ...form, property_name: e.target.value })}
                      placeholder="Ex: Fazenda Boa Esperança"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Localização</label>
                    <Input
                      value={form.property_location}
                      onChange={e => setForm({ ...form, property_location: e.target.value })}
                      placeholder="Cidade, UF"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status do CAR</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(CAR_STATUS) as [keyof typeof CAR_STATUS, (typeof CAR_STATUS)[keyof typeof CAR_STATUS]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, car_status: key })}
                        className={cn(
                          "py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left",
                          form.car_status === key
                            ? "border-emerald-500 bg-emerald-600/20 text-emerald-400"
                            : "border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600"
                        )}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-slate-700 text-slate-400">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">
              {search || filterCAR !== "all" ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
            </p>
            <p className="text-slate-600 text-sm mt-2">
              {search || filterCAR !== "all"
                ? "Tente outros filtros"
                : "Cadastre proprietários rurais ou convide via link"}
            </p>
            {!search && filterCAR === "all" && (
              <Button type="button" onClick={openNew} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
                <Plus className="w-4 h-4 mr-1" /> Cadastrar Primeiro Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const carCfg = CAR_STATUS[c.car_status] || CAR_STATUS.pendente
            const CarIcon = carCfg.icon
            return (
              <Card key={c.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 font-black text-lg">{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-white">{c.name}</p>
                        <Badge className={cn("text-[10px] font-bold border-0", carCfg.color, carCfg.bg)}>
                          <CarIcon className="w-2.5 h-2.5 mr-1" />{carCfg.label}
                        </Badge>
                        {c.total_os > 0 && (
                          <Badge className="text-[10px] font-bold border-0 text-amber-400 bg-amber-400/10">
                            <ClipboardList className="w-2.5 h-2.5 mr-1" />{c.total_os} OS abertas
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                        {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                        {c.property_name && (
                          <span className="flex items-center gap-1 text-emerald-400/80">
                            <MapPin className="w-3 h-3" />{c.property_name}
                          </span>
                        )}
                        {c.property_location && <span className="text-slate-600">{c.property_location}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {c.phone && (
                        <a
                          href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Contatar via WhatsApp"
                        >
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-400 hover:bg-green-400/10">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(c)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-700"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(c)}
                        className="h-8 w-8 p-0 text-red-500/60 hover:text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
