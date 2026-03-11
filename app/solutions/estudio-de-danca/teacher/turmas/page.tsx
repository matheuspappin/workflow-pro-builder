"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, ClipboardList, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface TeacherClass {
  id: string
  name: string
  dance_style?: string | null
  level?: string | null
  schedule?: { day_of_week: number; start_time: string; end_time?: string | null }[]
  enrolledCount: number
}

const COLORS = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
]

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export default function TeacherTurmasPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const studioId = user.user_metadata?.studio_id
      if (!studioId) { setLoading(false); return }

      // Descobrir o professional vinculado a este usuário
      const { data: prof } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      try {
        const params = new URLSearchParams({ studioId })
        if (prof?.id) params.set("teacherId", prof.id)

        const res = await fetch(`/api/dance-studio/classes?${params.toString()}`)
        const data = await res.json()
        const list: TeacherClass[] = (data.classes || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          dance_style: c.dance_style,
          level: c.level,
          schedule: c.schedule || [],
          enrolledCount: c.enrolledCount ?? 0,
        }))
        setClasses(list)
      } catch {
        setClasses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatSchedule = (schedule: TeacherClass["schedule"]) => {
    if (!schedule || schedule.length === 0) return "Horário a definir"
    return schedule
      .map((s) => {
        const day = DAY_NAMES[s.day_of_week] ?? "?"
        return `${day} ${s.start_time}`
      })
      .join(", ")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-pink-600" />
          Minhas Turmas
        </h1>
        <p className="text-slate-500 text-sm mt-1">Turmas sob sua responsabilidade</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
        </div>
      ) : classes.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nenhuma turma encontrada para o seu usuário.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((turma, index) => (
            <Card
              key={turma.id}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-lg transition-all overflow-hidden"
            >
              <div className={cn("h-2 bg-gradient-to-r", COLORS[index % COLORS.length])} />
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">{turma.name}</h3>
                    {turma.dance_style && (
                      <p className="text-xs text-slate-500 mt-0.5">{turma.dance_style}</p>
                    )}
                  </div>
                  {turma.level && (
                    <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-600/20 dark:text-pink-400 border-0 text-xs font-bold">
                      {turma.level}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-500" />
                    <span>{formatSchedule(turma.schedule)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-500" />
                    <span>{turma.enrolledCount} {turma.enrolledCount === 1 ? "aluno" : "alunos"}</span>
                  </div>
                </div>

                <Link href={`/solutions/estudio-de-danca/teacher/chamada?classId=${turma.id}`}>
                  <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-sm">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Fazer Chamada
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
