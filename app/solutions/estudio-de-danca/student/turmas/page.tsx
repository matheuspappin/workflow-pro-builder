"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Clock, Download, GraduationCap, Music, Loader2, Plus, RefreshCw, Sparkles, QrCode as QrCodeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import QRCode from "react-qr-code"

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}
const COLORS = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
]

export default function StudentTurmasPage() {
  const { toast } = useToast()
  const [turmas, setTurmas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [studioId, setStudioId] = useState<string | null>(null)
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
      // fallback: copiar chave para área de transferência
      const key = `DF-${activeAttendanceId.toString().slice(-8).toUpperCase()}`
      navigator.clipboard?.writeText(key).then(() => {
        toast({ title: "Chave copiada", description: "A chave de acesso foi copiada para a área de transferência." })
      })
    }
  }, [activeAttendanceId, qrDialogClass?.name, toast])

  const fetchTurmas = useCallback(async (uid: string, sid: string, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch(`/api/dance-studio/classes?studioId=${sid}&studentId=${uid}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      })
      const data = await res.json()
      if (!res.ok) {
        console.warn('[Minhas Turmas] API error:', data?.error || res.status)
        toast({
          title: "Erro ao carregar turmas",
          description: data?.error || "Verifique sua conexão e tente novamente.",
          variant: "destructive",
        })
      }
      setTurmas(data.classes || [])
    } catch (e) {
      console.warn('[Minhas Turmas] Fetch error:', e)
      toast({
        title: "Erro ao carregar turmas",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      })
      setTurmas([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }

      const sid = authUser.user_metadata?.studio_id
      setUser(authUser)
      setStudioId(sid)

      if (sid) await fetchTurmas(authUser.id, sid)
      else setLoading(false)
    }
    load()
  }, [fetchTurmas])

  const handleShowQr = async (turma: any) => {
    if (!user || !studioId) return

    setLoadingQr(turma.id)
    try {
      const { data, error } = await supabase.rpc('enroll_student_in_class', {
        p_student_id: user.id,
        p_class_id: turma.id,
        p_studio_id: studioId,
      })

      if (error) throw error

      if (data.success && data.attendance_id) {
        setActiveAttendanceId(data.attendance_id)
        setQrDialogClass(turma)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-violet-600" />
            Minhas Turmas
          </h1>
          <p className="text-slate-500 text-sm mt-1">Aulas em que você está matriculado</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => user && studioId && fetchTurmas(user.id, studioId, true)}
          disabled={refreshing || loading}
          title="Atualizar"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : turmas.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet-500 to-pink-500" />
          <CardContent className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
              <Music className="w-10 h-10 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2">
              Nenhuma turma encontrada
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mb-2">
              Você ainda não está matriculado em nenhuma turma. Explore o catálogo, escolha sua aula e apresente o QR Code na portaria para validar sua presença.
            </p>
            <p className="text-slate-400 text-xs mb-6">
              Após matricular-se, suas turmas aparecerão aqui com horários, professor e botão para gerar o QR de check-in.
            </p>
            <Link href="/solutions/estudio-de-danca/student/turmas/catalogo">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl gap-2">
                <Sparkles className="w-4 h-4" />
                Ver Turmas Disponíveis
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {turmas.map((turma: any, i: number) => (
              <Card key={turma.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className={cn("h-1.5 bg-gradient-to-r", COLORS[i % COLORS.length])} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base">{turma.name}</h3>
                      {turma.dance_style && (
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-bold mt-0.5">{turma.dance_style}</p>
                      )}
                    </div>
                    {turma.level && (
                      <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400 border-0 text-xs font-bold">
                        {LEVEL_LABELS[turma.level] || turma.level}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <GraduationCap className="w-4 h-4 text-violet-500 shrink-0" />
                      <span>{turma.teacherName || 'Professor não definido'}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {(turma.schedule || []).map((s: any, si: number) => (
                        <div key={si} className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-1.5">
                          <Clock className="w-3.5 h-3.5 text-pink-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {DAY_NAMES[s.day_of_week]} às {s.start_time}
                            {s.end_time && ` — ${s.end_time}`}
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

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 h-10 rounded-xl font-bold text-sm border-violet-200 dark:border-violet-700/50 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                    onClick={() => handleShowQr(turma)}
                    disabled={loadingQr === turma.id}
                  >
                    {loadingQr === turma.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <QrCodeIcon className="w-4 h-4 mr-2" />
                    )}
                    Ver QR Code para Check-in
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botão para explorar mais turmas */}
          <Link href="/solutions/estudio-de-danca/student/turmas/catalogo">
            <Button
              variant="outline"
              className="w-full border-dashed border-2 border-violet-200 dark:border-violet-700/40 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-50 dark:hover:bg-violet-950/40 h-12 rounded-xl font-bold gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Quero me matricular em outra turma
            </Button>
          </Link>
        </>
      )}

      {/* Dialog QR Code */}
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
