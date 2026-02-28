"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, ClipboardList, Clock, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const COLORS = ["border-l-pink-500", "border-l-violet-500", "border-l-indigo-500", "border-l-emerald-500", "border-l-amber-500"]

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null)
  const [todayClasses, setTodayClasses] = useState<any[]>([])
  const [stats, setStats] = useState({ turmasHoje: 0, totalAlunos: 0, chamadasFeitas: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (!u) { setLoading(false); return }

      const studioId = u.user_metadata?.studio_id

      // Buscar o ID do professional para filtrar as turmas
      const { data: prof } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', u.id)
        .maybeSingle()

      if (!studioId) { setLoading(false); return }

      const todayDow = new Date().getDay()

      try {
        const params = new URLSearchParams({ studioId })
        if (prof?.id) params.set('teacherId', prof.id)

        const res = await fetch(`/api/dance-studio/classes?${params}`)
        const data = await res.json()
        const all: any[] = data.classes || []

        // Filtrar turmas que têm horário hoje
        const hoje = all.filter((cls: any) =>
          (cls.schedule || []).some((s: any) => s.day_of_week === todayDow)
        ).map((cls: any) => {
          const slot = cls.schedule.find((s: any) => s.day_of_week === todayDow)
          return { ...cls, startTime: slot?.start_time ?? '—' }
        })

        setTodayClasses(hoje)
        setStats({
          turmasHoje: hoje.length,
          totalAlunos: all.reduce((acc: number, c: any) => acc + (c.enrolledCount || 0), 0),
          chamadasFeitas: 0, // poderia buscar attendance count — simplificado
        })
      } catch {
        // sem turmas
      }
      setLoading(false)
    }
    load()
  }, [])

  const name = user?.user_metadata?.name?.split(' ')[0] || 'Professor'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Olá, {name}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Painel do Professor — {DAY_NAMES[new Date().getDay()]}
          </p>
        </div>
        <Link href="/solutions/estudio-de-danca/teacher/chamada">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20">
            <ClipboardList className="w-4 h-4 mr-2" />
            Fazer Chamada
          </Button>
        </Link>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Turmas Hoje", value: loading ? '—' : String(stats.turmasHoje), icon: Calendar, color: "text-pink-600 bg-pink-100 dark:bg-pink-600/20" },
          { label: "Total Alunos", value: loading ? '—' : String(stats.totalAlunos), icon: Users, color: "text-violet-600 bg-violet-100 dark:bg-violet-600/20" },
          { label: "Chamadas Feitas", value: loading ? '—' : String(stats.chamadasFeitas), icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-600/20" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
            <CardContent className="p-4 text-center">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2", s.color)}>
                <s.icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold uppercase text-slate-400 mt-0.5 leading-tight">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aulas de hoje */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-pink-600" />
            Aulas de Hoje
          </CardTitle>
          <Link href="/solutions/estudio-de-danca/teacher/turmas">
            <Button variant="ghost" size="sm" className="text-pink-600 font-bold text-xs">
              Ver todas <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
            </div>
          ) : todayClasses.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Sem aulas hoje</p>
            </div>
          ) : (
            todayClasses.map((turma, i) => (
              <div key={turma.id} className={cn("p-4 rounded-xl bg-slate-50 dark:bg-white/5 border-l-4", COLORS[i % COLORS.length])}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{turma.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{turma.startTime}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{turma.enrolledCount} alunos</span>
                      {turma.dance_style && (
                        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400 border-0 text-[10px] font-bold">
                          {turma.dance_style}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Link href={`/solutions/estudio-de-danca/teacher/chamada?classId=${turma.id}`}>
                    <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs">
                      Chamada
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
