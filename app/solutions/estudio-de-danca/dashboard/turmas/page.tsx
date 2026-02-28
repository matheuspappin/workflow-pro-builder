"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Clock, Users, GraduationCap, Loader2, Music } from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-cyan-500",
]

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStyle, setActiveStyle] = useState<string | null>(null)
  const [studioId, setStudioId] = useState<string | null>(null)
  const [styles, setStyles] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid)
      if (!sid) { setLoading(false); return }

      try {
        const res = await fetch(`/api/dance-studio/classes?studioId=${sid}`)
        const data = await res.json()
        const list = data.classes || []
        setTurmas(list)

        const uniqueStyles = [...new Set(list.map((c: any) => c.dance_style).filter(Boolean))] as string[]
        setStyles(uniqueStyles)
      } catch {
        // sem turmas ainda
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = activeStyle
    ? turmas.filter(t => t.dance_style === activeStyle)
    : turmas

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-violet-600" />
            Turmas & Aulas
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie todas as turmas do estúdio</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Nova Turma
        </Button>
      </div>

      {/* Filtro por modalidade */}
      {styles.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveStyle(null)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-bold transition-all",
              !activeStyle
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white"
            )}
          >
            Todas
          </button>
          {styles.map(s => (
            <button
              key={s}
              onClick={() => setActiveStyle(s)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold transition-all",
                activeStyle === s
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Music className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              {activeStyle ? `Nenhuma turma de ${activeStyle}` : "Nenhuma turma cadastrada"}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {activeStyle ? "Tente outro filtro ou crie uma nova turma." : "Crie sua primeira turma para começar."}
            </p>
            {!activeStyle && (
              <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Criar Turma
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((turma, i) => (
            <Card key={turma.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-lg transition-all overflow-hidden">
              <div className={cn("h-2 bg-gradient-to-r", COLORS[i % COLORS.length])} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">{turma.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{turma.dance_style ?? '—'}</p>
                  </div>
                  {turma.level && (
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400 border-0 text-xs font-bold">
                      {turma.level}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <GraduationCap className="w-4 h-4 text-violet-500" />
                    <span>{turma.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4 text-pink-500" />
                    <span>{turma.scheduleSummary}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>{turma.enrolledCount} {turma.enrolledCount === 1 ? 'aluno' : 'alunos'}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs font-bold border-violet-200 text-violet-600 hover:bg-violet-50">
                    Fazer Chamada
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs font-bold">
                    Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
