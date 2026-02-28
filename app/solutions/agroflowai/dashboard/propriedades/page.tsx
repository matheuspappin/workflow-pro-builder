"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MapPin, Plus, Leaf, Ruler, Hash, Loader2, X,
  Search, Trees, Users, AlertTriangle, CheckCircle2,
  Trash2, Pencil, Filter, ExternalLink, Map,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Propriedade {
  id: string
  name: string
  total_area_ha: string
  city: string
  state: string
  car_number: string
  car_status: 'regularizado' | 'em_processo' | 'pendente' | 'irregular'
  biome: string
  notes: string
  customer_id: string | null
  customer_name: string
  created_at: string
}

interface Cliente {
  id: string
  name: string
}

const CAR_STATUS = {
  regularizado: { label: "Regularizado", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  em_processo:  { label: "Em Processo",   color: "text-blue-400",   bg: "bg-blue-400/10",   icon: Loader2 },
  pendente:     { label: "Pendente",      color: "text-amber-400",  bg: "bg-amber-400/10",  icon: AlertTriangle },
  irregular:    { label: "Irregular",     color: "text-red-400",    bg: "bg-red-400/10",    icon: AlertTriangle },
}

const BIOMES = ["Cerrado", "Mata Atlântica", "Amazônia", "Caatinga", "Pampa", "Pantanal"]

type CarStatus = 'regularizado' | 'em_processo' | 'pendente' | 'irregular'
const EMPTY_FORM: { name: string; total_area_ha: string; city: string; state: string; car_number: string; car_status: CarStatus; biome: string; notes: string; customer_id: string } = {
  name: "", total_area_ha: "", city: "", state: "",
  car_number: "", car_status: "pendente",
  biome: "", notes: "", customer_id: "",
}

export default function PropriedadesPage() {
  const [propriedades, setPropriedades] = useState<Propriedade[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Propriedade | null>(null)
  const [saving, setSaving] = useState(false)
  const [studioId, setStudioId] = useState("")
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
      if (!sid) return
      setStudioId(sid)

      const [propsRes, clientsRes] = await Promise.all([
        fetch(`/api/agroflowai/propriedades?studioId=${sid}`),
        fetch(`/api/agroflowai/clientes?studioId=${sid}`),
      ])

      const propsData = await propsRes.json()
      const clientsData = await clientsRes.json()

      if (Array.isArray(propsData)) setPropriedades(propsData)
      if (Array.isArray(clientsData)) setClientes(clientsData.map((c: any) => ({ id: c.id, name: c.name })))
    } catch {
      setPropriedades([])
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(prop: Propriedade) {
    setEditing(prop)
    setForm({
      name: prop.name,
      total_area_ha: prop.total_area_ha,
      city: prop.city,
      state: prop.state,
      car_number: prop.car_number,
      car_status: prop.car_status,
      biome: prop.biome,
      notes: prop.notes,
      customer_id: prop.customer_id || "",
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) {
      toast({ title: "Nome da propriedade é obrigatório", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, studioId }
      const url = editing ? `/api/agroflowai/propriedades/${editing.id}` : "/api/agroflowai/propriedades"
      const method = editing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast({ title: editing ? "Propriedade atualizada!" : "Propriedade cadastrada!" })
      setShowForm(false)
      load()
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (prop: Propriedade) => {
    if (!confirm(`Excluir "${prop.name}"?`)) return
    try {
      const res = await fetch(`/api/agroflowai/propriedades/${prop.id}?studioId=${studioId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast({ title: "Propriedade removida" })
      setPropriedades(prev => prev.filter(p => p.id !== prop.id))
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" })
    }
  }

  const filtered = propriedades.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.car_number.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || p.car_status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: propriedades.length,
    regularizado: propriedades.filter(p => p.car_status === "regularizado").length,
    pendente: propriedades.filter(p => p.car_status === "pendente").length,
    area: propriedades.reduce((acc, p) => acc + (parseFloat(p.total_area_ha) || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Propriedades Rurais</h1>
          <p className="text-slate-400 mt-1">Gerencie fazendas, sítios e glebas do portfólio</p>
        </div>
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20">
          <Plus className="w-4 h-4 mr-2" /> Nova Propriedade
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total de Propriedades", value: String(stats.total), color: "text-emerald-400" },
          { label: "Regularizadas (CAR)", value: String(stats.regularizado), color: "text-teal-400" },
          { label: "CAR Pendente", value: String(stats.pendente), color: "text-amber-400" },
          { label: "Área Total (ha)", value: stats.area > 0 ? stats.area.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—", color: "text-blue-400" },
        ].map(stat => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome, município, CAR ou proprietário..."
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
                onClick={() => setFilterStatus(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  filterStatus === f.key ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
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
          <Card className="w-full max-w-xl bg-slate-900 border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-slate-900 z-10 pb-4 border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-400" />
                {editing ? "Editar Propriedade" : "Nova Propriedade Rural"}
              </CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome da Propriedade *</label>
                    <Input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Fazenda Boa Esperança"
                      required
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>

                  {/* Proprietário */}
                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Proprietário / Cliente</label>
                    <select
                      value={form.customer_id}
                      onChange={e => setForm({ ...form, customer_id: e.target.value })}
                      className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 text-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Selecione um cliente (opcional)</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Área */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Área Total (ha)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.total_area_ha}
                      onChange={e => setForm({ ...form, total_area_ha: e.target.value })}
                      placeholder="Ex: 350.5"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>

                  {/* Bioma */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bioma</label>
                    <select
                      value={form.biome}
                      onChange={e => setForm({ ...form, biome: e.target.value })}
                      className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 text-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Selecione o bioma</option>
                      {BIOMES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  {/* Município */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Município</label>
                    <Input
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="Ex: Ribeirão Preto"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>

                  {/* Estado */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</label>
                    <Input
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })}
                      placeholder="SP"
                      maxLength={2}
                      className="bg-slate-800 border-slate-700 text-white rounded-xl uppercase"
                    />
                  </div>

                  {/* CAR */}
                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Código CAR</label>
                    <Input
                      value={form.car_number}
                      onChange={e => setForm({ ...form, car_number: e.target.value })}
                      placeholder="Ex: SP-3543402-xxxxxxxxxxxxxxx"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl font-mono text-sm"
                    />
                  </div>

                  {/* Status CAR */}
                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status CAR</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(Object.entries(CAR_STATUS) as [keyof typeof CAR_STATUS, typeof CAR_STATUS[keyof typeof CAR_STATUS]][]).map(([key, cfg]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm({ ...form, car_status: key })}
                          className={cn(
                            "py-2 px-3 rounded-xl text-xs font-bold border transition-all",
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

                  {/* Observações */}
                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observações Internas</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Informações adicionais sobre a propriedade..."
                      rows={3}
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 text-white px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-slate-700 text-slate-400">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Atualizar" : "Cadastrar Propriedade"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trees className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">
              {search || filterStatus !== "all" ? "Nenhuma propriedade encontrada" : "Nenhuma propriedade cadastrada ainda"}
            </p>
            <p className="text-slate-600 text-sm mt-2">
              {search || filterStatus !== "all"
                ? "Tente outros filtros de busca"
                : "Cadastre fazendas, sítios e glebas para acompanhar o compliance ambiental"}
            </p>
            {!search && filterStatus === "all" && (
              <Button onClick={openNew} className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Cadastrar Primeira Propriedade
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((prop) => {
            const st = CAR_STATUS[prop.car_status] || CAR_STATUS.pendente
            const StatusIcon = st.icon
            return (
              <Card key={prop.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-5">
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{prop.name}</p>
                        {(prop.city || prop.state) && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {[prop.city, prop.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={cn("text-[10px] font-bold border-0", st.color, st.bg)}>
                        {st.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-500 mb-4">
                    {prop.total_area_ha && (
                      <span className="flex items-center gap-1.5">
                        <Ruler className="w-3 h-3 text-teal-400 flex-shrink-0" />
                        <span>{parseFloat(prop.total_area_ha).toLocaleString("pt-BR")} ha</span>
                      </span>
                    )}
                    {prop.biome && (
                      <span className="flex items-center gap-1.5">
                        <Trees className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span>{prop.biome}</span>
                      </span>
                    )}
                    {prop.customer_name && (
                      <span className="flex items-center gap-1.5 col-span-2">
                        <Users className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{prop.customer_name}</span>
                      </span>
                    )}
                    {prop.car_number && (
                      <span className="flex items-center gap-1.5 col-span-2">
                        <Hash className="w-3 h-3 text-violet-400 flex-shrink-0" />
                        <span className="font-mono truncate">{prop.car_number}</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800 flex-wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(prop)}
                      className="flex-1 h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                    </Button>
                    {/* SICAR link */}
                    {prop.car_number && (
                      <a
                        href={`https://www.car.gov.br/publico/imoveis/index?codigo=${prop.car_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Verificar no SICAR"
                      >
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-violet-400 hover:bg-violet-400/10 rounded-lg">
                          <ExternalLink className="w-3 h-3 mr-1" /> SICAR
                        </Button>
                      </a>
                    )}
                    {/* OpenStreetMap link */}
                    {(prop.city || prop.state) && (
                      <a
                        href={`https://www.openstreetmap.org/search?query=${encodeURIComponent([prop.name, prop.city, prop.state].filter(Boolean).join(", "))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no mapa"
                      >
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-teal-400 hover:bg-teal-400/10 rounded-lg">
                          <Map className="w-3 h-3 mr-1" /> Mapa
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(prop)}
                      className="h-8 px-3 text-xs text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
