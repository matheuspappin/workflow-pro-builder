"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, GraduationCap, Music, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const COLORS = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
]

export default function StudentTurmasPage() {
  const [turmas, setTurmas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const studioId = user.user_metadata?.studio_id
      const studentId = user.id

      try {
        const res = await fetch(`/api/dance-studio/classes?studioId=${studioId}&studentId=${studentId}`)
        const data = await res.json()
        setTurmas(data.classes || [])
      } catch { /* sem turmas */ }

      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-violet-600" />
          Minhas Turmas
        </h1>
        <p className="text-slate-500 text-sm mt-1">Aulas em que você está matriculado</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : turmas.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Music className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              Nenhuma turma encontrada
            </h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Fale com a recepção do estúdio para realizar sua matrícula.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {turmas.map((turma: any, i: number) => (
            <Card key={turma.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className={cn("h-1.5 bg-gradient-to-r", COLORS[i % COLORS.length])} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">{turma.name}</h3>
                    {turma.dance_style && (
                      <p className="text-xs text-slate-500 mt-0.5">{turma.dance_style}</p>
                    )}
                  </div>
                  {turma.level && (
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400 border-0 text-xs font-bold">
                      {turma.level}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <GraduationCap className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>{turma.teacherName}</span>
                  </div>

                  {/* Horários */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(turma.schedule || []).map((s: any, si: number) => (
                      <div key={si} className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-1.5">
                        <Clock className="w-3.5 h-3.5 text-pink-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {DAY_NAMES[s.day_of_week]} {s.start_time}
                        </span>
                        {s.duration_minutes && (
                          <span className="text-[10px] text-slate-400">({s.duration_minutes}min)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {turma.enrolledAt && (
                  <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-bold">
                    Matriculado em {new Date(turma.enrolledAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
