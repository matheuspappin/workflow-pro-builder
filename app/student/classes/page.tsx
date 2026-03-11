"use client"

import { useState, useEffect } from "react"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  ArrowLeft,
  ChevronRight,
  PlayCircle,
  MapPin,
  User,
  Loader2,
  LayoutDashboard,
  Calendar as CalendarIcon,
  CreditCard,
  User as UserIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useVocabulary } from "@/hooks/use-vocabulary"

export default function StudentClasses() {
  const { vocabulary } = useVocabulary()
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [myClasses, setMyClasses] = useState<any[]>([])

  useEffect(() => {
    async function init() {
      // Validar sessão via getUser() (não apenas localStorage)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setIsLoading(false)
        window.location.href = '/login'
        return
      }

      let userData: any = {}
      const raw = localStorage.getItem("danceflow_user")
      if (raw) {
        try { userData = JSON.parse(raw) } catch { localStorage.removeItem("danceflow_user") }
      }

      const merged = {
        ...userData,
        id: authUser.id,
        studio_id: userData.studio_id || userData.studioId || authUser.user_metadata?.studio_id,
      }
      setStudent(merged)
      fetchClasses(authUser.id)
    }
    init()
  }, [])

  const fetchClasses = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          class_id,
          status,
          classes (
            id,
            name,
            dance_style,
            level,
            schedule,
            teachers (name)
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')

      if (error) throw error

      const formattedClasses = data?.map((item: any) => ({
        id: item.classes?.id,
        name: item.classes?.name,
        style: item.classes?.dance_style,
        level: item.classes?.level,
        teacher: item.classes?.teachers?.name || vocabulary.provider,
        // CORRIGIDO: usar day_of_week e start_time (campos reais do banco)
        schedule: Array.isArray(item.classes?.schedule)
          ? item.classes.schedule.map((s: any) => {
              const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
              const dayName = days[s.day_of_week] || s.day || '?'
              const time = s.start_time || s.time || '--'
              return `${dayName} às ${time}`
            }).join(', ')
          : 'Horário a definir',
        room: 'Sala Principal',
        status: item.status,
      })) || []

      setMyClasses(formattedClasses)
    } catch (error) {
      console.error("Erro ao buscar turmas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-50 border-b">
        <div className="container flex h-16 items-center px-4 gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => window.location.href = '/student'}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Minhas {vocabulary.service}s</h1>
        </div>
      </div>

      <main className="container p-4 space-y-4 max-w-md mx-auto">
        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider px-1">Turmas Ativas</p>

        {myClasses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma turma ativa encontrada.
          </p>
        )}

        {myClasses.map((cls) => (
          <Card key={cls.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-0">
              <div className="p-4 flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <PlayCircle className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{cls.name}</h3>
                    {cls.level && <Badge variant="outline" className="text-[10px] uppercase">{cls.level}</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>{cls.teacher}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{cls.schedule}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 px-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <MapPin className="w-3 h-3" />
                  {cls.room}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-indigo-600 hover:text-indigo-700 p-0 gap-1">
                  Ver detalhes <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full border-dashed border-indigo-200 text-indigo-600 bg-indigo-50/30 hover:bg-indigo-50 h-12 text-sm font-bold gap-2"
            onClick={() => window.location.href = '/student/classes/catalogo'}
          >
            Quero me matricular em outra turma
          </Button>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t flex items-center justify-around h-16 px-4 z-50">
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href = '/student'}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Início</span>
        </Button>
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-primary" onClick={() => window.location.href = '/student/classes'}>
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px]">{vocabulary.service}s</span>
        </Button>
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href = '/student/payments'}>
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px]">Pagar</span>
        </Button>
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href = '/student/profile'}>
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px]">Perfil</span>
        </Button>
      </nav>
    </div>
  )
}
