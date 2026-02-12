"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  User, 
  ArrowLeft,
  ChevronRight,
  Search,
  BookOpen,
  Loader2,
  CheckCircle2,
  Sparkles,
  Plus
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { isLimitReached } from "@/lib/plan-limits"

import { useVocabulary } from "@/hooks/use-vocabulary"

export default function ClassCatalog() {
  const { toast } = useToast()
  const { vocabulary } = useVocabulary()
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [myClassesIds, setMyClassesIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [joining, setJoining] = useState<string | null>(null)
  const [studioInfo, setStudioInfo] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("danceflow_user")
    if (userData) {
      const user = JSON.parse(userData)
      setStudent(user)
      fetchCatalog(user.id, user.studio_id)
    }
  }, [])

  const fetchCatalog = async (studentId: string, studioId: string) => {
    try {
      setIsLoading(true)
      
      // 0. Buscar informações do estúdio (incluindo plano)
      const { data: studioData } = await supabase
        .from('studios')
        .select('id, name, plan')
        .eq('id', studioId)
        .single()
      
      setStudioInfo(studioData)

      // 1. Buscar turmas já matriculadas
      const { data: myEnrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', studentId)
        .eq('status', 'active')
      
      const myIds = new Set(myEnrollments?.map(e => e.class_id) || [])
      setMyClassesIds(myIds)

      // 2. Buscar todas as turmas do estúdio
      const today = new Date().toISOString().split('T')[0]
      const [allClassData, cancelledSessions] = await Promise.all([
        supabase
          .from('classes')
          .select(`
            *,
            teachers (name)
          `)
          .eq('studio_id', studioId)
          .eq('status', 'active')
          .order('name', { ascending: true }),
        supabase
          .from('sessions')
          .select('class_id')
          .eq('studio_id', studioId)
          .eq('scheduled_date', today)
          .eq('status', 'cancelled')
      ])

      const classesWithCancelled = allClassData.data?.map(c => ({
        ...c,
        isCancelledToday: cancelledSessions.data?.some(s => s.class_id === c.id) || false
      }))

      setAvailableClasses(classesWithCancelled || [])
    } catch (error) {
      console.error("Error fetching catalog:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinClass = async (classItem: any) => {
    try {
      setJoining(classItem.id)

      // Usar a nova função RPC para matrícula atômica e segura
      const { data, error } = await supabase.rpc('enroll_student_in_class', {
        p_student_id: student.id,
        p_class_id: classItem.id,
        p_studio_id: student.studio_id
      })

      if (error) throw error

      if (!data.success) {
        toast({
          title: "Atenção",
          description: data.message,
          variant: data.message.includes('lotada') || data.message.includes('atingido') ? "destructive" : "default"
        })
        
        if (data.message.includes('lotada')) {
          fetchCatalog(student.id, student.studio_id)
        }
        return
      }

      // Enviar confirmação via WhatsApp (opcional, corre em paralelo)
      if (student.phone) {
        fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: student.phone.replace(/\D/g, ""),
            message: `Olá ${student.name}! ✨\n\nSua matrícula na turma *${classItem.name}* foi confirmada com sucesso! 💃\n\nEstamos ansiosos para ver você na aula!`,
            studioId: student.studio_id
          })
        }).catch(e => console.error("Erro ao enviar WhatsApp:", e))
      }

      toast({
        title: "Matrícula Realizada!",
        description: data.message,
      })

      setMyClassesIds(prev => new Set([...Array.from(prev), classItem.id]))
      fetchCatalog(student.id, student.studio_id)
      
    } catch (error: any) {
      console.error("Erro completo na matrícula:", error)
      toast({
        title: "Erro na matrícula",
        description: error.message || "Ocorreu um erro ao processar sua matrícula no servidor.",
        variant: "destructive"
      })
    } finally {
      setJoining(null)
    }
  }

  const filteredClasses = availableClasses.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.dance_style.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <Button variant="ghost" size="icon" onClick={() => window.location.href='/student/classes'}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Catálogo de {vocabulary.service}s</h1>
        </div>
      </div>
      
      <main className="container p-4 space-y-6 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar por estilo ou nome..."
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">Nenhuma turma encontrada.</p>
            </div>
          ) : filteredClasses.map((cls) => (
            <Card key={cls.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
              <CardHeader className="pb-3 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 uppercase text-[9px] font-bold">
                    {cls.dance_style}
                  </Badge>
                  {cls.isCancelledToday ? (
                    <Badge variant="destructive" className="bg-rose-500 text-white uppercase text-[9px] font-bold animate-pulse">CANCELADO HOJE</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] uppercase">{cls.level}</Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-lg">{cls.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <User className="w-3 h-3" /> {cls.teachers?.name || vocabulary.provider}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{Array.isArray(cls.schedule) && cls.schedule[0] ? `${cls.schedule[0].day} às ${cls.schedule[0].time}` : 'Sob consulta'}</span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-500">
                    {cls.current_students || 0}/{cls.max_students} vagas • {cls.credit_cost || 1} CRÉDITOS
                  </div>
                </div>

                {myClassesIds.has(cls.id) ? (
                  <Button className="w-full bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-50 cursor-default font-bold" disabled>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> JÁ MATRICULADO
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold"
                    onClick={() => handleJoinClass(cls)}
                    disabled={joining === cls.id || (cls.current_students >= cls.max_students)}
                  >
                    {joining === cls.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {cls.current_students >= cls.max_students ? 'TURMA LOTADA' : 'MATRICULAR-SE'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg mt-8">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">{vocabulary.service} Experimental?</p>
              <p className="text-xs text-indigo-100">Fale com a gente no WhatsApp para marcar uma {vocabulary.service.toLowerCase()} gratuita!</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
