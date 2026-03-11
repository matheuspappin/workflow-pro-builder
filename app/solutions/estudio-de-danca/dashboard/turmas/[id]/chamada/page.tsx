"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Save,
  Users,
  Calendar as CalendarIcon,
  Clock
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { createCreditUsagePayment } from "@/lib/actions/credit-payments"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function DanceFlowAttendancePage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { toast } = useToast()
  
  const [adminData, setAdminData] = useState<any>(null)
  const [classInfo, setClassInfo] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [prevAttendance, setPrevAttendance] = useState<Record<string, string>>({})
  const [contentTaught, setContentTaught] = useState("")
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [businessModel, setBusinessModel] = useState<'CREDIT' | 'MONETARY'>('MONETARY')

  useEffect(() => {
    loadAttendanceData()
  }, [id])

  const loadAttendanceData = async () => {
    try {
      setLoading(true)
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) {
        router.push("/solutions/estudio-de-danca/login")
        return
      }

      const user = JSON.parse(userStr)
      setAdminData(user)

      // Carregar informações da turma
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single()

      if (classError || !classData) {
        toast({
          title: "Turma não encontrada",
          description: "Não foi possível carregar as informações da turma.",
          variant: "destructive"
        })
        router.push("/solutions/estudio-de-danca/dashboard/turmas")
        return
      }

      setClassInfo(classData)

      // Carregar business model
      const { data: studio } = await supabase
        .from('studios')
        .select('business_model')
        .eq('id', classData.studio_id)
        .single()
      setBusinessModel(studio?.business_model || 'MONETARY')

      // Buscar alunos matriculados na turma
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select(`
          student_id,
          students (
            id,
            name,
            email,
            student_lesson_credits (
              remaining_credits,
              total_credits,
              expiry_date
            )
          )
        `)
        .eq('class_id', id)
        .eq('status', 'active')

      const enrolledStudents = enrollments?.map(e => ({
        ...e.students,
        credits: (e.students as any).student_lesson_credits?.[0]?.remaining_credits || 0,
        totalCredits: (e.students as any).student_lesson_credits?.[0]?.total_credits || 0,
        expiryDate: (e.students as any).student_lesson_credits?.[0]?.expiry_date
      })) || []

      setStudents(enrolledStudents)

      // Buscar attendance de hoje
      const today = new Date().toISOString().split('T')[0]
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', id)
        .eq('date', today)

      const attendanceMap: Record<string, string> = {}
      const notesMap: Record<string, string> = {}
      
      attendanceData?.forEach(record => {
        attendanceMap[record.student_id] = record.status
        notesMap[record.student_id] = record.notes || ''
      })

      setAttendance(attendanceMap)
      setPrevAttendance(attendanceMap)
      setStudentNotes(notesMap)

      // Criar session se não existir
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('class_id', id)
        .eq('date', today)
        .single()

      if (!sessionData) {
        const { data: newSession } = await supabase
          .from('sessions')
          .insert({
            studio_id: classData.studio_id,
            class_id: id,
            scheduled_date: today,
            date: today,
            actual_professional_id: classData.professional_id || null,
            status: 'agendada',
            content_taught: ''
          })
          .select()
          .single()
        setCurrentSession(newSession)
      } else {
        setCurrentSession(sessionData)
        setContentTaught(sessionData.content_taught || '')
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados da chamada.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudentNotes(prev => ({ ...prev, [studentId]: notes }))
  }

  const saveAttendance = async () => {
    if (!currentSession) return

    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      for (const student of students) {
        const currentStatus = attendance[student.id] || 'absent'
        const previousStatus = prevAttendance[student.id] || 'absent'
        const notes = studentNotes[student.id] || ''

        // Atualizar ou inserir attendance
        if (currentStatus !== previousStatus) {
          const { data: existingRecord } = await supabase
            .from('attendance')
            .select('*')
            .eq('class_id', id)
            .eq('student_id', student.id)
            .eq('date', today)
            .single()

          if (existingRecord) {
            await supabase
              .from('attendance')
              .update({
                status: currentStatus,
                notes,
                session_id: currentSession.id
              })
              .eq('id', existingRecord.id)
          } else {
            await supabase
              .from('attendance')
              .insert({
                class_id: id,
                student_id: student.id,
                date: today,
                status: currentStatus,
                notes,
                session_id: currentSession.id
              })
          }

          // Descontar crédito se modelo CREDIT e aluno presente
          if (businessModel === 'CREDIT' && currentStatus === 'present' && previousStatus !== 'present') {
            const { data: credits } = await supabase
              .from('student_lesson_credits')
              .select('*')
              .eq('student_id', student.id)
              .eq('studio_id', classInfo.studio_id)
              .maybeSingle()

            if (credits && credits.remaining_credits > 0) {
              // Verificar expiração
              const expiryDate = credits.expiry_date ? new Date(credits.expiry_date) : null
              const todayDate = new Date()
              todayDate.setHours(0, 0, 0, 0)

              if (expiryDate && expiryDate < todayDate) {
                toast({
                  title: "Créditos congelados",
                  description: `${student.name} tem créditos expirados.`,
                  variant: "destructive"
                })
                continue
              }

              // Descontar crédito
              await supabase
                .from('student_lesson_credits')
                .update({ 
                  remaining_credits: credits.remaining_credits - 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', credits.id)

              // Registrar uso
              await supabase.from('student_credit_usage').insert({
                studio_id: classInfo.studio_id,
                student_id: student.id,
                class_id: id,
                session_id: currentSession.id,
                credits_used: 1,
                usage_type: 'class_attendance',
                notes: `Presença em ${classInfo.name} (Registrado pela Admin)`
              })

              // Registrar cobrança no financeiro (uso de crédito em aula)
              await createCreditUsagePayment({
                studioId: classInfo.studio_id,
                studentId: student.id,
                description: `Aula: ${classInfo.name}`,
                creditsUsed: 1,
                paymentSource: 'class',
                referenceId: id,
              })

              // Notificar se créditos baixos
              if (credits.remaining_credits - 1 <= 2) {
                fetch('/api/whatsapp/notify-low-credits', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    studentId: student.id,
                    studioId: classInfo.studio_id,
                    remainingCredits: credits.remaining_credits - 1,
                    clientName: student.name,
                    establishmentName: adminData?.studioName || 'Estúdio'
                  })
                }).catch(() => {})
              }
            }
          }

          // Estornar crédito se mudou de presente para ausente
          if (businessModel === 'CREDIT' && currentStatus !== 'present' && previousStatus === 'present') {
            const { data: credits } = await supabase
              .from('student_lesson_credits')
              .select('*')
              .eq('student_id', student.id)
              .eq('studio_id', classInfo.studio_id)
              .maybeSingle()

            if (credits) {
              await supabase
                .from('student_lesson_credits')
                .update({ 
                  remaining_credits: Math.min(credits.remaining_credits + 1, credits.total_credits),
                  updated_at: new Date().toISOString()
                })
                .eq('id', credits.id)

              await supabase.from('student_credit_usage').insert({
                studio_id: classInfo.studio_id,
                student_id: student.id,
                class_id: id,
                session_id: currentSession.id,
                credits_used: -1,
                usage_type: 'refund',
                notes: `Estorno de presença em ${classInfo.name} (Registrado pela Admin)`
              })
            }
          }
        }
      }

      // Atualizar conteúdo da aula e marcar como realizada (dispara geração de pagamento do professor)
      const presentCount = Object.values(attendance).filter(s => s === 'present' || s === 'confirmed').length
      await supabase
        .from('sessions')
        .update({
          content_taught: contentTaught,
          status: 'realizada',
          attendance_count: presentCount,
          ...(classInfo?.professional_id && { actual_professional_id: classInfo.professional_id }),
        })
        .eq('id', currentSession.id)

      toast({
        title: "Chamada salva!",
        description: "Presenças e créditos atualizados com sucesso."
      })

    } catch (error) {
      console.error('Erro ao salvar chamada:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a chamada.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header title="Chamada" />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <Link href="/solutions/estudio-de-danca/dashboard/turmas">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Turmas
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Chamada - {classInfo?.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-violet-100 text-violet-700">
                {students.length} alunos
              </Badge>
              {businessModel === 'CREDIT' && (
                <Badge className="bg-indigo-100 text-indigo-700">
                  Modelo por créditos
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de alunos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lista de Presença
                </CardTitle>
                <CardDescription>
                  Marque a presença dos alunos na aula de hoje
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-violet-100 text-violet-600">
                            {student.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          {businessModel === 'CREDIT' && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {student.credits} créditos
                              </Badge>
                              {student.credits === 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  Sem créditos
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                          className={cn(
                            "rounded-full",
                            attendance[student.id] === 'present' 
                              ? "bg-emerald-600 hover:bg-emerald-700" 
                              : "hover:bg-emerald-50"
                          )}
                          onClick={() => handleAttendanceChange(student.id, 'present')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'absent' ? 'default' : 'outline'}
                          className={cn(
                            "rounded-full",
                            attendance[student.id] === 'absent' 
                              ? "bg-rose-600 hover:bg-rose-700" 
                              : "hover:bg-rose-50"
                          )}
                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel lateral */}
          <div className="space-y-6">
            {/* Conteúdo da aula */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Conteúdo da Aula
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="O que foi ensinado hoje?"
                  value={contentTaught}
                  onChange={(e) => setContentTaught(e.target.value)}
                  className="mb-4"
                />
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Chamada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Presentes:</span>
                    <span className="font-bold text-emerald-600">
                      {Object.values(attendance).filter(s => s === 'present').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ausentes:</span>
                    <span className="font-bold text-rose-600">
                      {Object.values(attendance).filter(s => s === 'absent').length}
                    </span>
                  </div>
                  {businessModel === 'CREDIT' && (
                    <div className="flex justify-between">
                      <span>Créditos usados:</span>
                      <span className="font-bold text-indigo-600">
                        {Object.values(attendance).filter(s => s === 'present').length}
                      </span>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={saveAttendance} 
                  disabled={saving}
                  className="w-full mt-4 bg-violet-600 hover:bg-violet-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Chamada
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
