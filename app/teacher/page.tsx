"use client"

import { useState, useEffect } from "react"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

import { useVocabulary } from "@/hooks/use-vocabulary"

export default function TeacherDashboard() {
  const { vocabulary } = useVocabulary()
  const [teacherData, setTeacherData] = useState<any>(null)
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingPayments: 0,
    nextClass: null as any
  })
  const [loading, setLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState<string | null>(null)
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today')
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([])

  const handleCancelClass = async (classId: string, scheduledDate: string) => {
    try {
      setIsCancelling(classId)
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId
      
      const { data, error } = await supabase.rpc('cancel_class_session', {
        p_class_id: classId,
        p_date: scheduledDate,
        p_studio_id: studioId,
        p_teacher_id: teacherData.id
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Aula Cancelada",
          description: data.message,
        })
        // Recarregar dados
        window.location.reload()
      } else {
        toast({
          title: "Erro",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (e: any) {
      toast({
        title: "Erro técnico",
        description: e.message,
        variant: "destructive"
      })
    } finally {
      setIsCancelling(null)
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const userStr = localStorage.getItem("danceflow_user")
        if (!userStr) return
        const user = JSON.parse(userStr)
        
        // Dados do professor já vêm do layout, mas carregamos localmente para as queries
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        setTeacherData(teacher || user)
        const teacherId = teacher?.id

        if (teacherId) {
          // ... rest of data loading logic remains same ...
          // Re-implementing logic to keep it fresh
          const { data: classes } = await supabase
            .from('classes')
            .select('*')
            .eq('teacher_id', teacherId)
            .eq('status', 'active')

          const { data: finances } = await supabase
            .from('teacher_finances')
            .select('total_amount')
            .eq('teacher_id', teacherId)
            .eq('payment_status', 'pending')

          const pendingAmount = finances?.reduce((sum, f) => sum + parseFloat(f.total_amount), 0) || 0

          const today = new Date().toISOString().split('T')[0]
          const { data: sessions } = await supabase
            .from('sessions')
            .select(`*, class:classes(name, dance_style)`)
            .eq('actual_teacher_id', teacherId)
            .gte('scheduled_date', today)
            .order('scheduled_date', { ascending: true })
            .limit(3)

          setStats({
            totalClasses: classes?.length || 0,
            totalStudents: classes?.reduce((sum, c) => sum + (c.current_students || 0), 0) || 0,
            pendingPayments: pendingAmount,
            nextClass: sessions?.[0] || null
          })
          setUpcomingClasses(sessions || [])

          const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
          const weekData = []
          for (const c of (classes || [])) {
            if (c.schedule && Array.isArray(c.schedule)) {
              for (const s of c.schedule) {
                weekData.push({
                  ...c,
                  day_of_week: s.day_of_week,
                  start_time: s.start_time,
                  day_name: dayNames[s.day_of_week]
                })
              }
            }
          }
          weekData.sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
            return a.start_time.localeCompare(b.start_time)
          })
          setWeeklySchedule(weekData)
        }
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return null

  if (!teacherData?.studio_id) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 mb-6">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Bem-vindo, {vocabulary.provider}!</h1>
        <p className="text-slate-500 max-w-xs mb-8 text-sm">
          Sua conta foi criada com sucesso, mas você ainda não está vinculado a nenhum {vocabulary.establishment.toLowerCase()}. <br/><br/>
          Aguarde o <b>link de convite</b> do seu {vocabulary.establishment.toLowerCase()} para começar a gerenciar suas {vocabulary.service.toLowerCase()}s!
        </p>
        <Button 
          variant="outline" 
          className="w-full max-w-[200px]"
          onClick={() => {
            localStorage.removeItem("danceflow_user")
            supabase.auth.signOut().then(() => window.location.href = "/login")
          }}
        >
          Sair da Conta
        </Button>
      </div>
    )
  }

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ola, {teacherData?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-sm text-muted-foreground">Portal do {vocabulary.provider} • Painel Geral</p>
        </div>
        <Badge variant="outline" className="w-fit bg-white dark:bg-slate-900 border-indigo-100 py-1.5 px-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
          Sessão Ativa
        </Badge>
      </div>

      {/* Mobile Stats - Horizontal Scroll */}
      <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
        <Card className="min-w-[160px] flex-1 border-none shadow-sm snap-start">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-3">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold">{stats.totalClasses}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{vocabulary.service}s</p>
          </CardContent>
        </Card>

        <Card className="min-w-[160px] flex-1 border-none shadow-sm snap-start">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl font-bold">{stats.totalStudents}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{vocabulary.client}s</p>
          </CardContent>
        </Card>

        <Card className="min-w-[160px] flex-1 border-none shadow-sm snap-start">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-bold">R$ {stats.pendingPayments.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">A Receber</p>
          </CardContent>
        </Card>

        <Card className="min-w-[160px] flex-1 border-none shadow-sm snap-start">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-bold truncate">{stats.nextClass?.class.name || "Nenhuma"}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Próxima</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Agenda</h3>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("h-7 text-[10px] px-3", viewMode === 'today' && "bg-white dark:bg-slate-800 shadow-sm")}
                onClick={() => setViewMode('today')}
              >Hoje</Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("h-7 text-[10px] px-3", viewMode === 'week' && "bg-white dark:bg-slate-800 shadow-sm")}
                onClick={() => setViewMode('week')}
              >Semana</Button>
            </div>
          </div>

          <div className="space-y-3">
            {viewMode === 'today' ? (
              upcomingClasses.length > 0 ? upcomingClasses.map((session) => (
                <Card key={session.id} className="border-none shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center font-bold text-indigo-600 text-sm">
                        {session.class.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{session.class.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{session.class.dance_style} • {session.scheduled_date}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/teacher/classes/${session.class_id}/chamada`}>
                        <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 font-bold text-xs h-8 w-full">
                          Fazer Chamada
                        </Button>
                      </Link>
                      {session.status !== 'cancelled' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold text-[10px] h-7 w-full"
                          onClick={() => handleCancelClass(session.class_id, session.scheduled_date)}
                          disabled={isCancelling === session.class_id}
                        >
                          {isCancelling === session.class_id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          Cancelar Hoje
                        </Button>
                      )}
                      {session.status === 'cancelled' && (
                        <Badge variant="secondary" className="bg-rose-100 text-rose-600 border-none text-[10px] py-0.5">
                          CANCELADA
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card className="border-dashed border-2 bg-transparent">
                  <CardContent className="p-8 text-center">
                    <p className="text-xs text-muted-foreground italic">Nenhuma {vocabulary.service.toLowerCase()} hoje.</p>
                  </CardContent>
                </Card>
              )
            ) : (
              weeklySchedule.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[9px] font-black text-indigo-600">
                      {item.day_name.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{item.name}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">{item.start_time}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] h-5">{item.level}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-lg">Meu Perfil</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <p className="text-[9px] text-indigo-100 uppercase font-bold tracking-widest">Chave PIX</p>
                <p className="font-mono text-xs mt-1 truncate">{teacherData?.pix_key || "Não cadastrada"}</p>
              </div>
              <Link href="/teacher/perfil">
                <Button variant="outline" className="w-full h-8 text-xs border-indigo-400 text-white hover:bg-indigo-500 bg-transparent font-bold">
                  Editar Perfil
                </Button>
              </Link>
            </CardContent>
            <GraduationCap className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/20" />
          </Card>

          <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-800 dark:text-amber-200">
              Lembre-se de marcar a presença logo após a aula para garantir seu fechamento financeiro.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
