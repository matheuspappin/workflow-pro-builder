"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, CheckCircle2, AlertCircle, Clock, ArrowRight, Star, Music, Loader2, QrCode as QrCodeIcon, CreditCard, PlayCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import QRCode from "react-qr-code"

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const COLORS = ["border-l-pink-500", "border-l-violet-500", "border-l-indigo-500", "border-l-emerald-500"]

export default function StudentHome() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState<string | null>(null)
  const [businessModel, setBusinessModel] = useState<'CREDIT' | 'MONETARY'>('MONETARY')
  const [financeiro, setFinanceiro] = useState<{ pendente: number; vencido: number; hasDebito: boolean }>({ pendente: 0, vencido: 0, hasDebito: false })
  const [turmas, setTurmas] = useState<any[]>([])
  const [frequencia, setFrequencia] = useState<{ percent: number; totalMes: number } | null>(null)
  // Fluxo QR Check-in
  const [nextClass, setNextClass] = useState<any>(null)
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null)
  const [studentCredits, setStudentCredits] = useState<any>(null)
  const [activeAttendanceId, setActiveAttendanceId] = useState<string | null>(null)
  const [isClassQrOpen, setIsClassQrOpen] = useState(false)
  const [isReserving, setIsReserving] = useState(false)
  const [availableToday, setAvailableToday] = useState<any[]>([])
  const [attendancesToday, setAttendancesToday] = useState<any[]>([])
  const [qrDialogClass, setQrDialogClass] = useState<any>(null)

  const fetchStudentData = useCallback(async (studentId: string, studioId: string, classes: any[]) => {
    if (!studioId || !classes?.length) return

    const todayStr = new Date().toISOString().split('T')[0]
    const todayDow = new Date().getDay()

    // Turmas que têm aula hoje
    const todayClasses = classes.filter((t: any) =>
      (t.schedule || []).some((s: any) => s.day_of_week === todayDow)
    )
    const tomorrowDow = (todayDow + 1) % 7
    const available = classes.filter((t: any) =>
      (t.schedule || []).some((s: any) => s.day_of_week === todayDow || s.day_of_week === tomorrowDow)
    ).map((t: any) => {
      const sched = (t.schedule || []).find((s: any) => s.day_of_week === todayDow || s.day_of_week === tomorrowDow)
      return {
        ...t,
        display_day: sched?.day_of_week === todayDow ? 'Hoje' : 'Amanhã',
        display_time: sched?.start_time ?? '—',
      }
    })
    setAvailableToday(available)

    const { data: allAtt } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', todayStr)
    setAttendancesToday(allAtt || [])

    const firstToday = todayClasses[0]
    if (firstToday) {
      setNextClass(firstToday)
      const att = (allAtt || []).find((a: any) => a.class_id === firstToday.id)
      setAttendanceRecord(att || null)
    } else {
      setNextClass(null)
      setAttendanceRecord(null)
    }

    const { data: credits } = await supabase
      .from('student_lesson_credits')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle()
    setStudentCredits(credits)
  }, [])

  const handleConfirmAttendance = async (classToBook?: any) => {
    if (!user) return
    const targetClass = classToBook || nextClass
    if (!targetClass) return

    const studioId = user.user_metadata?.studio_id
    const studentId = user.id

    if (!classToBook && (!studentCredits || studentCredits.remaining_credits <= 0)) {
      toast({
        title: "Créditos insuficientes",
        description: "Você não possui créditos para esta aula. Adquira um pacote.",
        variant: "destructive",
      })
      return
    }

    if (classToBook || !attendanceRecord) {
      setIsReserving(true)
      try {
        const { data, error } = await supabase.rpc('enroll_student_in_class', {
          p_student_id: studentId,
          p_class_id: targetClass.id,
          p_studio_id: studioId,
        })

        if (error) throw error

        if (!data.success) {
          toast({
            title: "Não foi possível gerar check-in",
            description: data.message,
            variant: "destructive",
          })
          return
        }

        if (classToBook) {
          toast({ title: "Reserva realizada!", description: data.message })
        }

        if (data.attendance_id) {
          setActiveAttendanceId(data.attendance_id)
          setQrDialogClass(targetClass)
          setIsClassQrOpen(true)
        }

        const res = await fetch(`/api/dance-studio/classes?studioId=${studioId}&studentId=${studentId}`)
        const apiData = await res.json()
        await fetchStudentData(studentId, studioId, apiData.classes || [])
      } catch (e: any) {
        toast({
          title: "Erro ao processar check-in",
          description: e.message,
          variant: "destructive",
        })
      } finally {
        setIsReserving(false)
      }
      return
    }

    setActiveAttendanceId(attendanceRecord.id)
    setQrDialogClass(targetClass)
    setIsClassQrOpen(true)
  }

  useEffect(() => {
    let cleanupFn: (() => void) | undefined

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }

      // CORRIGIDO: Atualizar o state 'user' para que handleConfirmAttendance funcione
      setUser(authUser)

      const sid = authUser.user_metadata?.studio_id
      setStudioId(sid)
      if (!sid) { setLoading(false); return }

      // Carregar business model
      const { data: studio } = await supabase
        .from('studios')
        .select('business_model')
        .eq('id', sid)
        .single()
      setBusinessModel(studio?.business_model || 'MONETARY')

      // Configurar realtime subscriptions se for modelo CREDIT
      if (studio?.business_model === 'CREDIT') {
        const creditsChannel = supabase
          .channel(`student-credits-${authUser.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'student_lesson_credits',
            filter: `student_id=eq.${authUser.id}`,
          }, (payload) => {
            if (payload.eventType === 'UPDATE') {
              setStudentCredits(payload.new as any)
            }
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'student_credit_usage',
            filter: `student_id=eq.${authUser.id}`,
          }, () => {
            // Usar ref para turmas atuais para evitar closure stale
            setTurmas(currentTurmas => {
              fetchStudentData(authUser.id, sid, currentTurmas)
              return currentTurmas
            })
          })
          .subscribe()

        // CORRIGIDO: Registrar cleanup no escopo externo do useEffect
        cleanupFn = () => { supabase.removeChannel(creditsChannel) }
      }

      await Promise.all([
        // Turmas matriculadas + dados para QR check-in
        (async () => {
          try {
            const res = await fetch(`/api/dance-studio/classes?studioId=${sid}&studentId=${authUser.id}`)
            const data = await res.json()
            const classes = data.classes || []
            setTurmas(classes)
            fetchStudentData(authUser.id, sid, classes)
          } catch { /* sem turmas */ }
        })(),

        // Financeiro — busca cobranças do aluno via API DanceFlow
        (async () => {
          try {
            const res = await fetch(`/api/dance-studio/financeiro?studioId=${sid}`)
            const data = await res.json()
            const payments = data.payments || []
            // Filtrar apenas cobranças deste aluno
            const myPayments = payments.filter((p: any) => p.student_id === authUser.id)
            const pendentes = myPayments.filter((p: any) => p.status === 'pendente' || p.status === 'pending')
            const vencidos = myPayments.filter((p: any) => p.status === 'vencido' || p.status === 'overdue')
            const totalPendente = pendentes.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
            const totalVencido = vencidos.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
            setFinanceiro({ pendente: totalPendente, vencido: totalVencido, hasDebito: totalPendente > 0 || totalVencido > 0 })
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
              .eq('student_id', authUser.id)
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

    // CORRIGIDO: cleanup retornado diretamente do useEffect
    return () => { cleanupFn?.() }
  }, [])

  const firstName = user?.user_metadata?.name?.split(' ')[0]
    || user?.user_metadata?.full_name?.split(' ')[0]
    || 'Aluno'

  // Próximas aulas baseadas no schedule das turmas
  const todayDow = new Date().getDay()
  const proximasAulas = turmas
    .flatMap((t: any, turmaIdx: number) =>
      (t.schedule || []).map((s: any) => ({
        name: t.name,
        day: DAY_NAMES[s.day_of_week],
        dow: s.day_of_week,
        time: s.start_time ?? '—',
        teacher: t.teacherName,
        // CORRIGIDO: usar índice do flatMap, não indexOf (evita O(n²))
        color: COLORS[turmaIdx % COLORS.length],
      }))
    )
    .sort((a, b) => {
      const da = (a.dow - todayDow + 7) % 7
      const db = (b.dow - todayDow + 7) % 7
      return da - db || a.time.localeCompare(b.time)
    })
    .slice(0, 4)

  const handleRefresh = async () => {
    if (!user) return
    setLoading(true)
    const sid = user.user_metadata?.studio_id
    if (!sid) { setLoading(false); return }
    try {
      const res = await fetch(`/api/dance-studio/classes?studioId=${sid}&studentId=${user.id}`)
      const apiData = await res.json()
      const classes = apiData.classes || []
      setTurmas(classes)
      await fetchStudentData(user.id, sid, classes)
    } catch { /* sem turmas */ }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-2xl p-6 text-white relative">
        <p className="text-violet-200 text-sm font-bold uppercase tracking-widest mb-1">Bem-vindo de volta</p>
        <h1 className="text-2xl font-black tracking-tight">Olá, {firstName}! 👋</h1>
        <p className="text-violet-100/80 text-sm mt-2">Veja seu resumo de hoje</p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          title="Atualizar"
        >
          <RefreshCw className={cn("w-4 h-4 text-white", loading && "animate-spin")} />
        </button>
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
              <Button type="button" size="sm" className={cn(
                "font-bold rounded-xl text-white text-xs",
                financeiro.vencido > 0 ? "bg-rose-500 hover:bg-rose-600" : "bg-amber-500 hover:bg-amber-600"
              )}>
                Pagar
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Check-in de Hoje — QR Code para validação pelo professor/admin */}
      {!loading && nextClass && (
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-violet-600 to-pink-600 text-white">
          <CardContent className="p-0">
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="bg-white/20 text-white border-none uppercase mb-2">CHECK-IN</Badge>
                  <h3 className="text-xl font-bold">{nextClass.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Clock className="w-4 h-4" />
                <span>{nextClass.dance_style || nextClass.schedule?.[0]?.start_time || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{nextClass.teacherName || 'Professor'}</span>
              </div>
            </div>
            <div className="bg-black/10 p-3 flex justify-between items-center px-5">
              <span className="text-[10px] font-medium opacity-70 uppercase">
                {attendanceRecord?.status === 'present'
                  ? 'VALIDADO ✅'
                  : studentCredits?.remaining_credits > 0
                    ? 'APRESENTE O QR NA ENTRADA'
                    : 'CRÉDITOS INSUFICIENTES ⚠️'}
              </span>
              {attendanceRecord?.status === 'present' ? (
                <Badge className="bg-emerald-500 text-white border-none">VALIDADO</Badge>
              ) : studentCredits?.remaining_credits > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="bg-white text-violet-600 hover:bg-white/90 gap-1 text-xs font-bold"
                  onClick={() => handleConfirmAttendance()}
                  disabled={isReserving}
                >
                  {isReserving ? <Loader2 className="w-3 h-3 animate-spin" /> : <QrCodeIcon className="w-3 h-3" />}
                  Ver QR Check-in
                </Button>
              ) : (
                <Button type="button" size="sm" variant="secondary" className="bg-rose-500/80 hover:bg-rose-600 text-white gap-1 text-xs font-bold" asChild>
                  <Link href="/solutions/estudio-de-danca/student/financeiro">
                    <CreditCard className="w-3 h-3" /> Comprar Créditos
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reservar aula (classes de hoje/amanhã) */}
      {!loading && studentCredits?.remaining_credits > 0 && availableToday.length > 0 && (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="p-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm mb-4">
              <PlayCircle className="w-4 h-4 text-violet-600" />
              Reservar Aula
            </h3>
            <div className="space-y-3">
              {availableToday.slice(0, 5).map((cls: any) => {
                const attForClass = attendancesToday.find((a: any) => a.class_id === cls.id)
                const isPresent = attForClass?.status === 'present'
                const hasReservation = attForClass && attForClass.status !== 'present'
                return (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">{cls.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{cls.display_day} às {cls.display_time}</p>
                    </div>
                    {isPresent ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">Validado</Badge>
                    ) : hasReservation ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-3"
                        onClick={() => {
                          setActiveAttendanceId(attForClass.id)
                          setQrDialogClass(cls)
                          setIsClassQrOpen(true)
                        }}
                      >
                        <QrCodeIcon className="w-3 h-3 mr-1" /> Ver QR
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-3"
                        onClick={() => handleConfirmAttendance(cls)}
                        disabled={isReserving}
                      >
                        {isReserving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reservar'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
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
            <Button type="button" variant="ghost" size="sm" className="text-violet-600 text-xs font-bold h-7" asChild>
              <Link href="/solutions/estudio-de-danca/student/turmas">
                Ver todas <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
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

      {/* Dialog QR Code Check-in */}
      <Dialog open={isClassQrOpen} onOpenChange={setIsClassQrOpen}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">QR Code da Aula</DialogTitle>
            <DialogDescription className="text-center">
              Apresente este código para o professor ou na portaria para validar sua presença.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 gap-6">
            <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-violet-50 dark:border-violet-900/30">
              {activeAttendanceId || attendanceRecord?.id ? (
                <div className="flex flex-col items-center gap-4">
                  <QRCode
                    value={`DF-${(activeAttendanceId || attendanceRecord?.id)?.toString().slice(-8).toUpperCase()}`}
                    size={220}
                    level="H"
                    viewBox="0 0 256 256"
                  />
                  <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800 w-full text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Chave de Acesso</p>
                    <p className="font-mono text-lg font-black text-violet-600 tracking-widest">
                      DF-{(activeAttendanceId || attendanceRecord?.id)?.toString().slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-56 h-56 flex flex-col items-center justify-center text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Gerando Código Seguro...</p>
                </div>
              )}
            </div>
            <p className="font-bold text-lg text-slate-900 dark:text-white">{qrDialogClass?.name || nextClass?.name}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
