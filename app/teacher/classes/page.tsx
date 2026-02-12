"use client"

import { useState, useEffect } from "react"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Calendar, 
  Users, 
  Clock, 
  ChevronRight,
  BookOpen,
  Filter,
  Plus,
  Loader2,
  CheckCircle2,
  DollarSign
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useVocabulary } from "@/hooks/use-vocabulary"

export default function TeacherClassesPage() {
  const { toast } = useToast()
  const { vocabulary } = useVocabulary()
  const [teacherData, setTeacherData] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const handleCancelClassToday = async (classId: string) => {
    try {
      setIsCancelling(classId)
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase.rpc('cancel_class_session', {
        p_class_id: classId,
        p_date: today,
        p_studio_id: studioId,
        p_teacher_id: teacherData.id
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Aula Cancelada",
          description: data.message,
        })
        loadTeacherClasses()
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
    loadTeacherClasses()
  }, [])

  const loadTeacherClasses = async () => {
    try {
      setLoading(true)
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const user = JSON.parse(userStr)

      // 1. Buscar ID do professor
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle()

      setTeacherData(teacher || user)
      const teacherId = teacher?.id

      if (teacherId) {
        // 2. Buscar turmas
        const { data: classesData, error } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('name', { ascending: true })

        if (error) throw error
        setClasses(classesData || [])
      }
    } catch (error) {
      console.error('Erro ao carregar turmas do professor:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.dance_style.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return null

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Meus {vocabulary.service}s</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus {vocabulary.service.toLowerCase()}s e {vocabulary.client.toLowerCase()}s matriculados.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder={`Buscar ${vocabulary.service.toLowerCase()}...`} 
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0 bg-white dark:bg-slate-900 h-10 w-10">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.length > 0 ? (
          filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all bg-white dark:bg-slate-900">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <Badge variant={classItem.status === 'active' ? "default" : "secondary"} className="text-[10px] uppercase">
                    {classItem.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-lg font-bold">{classItem.name}</CardTitle>
                <CardDescription className="text-xs">{classItem.dance_style} • {classItem.level}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{classItem.current_students || 0}/{classItem.max_students}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>R$ {classItem.price || 0}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Link href={`/teacher/classes/${classItem.id}`} className="flex-1">
                      <Button className="w-full h-9 text-xs bg-indigo-600 hover:bg-indigo-700 font-bold">Ver {vocabulary.client}s</Button>
                    </Link>
                    <Link href={`/teacher/classes/${classItem.id}/chamada`}>
                      <Button variant="outline" size="icon" className="h-9 w-9 border-indigo-100 text-indigo-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full h-8 text-[10px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold uppercase tracking-wider"
                    onClick={() => handleCancelClassToday(classItem.id)}
                    disabled={isCancelling === classItem.id}
                  >
                    {isCancelling === classItem.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Cancelar {vocabulary.service} de Hoje
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground text-sm">Nenhum(a) {vocabulary.service.toLowerCase()} encontrado(a).</p>
          </div>
        )}
      </div>
    </main>
  )
}
