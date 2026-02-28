"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Plus, Search, Phone, Mail, Calendar, Copy, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [studioSlug, setStudioSlug] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null

      const stored = localStorage.getItem("danceflow_user")
      if (stored) {
        const parsed = JSON.parse(stored)
        setStudioSlug(parsed.studioSlug || parsed.studio_slug || "")
      }

      if (sid) {
        try {
          const res = await fetch(`/api/fire-protection/technicians?studioId=${sid}`)
          const data = await res.json()
          setProfessores(Array.isArray(data) ? data : [])
        } catch {
          toast({ title: "Erro ao carregar professores", variant: "destructive" })
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = professores.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCopyInvite = async () => {
    if (!studioSlug) return
    const link = `${window.location.origin}/s/${studioSlug}/join?role=professional`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast({ title: "Link copiado!", description: "Compartilhe com o professor." })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-pink-500" />
            Professores
          </h1>
          <p className="text-slate-500 text-sm mt-1">Equipe docente do estúdio</p>
        </div>
        <div className="flex gap-2">
          {studioSlug && (
            <Button
              variant="outline"
              onClick={handleCopyInvite}
              className="font-bold rounded-xl border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copiado!" : "Convidar"}
            </Button>
          )}
          <Button className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20">
            <Plus className="w-4 h-4 mr-2" />
            Novo Professor
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar professor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 h-11 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              {search ? "Nenhum professor encontrado" : "Nenhum professor cadastrado"}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Convide professores compartilhando o link de cadastro.
            </p>
            {studioSlug && (
              <Button onClick={handleCopyInvite} className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl">
                <Copy className="w-4 h-4 mr-2" /> Copiar Link de Convite
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((prof) => (
            <Card key={prof.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-pink-600/10 flex items-center justify-center font-black text-pink-600 text-lg flex-shrink-0">
                    {prof.name?.[0]?.toUpperCase() || "P"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{prof.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {prof.email && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="w-3 h-3" /> {prof.email}
                        </span>
                      )}
                      {prof.phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {prof.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-600/20 dark:text-pink-400 border-0 text-xs font-bold flex-shrink-0">
                  Professor
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
