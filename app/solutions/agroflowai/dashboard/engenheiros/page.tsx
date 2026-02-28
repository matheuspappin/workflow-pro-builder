"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  PencilRuler, Plus, Search, Phone, Mail, ClipboardList,
  ChevronRight, Loader2, X, Copy, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Engenheiro {
  id: string
  name: string
  email: string
  phone: string
  crea?: string
  specialty?: string
  status: 'active' | 'inactive'
  total_os?: number
}

export default function EngenheirosPage() {
  const [engenheiros, setEngenheiros] = useState<Engenheiro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [studioSlug, setStudioSlug] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadEngenheiros()
  }, [])

  async function loadEngenheiros() {
    setLoading(true)
    try {
      const stored = localStorage.getItem("workflow_user")
      if (!stored) return
      const parsed = JSON.parse(stored)
      const sid = parsed.studioId || parsed.studio_id
      const slug = parsed.studioSlug || parsed.studio_slug || ""
      setStudioSlug(slug)
      if (!sid) return

      const res = await fetch(`/api/agroflowai/engenheiros?studioId=${sid}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setEngenheiros(data.map((e: any) => ({
          id: e.id,
          name: e.name,
          email: e.email || "",
          phone: e.phone || "",
          crea: e.crea || "",
          specialty: e.specialty || "Engenharia Ambiental",
          status: e.status || "active",
          total_os: e.total_os || 0,
        })))
      }
    } catch {
      setEngenheiros([])
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!studioSlug) {
      toast({ title: "Slug não encontrado", variant: "destructive" })
      return
    }
    // Use role=engineer for engineers (distinct from technicians)
    const link = `${window.location.origin}/s/${studioSlug}/join?role=professional&type=engineer`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast({ title: "Link de convite para Engenheiro copiado!" })
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = engenheiros.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.crea || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Engenheiros Ambientais</h1>
          <p className="text-slate-400 mt-1">Gerencie os engenheiros da sua consultoria</p>
        </div>
        <Button
          onClick={handleCopyInvite}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg"
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copiado!" : "Copiar Link de Convite"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Buscar por nome, e-mail ou CREA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: String(engenheiros.length), color: "text-teal-400" },
          { label: "Ativos", value: String(engenheiros.filter(e => e.status === "active").length), color: "text-emerald-400" },
          { label: "OS este Mês", value: String(engenheiros.reduce((a, e) => a + (e.total_os || 0), 0)), color: "text-blue-400" },
        ].map(s => (
          <Card key={s.label} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite Banner */}
      <Card className="bg-gradient-to-r from-teal-900/50 to-emerald-900/50 border border-teal-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
            <PencilRuler className="w-5 h-5 text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Convide Engenheiros via Link</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Compartilhe o link de convite para que engenheiros se cadastrem diretamente na sua consultoria
            </p>
          </div>
          <Button
            onClick={handleCopyInvite}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? "Copiado" : "Copiar link"}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PencilRuler className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">
              {search ? "Nenhum engenheiro encontrado" : "Nenhum engenheiro cadastrado ainda"}
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Use o link de convite acima para adicionar engenheiros à sua consultoria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((eng) => (
            <Card key={eng.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-400 font-black text-lg">{eng.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white truncate">{eng.name}</p>
                      <Badge className={cn(
                        "text-[10px] font-bold border-0 flex-shrink-0",
                        eng.status === "active" ? "text-emerald-400 bg-emerald-400/10" : "text-slate-400 bg-slate-400/10"
                      )}>
                        {eng.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {eng.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{eng.email}</span>}
                      {eng.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{eng.phone}</span>}
                      {eng.crea && <span className="flex items-center gap-1"><PencilRuler className="w-3 h-3" />CREA: {eng.crea}</span>}
                      {eng.specialty && <span className="flex items-center gap-1 text-teal-400">{eng.specialty}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">OS</p>
                      <p className="font-black text-white">{eng.total_os || 0}</p>
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
