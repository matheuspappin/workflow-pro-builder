"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle,
  Loader2,
  UserPlus
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TeacherClassDetailsPage() {
  const { id } = useParams() as { id: string }
  const { toast } = useToast()
  
  const [teacherData, setTeacherData] = useState<any>(null)
  const [classInfo, setClassInfo] = useState<any>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResult, setSearchResult] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    loadClassDetails()
  }, [id])

  const loadClassDetails = async () => {
    try {
      setLoading(true)
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const user = JSON.parse(userStr)
      setTeacherData(user)

      // 1. Buscar informações da turma
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single()
      
      setClassInfo(classData)

      // 2. Buscar alunos matriculados
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          student:students(*)
        `)
        .eq('class_id', id)
        .eq('status', 'active')

      setEnrolledStudents(enrollments?.map(e => e.student) || [])
    } catch (error) {
      console.error('Erro ao carregar detalhes da turma:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchStudents = async (val: string) => {
    setSearchTerm(val)
    if (val.length < 3) {
      setSearchResult([])
      return
    }

    setIsSearching(true)
    try {
      const { data } = await supabase
        .from('students')
        .select('*')
        .or(`name.ilike.%${val}%,email.ilike.%${val}%`)
        .eq('studio_id', classInfo.studio_id)
        .limit(5)

      setSearchResult(data || [])
    } catch (error) {
      console.error('Erro na busca:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleEnrollStudent = async (student: any) => {
    try {
      // Verificar se já está matriculado
      if (enrolledStudents.some(s => s.id === student.id)) {
        toast({
          title: "Aviso",
          description: "Aluno ja esta matriculado nesta turma.",
          variant: "default"
        })
        return
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          studio_id: classInfo.studio_id,
          student_id: student.id,
          class_id: id,
          status: 'active'
        })

      if (error) throw error

      // Atualizar contagem na turma
      await supabase
        .from('classes')
        .update({ current_students: (classInfo.current_students || 0) + 1 })
        .eq('id', id)

      toast({
        title: "Sucesso",
        description: `${student.name} matriculado(a) com sucesso!`
      })
      
      setSearchTerm("")
      setSearchResult([])
      loadClassDetails()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  if (loading) return null

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/classes">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{classInfo?.name}</h2>
          <p className="text-xs text-muted-foreground">{classInfo?.dance_style} • {classInfo?.level}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Alunos Matriculados</CardTitle>
                <CardDescription className="text-xs">Lista atual da turma</CardDescription>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold">
                {enrolledStudents.length} / {classInfo?.max_students}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {enrolledStudents.length > 0 ? (
                enrolledStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                          {student.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{student.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {student.phone}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[8px] font-black">Ativo</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground text-xs italic">Nenhum aluno matriculado.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Student Sidebar */}
        <Card className="border-none shadow-sm h-fit bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Adicionar Aluno
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Matricular novo aluno nesta turma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Buscar por nome..."
                className="pl-9 bg-slate-50 dark:bg-slate-800 border-none h-10 text-sm"
                value={searchTerm}
                onChange={(e) => handleSearchStudents(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              ) : searchResult.length > 0 ? (
                searchResult.map((student) => (
                  <div key={student.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{student.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{student.email}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50" onClick={() => handleEnrollStudent(student)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : searchTerm.length >= 3 ? (
                <p className="text-center text-[10px] text-muted-foreground py-4 italic">Nenhum aluno encontrado.</p>
              ) : null}
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
              <p className="text-[10px] text-amber-800 dark:text-amber-300 text-center leading-relaxed">
                Apenas alunos já cadastrados no sistema podem ser matriculados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
