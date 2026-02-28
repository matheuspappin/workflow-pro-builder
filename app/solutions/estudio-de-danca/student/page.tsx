"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, CheckCircle2, AlertCircle, Clock, ArrowRight, Star, Music, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const COLORS = ["border-l-pink-500", "border-l-violet-500", "border-l-indigo-500", "border-l-emerald-500"]

export default function StudentHome() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [financeiro, setFinanceiro] = useState<{ pendente: number; vencido: number; hasDebito: boolean }>({ pendente: 0, vencido: 0, hasDebito: false })
  const [turmas, setTurmas] = useState<any[]>([])
  const [frequencia, setFrequencia] = useState<{ percent: number; totalMes: number } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (!u) { setLoading(false); return }

      const studioId = u.user_metadata?.studio_id
      const studentId = u.id

      await Promise.all([
        // Turmas matriculadas
        (async () => {
          try {
            const res = await fetch(`/api/dance-studio/classes?studioId=${studioId}&studentId=${studentId}`)
            const data = await res.json()
            setTurmas(data.classes || [])
          } catch { /* sem turmas */ }
        })(),

        // Financeiro — busca cobranças do estúdio relacionadas ao aluno
        (async () => {
          if (!studioId) return
          try {
            const res = await fetch(`/api/fire-protection/financeiro?studioId=${studioId}`)
            const data = await res.json()
            if (Array.isArray(data)) {
              // Filtra cobranças relacionadas a este aluno (se tiver student_name ou student_id)
              const pendentes = data.filter((p: any) => p.status === 'pendente' || p.status === 'pending')
              const vencidos = data.filter((p: any) => p.status === 'vencido' || p.status === 'overdue')
              const totalPendente = pendentes.reduce((s: number, p: any) => s + Number(p.valor || p.amount || 0), 0)
              const totalVencido = vencidos.reduce((s: number, p: any) => s + Number(p.valor || p.amount || 0), 0)
              setFinanceiro({ pendente: totalPendente, vencido: totalVencido, hasDebito: totalPendente > 0 || totalVencido > 0 })
            }
          } catch { /* sem cobranças */ }
        })(),

        // Frequência do mês
        (async () => {
          try {
            const now = new Date()
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

            const { data: attendances } = await supabase
              .from('attendance')
              .select('status, date')
              .eq('student_id', studentId)
              .gte('date', firstDay)
              .lte('date', lastDay)

            if (attendances && attendances.length > 0) {
              const presentes = attendances.filter(a => a.status === 'present').length
              const percent = Math.round((presentes / attendances.length) * 100)
              setFrequencia({ percent, totalMes: presentes })
            }
          } catch { /* sem frequência */ }
        })(),
      ])

      setLoading(false)
    }
    load()
  }, [])

  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'Aluno'

  // Próximas aulas baseadas no schedule das turmas
  const todayDow = new Date().getDay()
  const proximasAulas = turmas
    .flatMap((t: any) =>
      (t.schedule || []).map((s: any) => ({
        name: t.name,
        day: DAY_NAMES[s.day_of_week],
        dow: s.day_of_week,
        time: s.start_time ?? '—',
        teacher: t.teacherName,
        color: COLORS[turmas.indexOf(t) % COLORS.length],
      }))
    )
    .sort((a, b) => {
      const da = (a.dow - todayDow + 7) % 7
      const db = (b.dow - todayDow + 7) % 7
      return da - db || a.time.localeCompare(b.time)
    })
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-2xl p-6 text-white">
        <p className="text-violet-200 text-sm font-bold uppercase tracking-widest mb-1">Bem-vindo de volta</p>
        <h1 className="text-2xl font-black tracking-tight">Olá, {firstName}! 👋</h1>
        <p className="text-violet-100/80 text-sm mt-2">Veja seu resumo de hoje</p>
      </div>

      {/* Resumo rápido */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-600/20 flex items-center justify-center mx-auto mb-2">
                <Star className="w-5 h-5 text-violet-600" />
              </div>
              <p className="text-2xl font-black text-violet-600">
                {frequencia ? `${frequencia.percent}%` : '—'}
              </p>
              <p className="text-xs font-bold uppercase text-slate-400 mt-0.5">Frequência</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-600/20 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600">
                {frequencia ? frequencia.totalMes : '—'}
              </p>
              <p className="text-xs font-bold uppercase text-slate-400 mt-0.5">Aulas no mês</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Débito/mensalidade */}
      {!loading && financeiro.hasDebito && (
        <Card className={cn(
          "border",
          financeiro.vencido > 0
            ? "border-rose-200 dark:border-rose-600/20 bg-rose-50 dark:bg-rose-600/5"
            : "border-amber-200 dark:border-amber-600/20 bg-amber-50 dark:bg-amber-600/5"
        )}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
              financeiro.vencido > 0
                ? "bg-rose-100 dark:bg-rose-600/20"
                : "bg-amber-100 dark:bg-amber-600/20"
            )}>
              <AlertCircle className={cn("w-5 h-5", financeiro.vencido > 0 ? "text-rose-600" : "text-amber-600")} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {financeiro.vencido > 0 ? 'Mensalidade Vencida' : 'Mensalidade Pendente'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                R$ {(financeiro.vencido > 0 ? financeiro.vencido : financeiro.pendente)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Link href="/solutions/estudio-de-danca/student/financeiro">
              <Button size="sm" className={cn(
                "font-bold rounded-xl text-white text-xs",
                financeiro.vencido > 0 ? "bg-rose-500 hover:bg-rose-600" : "bg-amber-500 hover:bg-amber-600"
              )}>
                Pagar
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Próximas aulas */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-violet-600" />
              Próximas Aulas
            </h3>
            <Link href="/solutions/estudio-de-danca/student/turmas">
              <Button variant="ghost" size="sm" className="text-violet-600 text-xs font-bold h-7">
                Ver todas <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-violet-600" /></div>
          ) : proximasAulas.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma turma matriculada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proximasAulas.map((aula, i) => (
                <div key={i} className={cn("p-3 rounded-xl bg-slate-50 dark:bg-white/5 border-l-4", aula.color)}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{aula.name}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {aula.time}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{aula.day} • {aula.teacher}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Turmas matriculadas (resumo) */}
      {!loading && turmas.length > 0 && (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="p-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm mb-4">
              <Music className="w-4 h-4 text-pink-500" />
              Minhas Turmas
            </h3>
            <div className="space-y-2">
              {turmas.slice(0, 3).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.scheduleSummary}</p>
                  </div>
                  {t.dance_style && (
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400 border-0 text-[10px] font-bold">
                      {t.dance_style}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
