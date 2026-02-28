"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Plus, Search, Phone, Mail, Calendar, Loader2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const stageMap: Record<string, { label: string; color: string }> = {
  new:        { label: "Novo",        color: "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400" },
  contacted:  { label: "Contactado",  color: "bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400" },
  interested: { label: "Interessado", color: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
  converted:  { label: "Convertido",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  lost:       { label: "Perdido",     color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null
      if (sid) {
        try {
          const res = await fetch(`/api/fire-protection/leads?studioId=${sid}`)
          const data = await res.json()
          setLeads(Array.isArray(data) ? data : [])
        } catch {
          // sem leads ainda
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = leads.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Leads / CRM
          </h1>
          <p className="text-slate-500 text-sm mt-1">Captação e acompanhamento de novos alunos</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Kanban resumido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(stageMap).filter(([k]) => k !== 'lost').map(([stage, info]) => {
          const count = leads.filter(l => l.stage === stage || (!l.stage && stage === 'new')).length
          return (
            <Card key={stage} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{count}</p>
                <Badge className={cn("mt-1 text-xs font-bold border-0", info.color)}>{info.label}</Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar lead..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 h-11 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <UserPlus className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              {search ? "Nenhum lead encontrado" : "Nenhum lead cadastrado"}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Registre interessados para acompanhar e converter em alunos.
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Cadastrar Lead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((lead) => {
            const stage = stageMap[lead.stage] ?? stageMap.new
            return (
              <Card key={lead.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-indigo-600/10 flex items-center justify-center font-black text-indigo-600 text-base flex-shrink-0">
                      {lead.name?.[0]?.toUpperCase() || "L"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{lead.name}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {lead.email && <span className="flex items-center gap-1 text-xs text-slate-500"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1 text-xs text-slate-500"><Phone className="w-3 h-3" />{lead.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={cn("text-xs font-bold border-0", stage.color)}>{stage.label}</Badge>
                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs font-bold rounded-lg text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                      Contatar
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
