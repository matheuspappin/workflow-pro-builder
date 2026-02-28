"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Wrench, Search, Phone, Mail, MapPin,
  ChevronRight, Loader2, Copy, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Tecnico {
  id: string
  name: string
  email: string
  phone: string
  region?: string
  specialty?: string
  status: 'active' | 'inactive'
  total_os?: number
}

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [studioSlug, setStudioSlug] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTecnicos()
  }, [])

  async function loadTecnicos() {
    setLoading(true)
    try {
      const stored = localStorage.getItem("workflow_user")
      if (!stored) return
      const parsed = JSON.parse(stored)
      const sid = parsed.studioId || parsed.studio_id
      const slug = parsed.studioSlug || parsed.studio_slug || ""
      setStudioSlug(slug)
      if (!sid) return

      const res = await fetch(`/api/agroflowai/tecnicos?studioId=${sid}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setTecnicos(data.map((t: any) => ({
          id: t.id,
          name: t.name,
          email: t.email || "",
          phone: t.phone || "",
          region: t.region || "",
          specialty: t.specialty || "Técnico Ambiental",
          status: t.status || "active",
          total_os: t.total_os || 0,
        })))
      }
    } catch {
      setTecnicos([])
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!studioSlug) {
      toast({ title: "Slug não encontrado", variant: "destructive" })
      return
    }
    // Use type=technician to distinguish from engineers
    const link = `${window.location.origin}/s/${studioSlug}/join?role=professional&type=technician`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast({ title: "Link de convite para Técnico de Campo copiado!" })
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = tecnicos.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Técnicos de Campo</h1>
          <p className="text-slate-400 mt-1">Gerencie os técnicos ambientais que atuam em campo</p>
        </div>
        <Button
          onClick={handleCopyInvite}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg"
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copiado!" : "Copiar Link de Convite"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Buscar técnicos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: String(tecnicos.length), color: "text-blue-400" },
          { label: "Ativos", value: String(tecnicos.filter(t => t.status === "active").length), color: "text-emerald-400" },
          { label: "Em Campo Hoje", value: "0", color: "text-orange-400" },
        ].map(s => (
          <Card key={s.label} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">
              {search ? "Nenhum técnico encontrado" : "Nenhum técnico cadastrado ainda"}
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Use o link de convite para adicionar técnicos de campo
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((tec) => (
            <Card key={tec.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-black text-lg">{tec.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white truncate">{tec.name}</p>
                      <Badge className={cn(
                        "text-[10px] font-bold border-0 flex-shrink-0",
                        tec.status === "active" ? "text-emerald-400 bg-emerald-400/10" : "text-slate-400 bg-slate-400/10"
                      )}>
                        {tec.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {tec.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{tec.email}</span>}
                      {tec.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{tec.phone}</span>}
                      {tec.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tec.region}</span>}
                      {tec.specialty && <span className="text-blue-400">{tec.specialty}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">OS</p>
                      <p className="font-black text-white">{tec.total_os || 0}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
