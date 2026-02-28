"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, CheckCircle2, XCircle, Save, Loader2, Users, Calendar, ArrowLeft, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ChamadaPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [studioId, setStudioId] = useState<string | null>(null)
  const [turmas, setTurmas] = useState<any[]>([])
  const [selectedTurma, setSelectedTurma] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [loadingTurmas, setLoadingTurmas] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // Carrega turmas
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const sid = user.user_metadata?.studio_id
      setStudioId(sid)
      if (!sid) { setLoadingTurmas(false); return }

      const { data: prof } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      const params = new URLSearchParams({ studioId: sid })
      if (prof?.id) params.set('teacherId', prof.id)

      const res = await fetch(`/api/dance-studio/classes?${params}`)
      const data = await res.json()
      const list: any[] = data.classes || []
      setTurmas(list)

      // Se vier classId na URL, pré-seleciona
      const classIdParam = searchParams.get('classId')
      if (classIdParam) {
        const found = list.find(t => t.id === classIdParam)
        if (found) setSelectedTurma(found)
      } else if (list.length > 0) {
        setSelectedTurma(list[0])
      }
      setLoadingTurmas(false)
    }
    init()
  }, [])

  // Carrega alunos da turma selecionada
  const loadStudents = useCallback(async (classId: string) => {
    setLoadingStudents(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/dance-studio/enrollments?classId=${classId}&date=${today}`)
      const data = await res.json()
      const list: any[] = data.students || []
      setStudents(list)

      // Monta estado de presença: true = presente, false = ausente
      const initial: Record<string, boolean> = {}
      for (const s of list) {
        initial[s.studentId] = s.attendanceStatus === 'present'
      }
      setAttendance(initial)
    } catch {
      toast({ title: "Erro ao carregar alunos", variant: "destructive" })
    }
    setLoadingStudents(false)
  }, [today])

  useEffect(() => {
    if (selectedTurma?.id) loadStudents(selectedTurma.id)
  }, [selectedTurma?.id])

  const toggle = (studentId: string) => {
    setSaved(false)
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }))
  }

  const handleSave = async () => {
    if (!selectedTurma || !studioId) return
    setSaving(true)

    let errors = 0
    for (const s of students) {
      const isPresent = attendance[s.studentId] ?? false
      const status = isPresent ? 'present' : 'absent'

      try {
        await fetch('/api/dance-studio/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: s.studentId,
            classId: selectedTurma.id,
            studioId,
            date: today,
            status,
            attendanceId: s.attendanceId ?? null,
          }),
        })
      } catch {
        errors++
      }
    }

    setSaving(false)

    if (errors === 0) {
      setSaved(true)
      const presentCount = Object.values(attendance).filter(Boolean).length
      toast({
        title: "Chamada salva!",
        description: `${presentCount} de ${students.length} presentes registrados.`,
      })
      // Recarrega para sincronizar attendanceIds
      loadStudents(selectedTurma.id)
    } else {
      toast({ title: `${errors} aluno(s) com erro ao salvar`, variant: "destructive" })
    }
  }

  const presentCount = Object.values(attendance).filter(Boolean).length

  if (loadingTurmas) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/solutions/estudio-de-danca/teacher">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-pink-600" />
            Chamada Digital
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Registre a frequência dos alunos</p>
        </div>
      </div>

      {/* Seleção de turma */}
      {turmas.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="text-center py-16">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-400">Nenhuma turma encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {turmas.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTurma(t); setSaved(false) }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                  selectedTurma?.id === t.id
                    ? "bg-pink-600 text-white border-pink-600 shadow-lg shadow-pink-600/20"
                    : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-pink-300"
                )}
              >
                {t.name}
                {t.scheduleSummary && (
                  <span className="opacity-70 text-xs ml-1.5">
                    {t.schedule?.find((s: any) => s.day_of_week === new Date().getDay())?.start_time ?? ''}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-600" />
                {selectedTurma?.name ?? '—'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-600/20 dark:text-pink-400 border-0 font-black">
                  {loadingStudents ? '…' : `${presentCount}/${students.length} presentes`}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => selectedTurma && loadStudents(selectedTurma.id)}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingStudents ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Nenhum aluno matriculado nesta turma</p>
                </div>
              ) : (
                <>
                  {students.map(student => {
                    const isPresent = attendance[student.studentId] ?? false
                    return (
                      <button
                        key={student.studentId}
                        onClick={() => toggle(student.studentId)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                          isPresent
                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-600/10"
                            : "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-600/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white",
                            isPresent ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                          )}>
                            {student.name[0]?.toUpperCase()}
                          </div>
                          <span className={cn("font-bold text-sm", isPresent ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500")}>
                            {student.name}
                          </span>
                        </div>
                        {isPresent
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          : <XCircle className="w-5 h-5 text-rose-400" />
                        }
                      </button>
                    )
                  })}

                  <div className="pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving || saved}
                      className={cn(
                        "w-full font-bold rounded-xl h-12",
                        saved
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-pink-600 hover:bg-pink-700"
                      )}
                    >
                      {saving
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                        : saved
                        ? <><CheckCircle2 className="w-4 h-4 mr-2" />Chamada Salva!</>
                        : <><Save className="w-4 h-4 mr-2" />Salvar Chamada</>
                      }
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
