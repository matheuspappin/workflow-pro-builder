"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  HardHat,
  Search,
  Phone,
  Mail,
  Building2,
  Loader2,
  FolderKanban,
  BarChart3,
  ChevronRight,
  Flame,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Professional {
  id: string
  name: string
  phone?: string
  email?: string
  professional_type: string
}

interface ServiceOrder {
  id: string
  title: string
  status: string
  professional_id?: string
  project_type?: string
  tracking_code?: string
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending_acceptance: { label: "Aguardando", className: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
  open:              { label: "Aberto", className: "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400" },
  in_progress:       { label: "Em Andamento", className: "bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400" },
  waiting_parts:     { label: "Aguardando Peças", className: "bg-orange-100 text-orange-700 dark:bg-orange-600/20 dark:text-orange-400" },
  finished:          { label: "Concluído", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  cancelled:        { label: "Cancelado", className: "bg-slate-100 text-slate-600 dark:bg-slate-600/20 dark:text-slate-400" },
}

export default function EngenheirosPage() {
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState<string | null>(null)
  const [engineers, setEngineers] = useState<Professional[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid)
      if (!sid) {
        setLoading(false)
        return
      }
      try {
        const [engRes, osRes] = await Promise.all([
          fetch(`/api/fire-protection/technicians?studioId=${sid}&type=engineer`),
          fetch(`/api/fire-protection/os?studioId=${sid}`),
        ])
        const engData = await engRes.json()
        const osData = await osRes.json()
        setEngineers(Array.isArray(engData) ? engData : [])
        setOrders(Array.isArray(osData) ? osData : [])
      } catch {
        setEngineers([])
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getStatsForProfessional = (profId: string) => {
    const profOrders = orders.filter((o) => o.professional_id === profId)
    const pending = profOrders.filter((o) => o.status === "pending_acceptance" || o.status === "open").length
    const inProgress = profOrders.filter((o) => o.status === "in_progress" || o.status === "waiting_parts").length
    const finished = profOrders.filter((o) => o.status === "finished").length
    const total = profOrders.length
    const progress = total > 0 ? Math.round((finished / total) * 100) : 0
    return { pending, inProgress, finished, total, progress }
  }

  const filtered = engineers.filter((e) =>
    (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.email || "").toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <HardHat className="w-6 h-6 text-red-600" />
            Engenheiros
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Engenheiros vinculados à sua empresa e progresso dos projetos PPCI
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {engineers.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="py-12 text-center">
            <HardHat className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum engenheiro vinculado</p>
            <p className="text-sm text-slate-400 mt-1">
              Convide engenheiros via links de convite nas Ordens de Serviço (projetos PPCI)
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((eng) => {
            const stats = getStatsForProfessional(eng.id)
            return (
              <Card
                key={eng.id}
                className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                        {(eng.name || "E").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{eng.name || "Sem nome"}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <HardHat className="w-3 h-3" />
                          Engenheiro PPCI
                        </p>
                      </div>
                    </div>
                  </div>
                  {(eng.phone || eng.email) && (
                    <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {eng.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{eng.phone}</span>
                        </div>
                      )}
                      {eng.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{eng.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Progresso dos Projetos</span>
                      <span className="text-sm font-black text-red-600">{stats.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mt-3">
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats.pending + stats.inProgress}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Ativos</p>
                      </div>
                      <div>
                        <p className="text-base font-black text-emerald-500">{stats.finished}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Concluídos</p>
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats.total}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
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
