"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MapPin, Plus, TreePine, Leaf, Ruler, Hash,
  Loader2, X, CheckCircle2, AlertTriangle, Trees,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface Property {
  id: string
  name: string
  total_area_ha: string
  city: string
  state: string
  car_number: string
  car_status: "regularizado" | "em_processo" | "pendente" | "irregular"
  biome: string
  created_at: string
}

const statusLabels = {
  regularizado: { label: "Regularizado",      color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  em_processo:  { label: "Em Regularização",  color: "text-blue-400",   bg: "bg-blue-400/10",   icon: Loader2 },
  pendente:     { label: "Pendente",           color: "text-amber-400",  bg: "bg-amber-400/10",  icon: AlertTriangle },
  irregular:    { label: "Irregular",          color: "text-red-400",    bg: "bg-red-400/10",    icon: AlertTriangle },
}

const EMPTY_FORM = { name: "", total_area_ha: "", city: "", state: "", car_number: "", biome: "" }

export default function ClientPropriedadesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [studioId, setStudioId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)
  const { toast } = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const stored = localStorage.getItem("workflow_user")
      if (!stored) return
      const parsed = JSON.parse(stored)
      const sid = parsed.studioId || parsed.studio_id
      const cid = parsed.customerId || parsed.customer_id || user.id
      if (!sid) return

      setStudioId(sid)
      setCustomerId(cid)

      const res = await fetch(`/api/agroflowai/propriedades?studioId=${sid}&customerId=${cid}`)
      const data = await res.json()
      if (Array.isArray(data)) setProperties(data)
    } catch {
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) {
      toast({ title: "Informe o nome da propriedade", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/agroflowai/propriedades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          studioId,
          customer_id: customerId || null,
          car_status: form.car_number ? "em_processo" : "pendente",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: "Propriedade cadastrada!", description: form.name })
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const totalArea = properties.reduce((acc, p) => acc + (parseFloat(p.total_area_ha) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Minhas Propriedades</h1>
          <p className="text-slate-400 mt-1">Gerencie as áreas rurais cadastradas</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
      </div>

      {/* Stats */}
      {properties.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Propriedades", value: String(properties.length), color: "text-emerald-400" },
            { label: "Regularizadas", value: String(properties.filter(p => p.car_status === "regularizado").length), color: "text-teal-400" },
            { label: "Área Total (ha)", value: totalArea > 0 ? totalArea.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—", color: "text-blue-400" },
          ].map(s => (
            <Card key={s.label} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> Nova Propriedade
              </CardTitle>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome da Propriedade *</label>
                    <Input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Fazenda Boa Vista"
                      required
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Área (ha)</label>
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
                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Município</label>
                    <Input
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="Ex: Ribeirão Preto"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Código CAR (se houver)</label>
                    <Input
                      value={form.car_number}
                      onChange={e => setForm({ ...form, car_number: e.target.value })}
                      placeholder="SP-3543402-..."
                      className="bg-slate-800 border-slate-700 text-white rounded-xl font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-slate-700 text-slate-400">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
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
      ) : properties.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TreePine className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">Nenhuma propriedade cadastrada</p>
            <p className="text-slate-600 text-sm mt-1">Adicione suas propriedades rurais para acompanhar o compliance</p>
            <Button onClick={() => setShowForm(true)} className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Propriedade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {properties.map(prop => {
            const st = statusLabels[prop.car_status] || statusLabels.pendente
            const StatusIcon = st.icon
            return (
              <Card key={prop.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{prop.name}</p>
                        {(prop.city || prop.state) && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {[prop.city, prop.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={cn("text-[10px] font-bold border-0 flex-shrink-0", st.color, st.bg)}>
                      {st.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    {prop.total_area_ha && (
                      <span className="flex items-center gap-1.5">
                        <Ruler className="w-3 h-3 text-teal-400" />
                        {parseFloat(prop.total_area_ha).toLocaleString("pt-BR")} ha
                      </span>
                    )}
                    {prop.biome && (
                      <span className="flex items-center gap-1.5">
                        <Trees className="w-3 h-3 text-green-400" />
                        {prop.biome}
                      </span>
                    )}
                    {prop.car_number && (
                      <span className="flex items-center gap-1.5 col-span-2 truncate">
                        <Hash className="w-3 h-3 text-violet-400 flex-shrink-0" />
                        <span className="font-mono truncate">{prop.car_number}</span>
                      </span>
                    )}
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
