"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, Plus, Clock, Users, GraduationCap, Loader2, Music,
  LayoutGrid, CalendarDays, X, ChevronLeft, ChevronRight, Pencil, Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

const COLORS = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-cyan-500",
]

const CAL_COLORS = [
  { bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-800 dark:text-pink-200", border: "border-pink-300 dark:border-pink-700" },
  { bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-800 dark:text-violet-200", border: "border-violet-300 dark:border-violet-700" },
  { bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-800 dark:text-indigo-200", border: "border-indigo-300 dark:border-indigo-700" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-800 dark:text-emerald-200", border: "border-emerald-300 dark:border-emerald-700" },
  { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-800 dark:text-amber-200", border: "border-amber-300 dark:border-amber-700" },
  { bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-800 dark:text-sky-200", border: "border-sky-300 dark:border-sky-700" },
]

// DB day_of_week: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
// Display order: Seg Ter Qua Qui Sex Sáb Dom
const DB_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DISPLAY_DAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
const DISPLAY_DAYS_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
const DB_DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

interface ScheduleItem {
  day_of_week: number
  start_time: string
  end_time: string
}

// ─── Calendário Semanal ──────────────────────────────────────────────────────
function WeekCalendar({ turmas }: { turmas: any[] }) {
  // Determina intervalo de horas a partir dos horários existentes
  let minHour = 8
  let maxHour = 20

  for (const t of turmas) {
    for (const s of (t.schedule || [])) {
      const sh = parseInt((s.start_time || "08:00").split(":")[0])
      const eh = s.end_time ? parseInt(s.end_time.split(":")[0]) + 1 : sh + 1
      if (sh < minHour) minHour = sh
      if (eh > maxHour) maxHour = eh
    }
  }

  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i)

  // Mapa de cor por turma
  const colorMap: Record<string, number> = {}
  turmas.forEach((t, i) => { colorMap[t.id] = i % CAL_COLORS.length })

  // Lookup [displayDayIndex][hour] → lista de turmas
  const lookup: Record<string, { turma: any; slot: ScheduleItem }[]> = {}
  for (const t of turmas) {
    for (const s of (t.schedule || [])) {
      const displayDayIndex = DB_DAY_ORDER.indexOf(s.day_of_week)
      if (displayDayIndex === -1) continue
      const h = parseInt((s.start_time || "08:00").split(":")[0])
      const key = `${displayDayIndex}-${h}`
      if (!lookup[key]) lookup[key] = []
      lookup[key].push({ turma: t, slot: s })
    }
  }

  const withSchedule = turmas.filter(t => (t.schedule || []).length > 0)
  const withoutSchedule = turmas.filter(t => (t.schedule || []).length === 0)

  if (withSchedule.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
          <p className="font-bold text-slate-600 dark:text-slate-400">Nenhuma turma com horário definido</p>
          <p className="text-xs text-slate-400 mt-1">Crie turmas com horários para visualizar o calendário.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Legenda */}
      <div className="flex flex-wrap gap-2">
        {turmas.map((t, i) => {
          const c = CAL_COLORS[i % CAL_COLORS.length]
          return (
            <span key={t.id} className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", c.bg, c.text, c.border)}>
              <span className="w-2 h-2 rounded-full bg-current opacity-60" />
              {t.name}
            </span>
          )
        })}
      </div>

      {/* Grade */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 shadow-sm">
        <div className="min-w-[640px]">
          {/* Cabeçalho dias */}
          <div
            className="grid border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10"
            style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
          >
            <div className="p-2 border-r border-slate-100 dark:border-white/5" />
            {DISPLAY_DAYS_SHORT.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "py-3 text-center text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400",
                  i < 6 && "border-r border-slate-100 dark:border-white/5"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Linhas de horário */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-slate-100 dark:border-white/5 last:border-b-0"
              style={{ gridTemplateColumns: "56px repeat(7, 1fr)", minHeight: "64px" }}
            >
              {/* Hora */}
              <div className="px-2 pt-2 border-r border-slate-100 dark:border-white/5 flex items-start justify-end">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>

              {/* Células por dia */}
              {DISPLAY_DAYS_SHORT.map((_, dayIndex) => {
                const items = lookup[`${dayIndex}-${hour}`] || []
                return (
                  <div
                    key={dayIndex}
                    className={cn("p-1 relative", dayIndex < 6 && "border-r border-slate-100 dark:border-white/5")}
                  >
                    {items.map(({ turma, slot }) => {
                      const c = CAL_COLORS[colorMap[turma.id]]
                      return (
                        <div
                          key={`${turma.id}-${slot.day_of_week}`}
                          className={cn(
                            "rounded-lg px-2 py-1.5 mb-1 border text-xs font-bold cursor-default select-none",
                            c.bg, c.text, c.border
                          )}
                        >
                          <p className="font-black truncate leading-tight">{turma.name}</p>
                          <p className="text-[10px] opacity-70 mt-0.5">
                            {slot.start_time}
                            {slot.end_time && ` – ${slot.end_time}`}
                          </p>
                          {turma.teacherName && turma.teacherName !== "Não definido" && (
                            <p className="text-[10px] opacity-60 truncate">{turma.teacherName}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {withoutSchedule.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          {withoutSchedule.length} turma{withoutSchedule.length > 1 ? "s" : ""} sem horário definido — visível apenas na visualização em cards.
        </p>
      )}
    </div>
  )
}

// ─── Página Principal ────────────────────────────────────────────────────────
export default function TurmasPage() {
  const [turmas, setTurmas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStyle, setActiveStyle] = useState<string | null>(null)
  const [studioId, setStudioId] = useState<string | null>(null)
  const [styles, setStyles] = useState<string[]>([])
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [view, setView] = useState<"cards" | "calendar">("cards")
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newForm, setNewForm] = useState({
    name: "", dance_style: "", level: "",
    teacherId: "",
    scheduleItems: [] as ScheduleItem[],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTurma, setSelectedTurma] = useState<any | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "", dance_style: "", level: "",
    teacherId: "",
    scheduleItems: [] as ScheduleItem[],
    max_students: 15,
  })
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid)
      if (!sid) { setLoading(false); return }
      try {
        // Carrega turmas do estúdio
        const res = await fetch(`/api/dance-studio/classes?studioId=${sid}`)
        const data = await res.json()
        const list = data.classes || []
        setTurmas(list)
        const uniqueStyles = [...new Set(list.map((c: any) => c.dance_style).filter(Boolean))] as string[]
        setStyles(uniqueStyles)

        // Carrega professores via API DanceFlow (professionals com professional_type = 'teacher')
        const teachersRes = await fetch(`/api/dance-studio/teachers?studioId=${sid}`)
        const profs = await teachersRes.json()
        if (Array.isArray(profs)) {
          setTeachers(profs.map((p: any) => ({ id: p.id, name: p.name })))
        }
      } catch { /* sem turmas */ }
      setLoading(false)
    }
    load()
  }, [])

  const handleCreateTurma = async () => {
    if (!newForm.name.trim() || !studioId) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/dance-studio/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          name: newForm.name,
          dance_style: newForm.dance_style,
          level: newForm.level,
          teacher_id: newForm.teacherId || null,
          schedule: newForm.scheduleItems,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar turma")
      const scheduleSummary = newForm.scheduleItems.length > 0
        ? newForm.scheduleItems.map(s => `${DB_DAY_LABELS[s.day_of_week]} ${s.start_time}`).join(", ")
        : "Sem horário"
      const teacherName =
        teachers.find(t => t.id === newForm.teacherId)?.name || "Não definido"
      setTurmas(prev => [{ ...data, teacherName, enrolledCount: 0, scheduleSummary }, ...prev])
      if (data.dance_style && !styles.includes(data.dance_style)) setStyles(prev => [...prev, data.dance_style])
      setNewForm({ name: "", dance_style: "", level: "", teacherId: "", scheduleItems: [] })
      setIsNewDialogOpen(false)
      toast({ title: "Turma criada!", description: `${data.name} foi criada com sucesso.` })
    } catch (err: any) {
      toast({ title: "Erro ao criar turma", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const addScheduleItem = () => {
    setNewForm(f => ({
      ...f,
      scheduleItems: [...f.scheduleItems, { day_of_week: 1, start_time: "08:00", end_time: "09:00" }],
    }))
  }

  const removeScheduleItem = (idx: number) => {
    setNewForm(f => ({ ...f, scheduleItems: f.scheduleItems.filter((_, i) => i !== idx) }))
  }

  const updateScheduleItem = (idx: number, field: keyof ScheduleItem, value: string | number) => {
    setNewForm(f => ({
      ...f,
      scheduleItems: f.scheduleItems.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }))
  }

  const openDetailsDialog = (turma: any) => {
    setSelectedTurma(turma)
    const scheduleItems: ScheduleItem[] = (turma.schedule || []).map((s: any) => ({
      day_of_week: s.day_of_week ?? 1,
      start_time: s.start_time ?? "08:00",
      end_time: s.end_time ?? "09:00",
    }))
    setEditForm({
      name: turma.name ?? "",
      dance_style: turma.dance_style ?? "",
      level: turma.level ?? "",
      teacherId: turma.professional_id ?? turma.teacher?.id ?? "",
      scheduleItems,
      max_students: turma.max_students ?? 15,
    })
    setIsEditMode(false)
    setIsDetailsDialogOpen(true)
  }

  const closeDetailsDialog = () => {
    setIsDetailsDialogOpen(false)
    setSelectedTurma(null)
    setIsEditMode(false)
  }

  const addEditScheduleItem = () => {
    setEditForm(f => ({
      ...f,
      scheduleItems: [...f.scheduleItems, { day_of_week: 1, start_time: "08:00", end_time: "09:00" }],
    }))
  }

  const removeEditScheduleItem = (idx: number) => {
    setEditForm(f => ({ ...f, scheduleItems: f.scheduleItems.filter((_, i) => i !== idx) }))
  }

  const updateEditScheduleItem = (idx: number, field: keyof ScheduleItem, value: string | number) => {
    setEditForm(f => ({
      ...f,
      scheduleItems: f.scheduleItems.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }))
  }

  const handleSaveTurma = async () => {
    if (!selectedTurma || !studioId) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/dance-studio/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTurma.id,
          studioId,
          name: editForm.name.trim(),
          dance_style: editForm.dance_style || null,
          level: editForm.level || null,
          teacher_id: editForm.teacherId || null,
          schedule: editForm.scheduleItems,
          max_students: editForm.max_students,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar turma")
      const teacherName = teachers.find(t => t.id === editForm.teacherId)?.name || "Não definido"
      const scheduleSummary = editForm.scheduleItems.length > 0
        ? editForm.scheduleItems.map(s => `${DB_DAY_LABELS[s.day_of_week]} ${s.start_time}`).join(", ")
        : "Sem horário"
      setTurmas(prev => prev.map(t => t.id === selectedTurma.id
        ? { ...t, ...data, teacherName, scheduleSummary, max_students: editForm.max_students }
        : t
      ))
      setIsEditMode(false)
      setSelectedTurma((prev: Record<string, unknown> | null) => prev ? { ...prev, ...data, teacherName, scheduleSummary } : null)
      toast({ title: "Turma atualizada!", description: `${editForm.name} foi atualizada com sucesso.` })
    } catch (err: any) {
      toast({ title: "Erro ao atualizar turma", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = activeStyle ? turmas.filter(t => t.dance_style === activeStyle) : turmas

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-violet-600" />
            Turmas & Aulas
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie todas as turmas do estúdio</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle view */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView("cards")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === "cards"
                  ? "bg-white dark:bg-slate-700 text-violet-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-white"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cards
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === "calendar"
                  ? "bg-white dark:bg-slate-700 text-violet-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-white"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Calendário
            </button>
          </div>
          <Button
            onClick={() => setIsNewDialogOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Turma
          </Button>
        </div>
      </div>

      {/* Filtro por modalidade (só em cards) */}
      {view === "cards" && styles.length > 0 && (
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
      ) : view === "calendar" ? (
        <WeekCalendar turmas={turmas} />
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
              <Button onClick={() => setIsNewDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl">
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
                    <p className="text-xs text-slate-500 mt-0.5">{turma.dance_style ?? "—"}</p>
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
                    <span>{turma.enrolledCount} {turma.enrolledCount === 1 ? "aluno" : "alunos"}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/solutions/estudio-de-danca/dashboard/turmas/${turma.id}/chamada`}>
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs font-bold border-violet-200 text-violet-600 hover:bg-violet-50">
                      Fazer Chamada
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl text-xs font-bold"
                    onClick={() => openDetailsDialog(turma)}
                  >
                    Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Diálogo Nova Turma ─────────────────────────────────────────── */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Turma</DialogTitle>
            <DialogDescription>Crie uma nova turma de dança no estúdio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="turmaName">Nome da Turma *</Label>
              <Input
                id="turmaName"
                placeholder="Ex: Ballet Infantil — Turma A"
                value={newForm.name}
                onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="turmaStyle">Modalidade</Label>
                <Input
                  id="turmaStyle"
                  placeholder="Ballet, Forró, Zumba..."
                  value={newForm.dance_style}
                  onChange={(e) => setNewForm(f => ({ ...f, dance_style: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="turmaLevel">Nível</Label>
                <Select
                  value={newForm.level || "all"}
                  onValueChange={(v) => setNewForm(f => ({ ...f, level: v === "all" ? "" : v }))}
                >
                  <SelectTrigger id="turmaLevel" className="h-10">
                    <SelectValue placeholder="Todos os níveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Professor responsável — o professor recebe a turma vinculada e sabe quando são as aulas */}
            <div>
              <Label htmlFor="turmaTeacher" className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                Professor responsável
              </Label>
              <Select
                value={newForm.teacherId || "none"}
                onValueChange={(v) => setNewForm(f => ({ ...f, teacherId: v === "none" ? "" : v }))}
              >
                <SelectTrigger id="turmaTeacher" className="h-10">
                  <SelectValue placeholder={teachers.length ? "Selecione o professor que dará as aulas" : "Cadastre professores em Professores"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem professor (definir depois)</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-500 mt-1">
                O professor verá esta turma no seu painel e saberá os horários das aulas.
              </p>
            </div>

            {/* Horários */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-pink-500" />
                  Horários da Turma
                </Label>
                <Button type="button" size="sm" variant="outline" onClick={addScheduleItem} className="h-7 text-xs font-bold rounded-lg border-violet-200 text-violet-600 hover:bg-violet-50">
                  <Plus className="w-3 h-3 mr-1" /> Adicionar horário
                </Button>
              </div>

              {newForm.scheduleItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 p-4 text-center text-xs text-slate-400">
                  Sem horários definidos — a turma aparecerá apenas na visão em cards.
                </div>
              ) : (
                <div className="space-y-2">
                  {newForm.scheduleItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                      <Select
                        value={String(item.day_of_week)}
                        onValueChange={(v) => updateScheduleItem(idx, "day_of_week", parseInt(v))}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs font-bold rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DB_DAY_LABELS.map((day, d) => (
                            <SelectItem key={d} value={String(d)} className="text-xs">{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="time"
                        value={item.start_time}
                        onChange={(e) => updateScheduleItem(idx, "start_time", e.target.value)}
                        className="h-8 w-24 text-xs font-bold rounded-lg"
                      />
                      <span className="text-xs text-slate-400 font-bold">até</span>
                      <Input
                        type="time"
                        value={item.end_time}
                        onChange={(e) => updateScheduleItem(idx, "end_time", e.target.value)}
                        className="h-8 w-24 text-xs font-bold rounded-lg"
                      />
                      <button
                        onClick={() => removeScheduleItem(idx)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTurma}
                disabled={isSaving || !newForm.name.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Criar Turma
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Diálogo Detalhes / Editar Turma ─────────────────────────────────── */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={(open) => !open && closeDetailsDialog()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Pencil className="w-4 h-4 text-violet-500" />
                  Editar Turma
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-violet-500" />
                  Detalhes da Turma
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Altere os dados da turma e salve." : "Visualize os dados da turma. Clique em Editar para alterar."}
            </DialogDescription>
          </DialogHeader>

          {selectedTurma && (
            <div className="space-y-4">
              {isEditMode ? (
                <>
                  <div>
                    <Label htmlFor="editTurmaName">Nome da Turma *</Label>
                    <Input
                      id="editTurmaName"
                      placeholder="Ex: Ballet Infantil — Turma A"
                      value={editForm.name}
                      onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="editTurmaStyle">Modalidade</Label>
                      <Input
                        id="editTurmaStyle"
                        placeholder="Ballet, Forró, Zumba..."
                        value={editForm.dance_style}
                        onChange={(e) => setEditForm(f => ({ ...f, dance_style: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editTurmaLevel">Nível</Label>
                      <Select
                        value={editForm.level || "all"}
                        onValueChange={(v) => setEditForm(f => ({ ...f, level: v === "all" ? "" : v }))}
                      >
                        <SelectTrigger id="editTurmaLevel" className="h-10">
                          <SelectValue placeholder="Todos os níveis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os níveis</SelectItem>
                          <SelectItem value="beginner">Iniciante</SelectItem>
                          <SelectItem value="intermediate">Intermediário</SelectItem>
                          <SelectItem value="advanced">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editTurmaMaxStudents">Máximo de alunos</Label>
                    <Input
                      id="editTurmaMaxStudents"
                      type="number"
                      min={1}
                      max={200}
                      value={editForm.max_students}
                      onChange={(e) => setEditForm(f => ({ ...f, max_students: parseInt(e.target.value) || 15 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editTurmaTeacher" className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                      Professor responsável
                    </Label>
                    <Select
                      value={editForm.teacherId || "none"}
                      onValueChange={(v) => setEditForm(f => ({ ...f, teacherId: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger id="editTurmaTeacher" className="h-10">
                        <SelectValue placeholder="Selecione o professor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem professor</SelectItem>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-pink-500" />
                        Horários da Turma
                      </Label>
                      <Button type="button" size="sm" variant="outline" onClick={addEditScheduleItem} className="h-7 text-xs font-bold rounded-lg border-violet-200 text-violet-600 hover:bg-violet-50">
                        <Plus className="w-3 h-3 mr-1" /> Adicionar
                      </Button>
                    </div>
                    {editForm.scheduleItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 p-4 text-center text-xs text-slate-400">
                        Sem horários definidos
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editForm.scheduleItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                            <Select
                              value={String(item.day_of_week)}
                              onValueChange={(v) => updateEditScheduleItem(idx, "day_of_week", parseInt(v))}
                            >
                              <SelectTrigger className="h-8 w-28 text-xs font-bold rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DB_DAY_LABELS.map((day, d) => (
                                  <SelectItem key={d} value={String(d)} className="text-xs">{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="time"
                              value={item.start_time}
                              onChange={(e) => updateEditScheduleItem(idx, "start_time", e.target.value)}
                              className="h-8 w-24 text-xs font-bold rounded-lg"
                            />
                            <span className="text-xs text-slate-400 font-bold">até</span>
                            <Input
                              type="time"
                              value={item.end_time}
                              onChange={(e) => updateEditScheduleItem(idx, "end_time", e.target.value)}
                              className="h-8 w-24 text-xs font-bold rounded-lg"
                            />
                            <button
                              onClick={() => removeEditScheduleItem(idx)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsEditMode(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveTurma}
                      disabled={isSaving || !editForm.name.trim()}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Salvar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg">{selectedTurma.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{selectedTurma.dance_style ?? "—"}</p>
                  </div>
                  {selectedTurma.level && (
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400 border-0 text-xs font-bold">
                      {selectedTurma.level}
                    </Badge>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <GraduationCap className="w-4 h-4 text-violet-500 shrink-0" />
                      <span>{selectedTurma.teacherName ?? "Não definido"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4 text-pink-500 shrink-0" />
                      <span>{selectedTurma.scheduleSummary ?? "Sem horário"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>
                        {selectedTurma.enrolledCount ?? 0} de {selectedTurma.max_students ?? 15} alunos
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => closeDetailsDialog()}
                    >
                      Fechar
                    </Button>
                    <Button
                      onClick={() => setIsEditMode(true)}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
