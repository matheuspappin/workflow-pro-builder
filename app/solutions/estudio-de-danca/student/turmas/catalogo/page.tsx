"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Download,
  Search,
  Music,
  Clock,
  GraduationCap,
  Users,
  Loader2,
  CheckCircle2,
  Plus,
  RefreshCw,
  CreditCard,
  Sparkles,
  AlertCircle,
  QrCode as QrCodeIcon,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import QRCode from "react-qr-code"

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}
const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400',
  advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:text-rose-400',
}

export default function CatalogoTurmasPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [joining, setJoining] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [user, setUser] = useState<any>(null)
  const [studioId, setStudioId] = useState<string | null>(null)
  const [studentCredits, setStudentCredits] = useState<any>(null)
  const [allClasses, setAllClasses] = useState<any[]>([])
  const [myEnrolledIds, setMyEnrolledIds] = useState<Set<string>>(new Set())
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [activeAttendanceId, setActiveAttendanceId] = useState<string | null>(null)
  const [qrDialogClass, setQrDialogClass] = useState<any>(null)
  const [loadingQr, setLoadingQr] = useState<string | null>(null)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  const handleDownloadQr = useCallback(() => {
    const container = qrContainerRef.current
    if (!container || !activeAttendanceId) return
    const svg = container.querySelector('svg')
    if (!svg) return
    try {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, 256, 256)
        ctx.drawImage(img, 0, 0, 256, 256)
        const png = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = png
        a.download = `qr-checkin-${qrDialogClass?.name || 'turma'}-${new Date().toISOString().slice(0, 10)}.png`
        a.click()
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    } catch {
      const key = `DF-${activeAttendanceId.toString().slice(-8).toUpperCase()}`
      navigator.clipboard?.writeText(key).then(() => {
        toast({ title: "Chave copiada", description: "A chave de acesso foi copiada para a área de transferência." })
      })
    }
  }, [activeAttendanceId, qrDialogClass?.name, toast])

  const fetchData = useCallback(async (uid: string, sid: string, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]

      const [classesRes, enrollmentsRes, creditsRes, cancelledRes] = await Promise.all([
        supabase
          .from('classes')
          .select(`
            id, name, dance_style, level, schedule, status, max_students,
            professional:professionals(id, name),
            enrollments(count)
          `)
          .eq('studio_id', sid)
          .eq('status', 'active')
          .order('name'),

        supabase
          .from('enrollments')
          .select('class_id')
          .eq('student_id', uid)
          .eq('studio_id', sid)
          .eq('status', 'active'),

        supabase
          .from('student_lesson_credits')
          .select('*')
          .eq('student_id', uid)
          .maybeSingle(),

        supabase
          .from('sessions')
          .select('class_id')
          .eq('studio_id', sid)
          .eq('scheduled_date', todayStr)
          .eq('status', 'cancelled'),
      ])

      const cancelledClassIds = new Set((cancelledRes.data || []).map((s: any) => s.class_id))
      const enrolled = new Set((enrollmentsRes.data || []).map((e: any) => e.class_id))

      const classes = (classesRes.data || []).map((c: any) => ({
        ...c,
        teacherName: c.professional?.name || 'Professor não definido',
        enrolledCount: c.enrollments?.[0]?.count ?? 0,
        isCancelledToday: cancelledClassIds.has(c.id),
      }))

      setAllClasses(classes)
      setMyEnrolledIds(enrolled)
      setStudentCredits(creditsRes.data)
    } catch {
      toast({ title: "Erro ao carregar turmas", variant: "destructive" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }

      const sid = authUser.user_metadata?.studio_id
      setUser(authUser)
      setStudioId(sid)

      if (sid) await fetchData(authUser.id, sid)
      else setLoading(false)
    }
    init()
  }, [fetchData])

  const handleEnroll = async (cls: any) => {
    if (!user || !studioId) return

    setJoining(cls.id)
    try {
      const { data, error } = await supabase.rpc('enroll_student_in_class', {
        p_student_id: user.id,
        p_class_id: cls.id,
        p_studio_id: studioId,
      })

      if (error) throw error

      if (!data.success) {
        toast({
          title: "Não foi possível matricular",
          description: data.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Matrícula realizada!",
        description: `Você foi matriculado em ${cls.name}. Apresente o QR Code na portaria.`,
      })

      setMyEnrolledIds(prev => new Set([...Array.from(prev), cls.id]))

      if (data.attendance_id) {
        setActiveAttendanceId(data.attendance_id)
        setQrDialogClass(cls)
        setIsQrOpen(true)
      }

      await fetchData(user.id, studioId, true)

      const phone = user.user_metadata?.phone
      if (phone) {
        fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phone.replace(/\D/g, ''),
            message: `Olá ${user.user_metadata?.name?.split(' ')[0] || 'Aluno'}! ✨\n\nSua matrícula na turma *${cls.name}* foi confirmada com sucesso! 💃\n\nApresente seu QR Code na portaria para validar a presença. Estamos ansiosos para ver você na aula!`,
            studioId,
          }),
        }).catch(() => {})
      }
    } catch (e: any) {
      toast({
        title: "Erro na matrícula",
        description: e.message,
        variant: "destructive",
      })
    } finally {
      setJoining(null)
    }
  }

  const handleShowQr = async (cls: any) => {
    if (!user || !studioId) return

    setLoadingQr(cls.id)
    try {
      const { data, error } = await supabase.rpc('enroll_student_in_class', {
        p_student_id: user.id,
        p_class_id: cls.id,
        p_studio_id: studioId,
      })

      if (error) throw error

      if (data.success && data.attendance_id) {
        setActiveAttendanceId(data.attendance_id)
        setQrDialogClass(cls)
        setIsQrOpen(true)
      } else if (!data.success) {
        toast({ title: "Não foi possível gerar QR", description: data.message, variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Erro ao gerar QR", description: e.message, variant: "destructive" })
    } finally {
      setLoadingQr(null)
    }
  }

  const filtered = allClasses.filter(c => {
    const term = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      (c.dance_style || '').toLowerCase().includes(term) ||
      (c.teacherName || '').toLowerCase().includes(term)
    )
  })

  const hasCredits = studentCredits && studentCredits.remaining_credits > 0
  const creditsExpired =
    studentCredits?.expiry_date && new Date(studentCredits.expiry_date) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/solutions/estudio-de-danca/student/turmas">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              Catálogo de Turmas
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Todas as turmas disponíveis no estúdio</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => user && studioId && fetchData(user.id, studioId, true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Status de créditos */}
      {!loading && studentCredits && (
        <div className={cn(
          "rounded-2xl p-4 flex items-center gap-3 border",
          creditsExpired
            ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
            : hasCredits
              ? "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
        )}>
          {creditsExpired ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : hasCredits ? (
            <CreditCard className="w-5 h-5 text-violet-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div className="flex-1">
            {creditsExpired ? (
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
                Seus créditos expiraram em {new Date(studentCredits.expiry_date).toLocaleDateString('pt-BR')}. Renove para se matricular.
              </p>
            ) : hasCredits ? (
              <p className="text-xs font-bold text-violet-700 dark:text-violet-400">
                Você tem <span className="text-base">{studentCredits.remaining_credits}</span> crédito(s) disponível(is)
                {studentCredits.expiry_date && ` — válidos até ${new Date(studentCredits.expiry_date).toLocaleDateString('pt-BR')}`}
              </p>
            ) : (
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Sem créditos disponíveis. Compre um pacote para se matricular.
              </p>
            )}
          </div>
          {(!hasCredits || creditsExpired) && (
            <Link href="/solutions/estudio-de-danca/student/financeiro">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold h-8 px-3 rounded-xl">
                Comprar
              </Button>
            </Link>
          )}
        </div>
      )}

      {!loading && !studentCredits && (
        <div className="rounded-2xl p-4 flex items-center gap-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Você ainda não tem créditos. Compre um pacote para se matricular nas turmas.
            </p>
          </div>
          <Link href="/solutions/estudio-de-danca/student/financeiro">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold h-8 px-3 rounded-xl">
              Comprar
            </Button>
          </Link>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, estilo ou professor..."
          className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl h-11"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Music className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">
              {search ? "Nenhuma turma encontrada" : "Nenhuma turma disponível"}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {search ? "Tente outro termo de busca." : "O estúdio ainda não criou turmas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider px-1">
            {filtered.length} turma(s) disponível(is)
          </p>
          {filtered.map((cls) => {
            const isEnrolled = myEnrolledIds.has(cls.id)
            const isFull = cls.max_students && cls.enrolledCount >= cls.max_students
            const canEnroll = hasCredits && !creditsExpired && !isEnrolled && !isFull

            return (
              <Card
                key={cls.id}
                className={cn(
                  "bg-white dark:bg-slate-900/50 border overflow-hidden transition-all",
                  isEnrolled
                    ? "border-emerald-200 dark:border-emerald-700/40"
                    : "border-slate-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-700/50"
                )}
              >
                {/* Barra colorida de status */}
                <div className={cn(
                  "h-1",
                  isEnrolled
                    ? "bg-emerald-500"
                    : cls.isCancelledToday
                      ? "bg-rose-500"
                      : "bg-gradient-to-r from-violet-500 to-pink-500"
                )} />

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                          {cls.name}
                        </h3>
                        {cls.isCancelledToday && (
                          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:text-rose-400 border-0 text-[10px] font-bold animate-pulse">
                            CANCELADA HOJE
                          </Badge>
                        )}
                      </div>
                      {cls.dance_style && (
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-bold mt-0.5">
                          {cls.dance_style}
                        </p>
                      )}
                    </div>
                    {cls.level && (
                      <Badge className={cn("border-0 text-xs font-bold ml-2 shrink-0", LEVEL_COLORS[cls.level] || "bg-slate-100 text-slate-600")}>
                        {LEVEL_LABELS[cls.level] || cls.level}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <GraduationCap className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                      <span>{cls.teacherName}</span>
                    </div>

                    {cls.max_students && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Users className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span>
                          {cls.enrolledCount}/{cls.max_students} vagas
                          {isFull && <span className="text-rose-500 font-bold ml-1">· LOTADA</span>}
                        </span>
                      </div>
                    )}

                    {(cls.schedule || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(cls.schedule || []).map((s: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-1 bg-slate-50 dark:bg-white/5 rounded-lg px-2.5 py-1"
                          >
                            <Clock className="w-3 h-3 text-pink-500" />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {DAY_NAMES[s.day_of_week]} às {s.start_time}
                              {s.end_time && ` — ${s.end_time}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isEnrolled ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-4 py-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          Você já está matriculado
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9 rounded-xl font-bold text-sm border-violet-200 dark:border-violet-700/50 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                        onClick={() => handleShowQr(cls)}
                        disabled={loadingQr === cls.id}
                      >
                        {loadingQr === cls.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <QrCodeIcon className="w-4 h-4 mr-2" />
                        )}
                        Ver QR Code para Check-in
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className={cn(
                        "w-full h-10 rounded-xl font-bold text-sm",
                        canEnroll
                          ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-600/20"
                          : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                      )}
                      onClick={() => canEnroll && handleEnroll(cls)}
                      disabled={!canEnroll || joining === cls.id}
                    >
                      {joining === cls.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {joining === cls.id
                        ? "Matriculando..."
                        : isFull
                          ? "Turma Lotada"
                          : !hasCredits || creditsExpired
                            ? "Sem Créditos"
                            : "Matricular-se"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog QR Code — único por aluno, gerado a partir do attendance_id */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">
              QR Code para Check-in
            </DialogTitle>
            <DialogDescription className="text-center">
              {qrDialogClass ? (
                <>Apresente este código na portaria para validar sua presença em <strong>{qrDialogClass.name}</strong>.</>
              ) : (
                "Apresente este código para o professor ou na portaria para validar sua presença."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 gap-6">
            <div ref={qrContainerRef} className="bg-white p-4 rounded-3xl shadow-xl border-4 border-violet-50 dark:border-violet-900/30">
              {activeAttendanceId ? (
                <div className="flex flex-col items-center gap-4">
                  <QRCode
                    value={`DF-${activeAttendanceId.toString().slice(-8).toUpperCase()}`}
                    size={220}
                    level="H"
                    viewBox="0 0 256 256"
                  />
                  <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800 w-full text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Chave de Acesso</p>
                    <p className="font-mono text-lg font-black text-violet-600 tracking-widest">
                      DF-{activeAttendanceId.toString().slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleDownloadQr}
                  >
                    <Download className="w-4 h-4" />
                    Salvar QR Code (imagem)
                  </Button>
                </div>
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Este QR é único para você. O crédito será descontado quando a presença for validada no scanner.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
