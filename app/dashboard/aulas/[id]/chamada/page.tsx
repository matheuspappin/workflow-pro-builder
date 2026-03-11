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
  Calendar as CalendarIcon
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { createCreditUsagePayment } from "@/lib/actions/credit-payments"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useVocabulary } from "@/hooks/use-vocabulary"

export default function AdminAttendancePage() {
  const { id } = useParams() as { id: string }
  const { vocabulary, language } = useVocabulary()
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

  useEffect(() => {
    loadAttendanceData()
  }, [id])

  const loadAttendanceData = async () => {
    try {
      setLoading(true)
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const user = JSON.parse(userStr)
      setAdminData(user)

      // 1. Buscar informações da turma
      const { data: classData } = await supabase
        .from('classes')
        .select('*, teacher:teachers(id, name)')
        .eq('id', id)
        .single()
      
      setClassInfo(classData)

      // 2. Buscar ou criar sessão para hoje
      const today = new Date().toISOString().split('T')[0]
      let { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('class_id', id)
        .eq('scheduled_date', today)
        .maybeSingle()

      if (!session) {
        // Se não houver sessão, criamos uma (como admin, usamos o professor vinculado à turma)
        const { data: newSession, error: createError } = await supabase
          .from('sessions')
          .insert({
            studio_id: classData.studio_id,
            class_id: id,
            scheduled_date: today,
            actual_teacher_id: classData.teacher?.id || null,
            status: 'agendada'
          })
          .select()
          .single()
        
        if (createError) throw createError
        session = newSession
      }
      
      setCurrentSession(session)
      setContentTaught(session.content_taught || "")

      // 3. Buscar {vocabulary.clients.toLowerCase()} matriculados
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          student:students(*)
        `)
        .eq('class_id', id)
        .eq('status', 'active')

      const studentsList = enrollments?.map(e => e.student) || []
      setStudents(studentsList)

      // 4. Buscar presenças já registradas para esta sessão
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', id)
        .eq('date', today)

      const initialAttendance: Record<string, string> = {}
      const initialNotes: Record<string, string> = {}
      
      studentsList.forEach(s => {
        const record = existingAttendance?.find(a => a.student_id === s.id)
        const status = record ? record.status : 'present'
        initialAttendance[s.id] = status
        initialNotes[s.id] = record?.notes || ""
      })
      
      setAttendance(initialAttendance)
      setPrevAttendance(initialAttendance)
      setStudentNotes(initialNotes)

    } catch (error) {
      console.error('Erro ao carregar dados de chamada:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }))
  }

  const handleSaveAttendance = async () => {
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        studio_id: classInfo.studio_id,
        student_id: studentId,
        class_id: id,
        session_id: currentSession.id,
        date: today,
        status: status,
        notes: studentNotes[studentId] || ""
      }))

      // Upsert presenças
      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, { onConflict: 'studio_id, student_id, class_id, date' })

      if (attendanceError) throw attendanceError

      for (const [studentId, status] of Object.entries(attendance)) {
        const studentName = students.find((s: any) => (s.student?.id ?? s.id) === studentId)?.student?.name ?? 'Aluno'
        const oldStatus = prevAttendance[studentId]
        const isNowPresent = status === 'present' || status === 'confirmed'
        const wasPreviouslyPresent = oldStatus === 'present' || oldStatus === 'confirmed'

        if (status !== oldStatus) {
          const title = isNowPresent ? 'Presença Confirmada' : 'Falta Registrada';
          const message = isNowPresent 
            ? `Sua presença na ${vocabulary.service.toLowerCase()} de ${classInfo.name} do dia ${new Date().toLocaleDateString('pt-BR')} foi confirmada.`
            : `Foi registrada uma falta na ${vocabulary.service.toLowerCase()} de ${classInfo.name} do dia ${new Date().toLocaleDateString('pt-BR')}.`;
          
          supabase.from('notifications').insert({
            studio_id: classInfo.studio_id,
            user_id: studentId,
            title,
            message,
            type: isNowPresent ? 'success' : 'info'
          }).then(() => {});
        }

        if (isNowPresent && !wasPreviouslyPresent) {
          const { data: usage } = await supabase
            .from('student_credit_usage')
            .select('id')
            .eq('student_id', studentId)
            .eq('session_id', currentSession.id)
            .maybeSingle()

          if (!usage) {
            const { data: credits } = await supabase
              .from('student_lesson_credits')
              .select('*')
              .eq('student_id', studentId)
              .maybeSingle()

            if (credits && credits.remaining_credits > 0) {
              // Verificar se os créditos estão congelados (expirados)
              const expiryDate = credits.expiry_date ? new Date(credits.expiry_date) : null;
              const todayDate = new Date();
              todayDate.setHours(0, 0, 0, 0);

              if (expiryDate && expiryDate < todayDate) {
                toast({
                  title: "Créditos Congelados",
                  description: `Os créditos de ${studentName} estão congelados (expiraram em ${expiryDate.toLocaleDateString('pt-BR')}).`,
                  variant: "destructive"
                });
                
                // Reverter status na UI para evitar inconsistência visual se desejar, 
                // ou apenas impedir o desconto
                setAttendance(prev => ({ ...prev, [studentId]: 'absent' }));
                continue; // Pula para o próximo aluno
              }

              await supabase
                .from('student_lesson_credits')
                .update({ 
                  remaining_credits: credits.remaining_credits - 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', credits.id)

              await supabase.from('student_credit_usage').insert({
                studio_id: classInfo.studio_id,
                student_id: studentId,
                class_id: id,
                session_id: currentSession.id,
                credits_used: 1,
                usage_type: 'class_attendance',
                notes: `Presença em ${classInfo.name} (Registrado pela Admin)`
              })

              // Registrar cobrança no financeiro (uso de crédito em aula)
              await createCreditUsagePayment({
                studioId: classInfo.studio_id,
                studentId,
                description: `Aula: ${classInfo.name}`,
                creditsUsed: 1,
                paymentSource: 'class',
                referenceId: id,
              })

              if (credits.remaining_credits - 1 <= 2) {
                fetch('/api/whatsapp/notify-low-credits', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    studentId,
                    studioId: classInfo.studio_id,
                    remainingCredits: credits.remaining_credits - 1,
                    clientName: studentName,
                    establishmentName: adminData?.studioName || vocabulary.establishment
                  })
                }).catch(() => {});

                supabase.from('notifications').insert({
                  studio_id: classInfo.studio_id,
                  user_id: studentId,
                  title: 'Créditos Baixos',
                  message: `Você tem apenas ${credits.remaining_credits - 1} créditos restantes.`,
                  type: 'warning'
                }).then(() => {});
              }
            }
          }
        } else if (!isNowPresent && wasPreviouslyPresent) {
          const { data: credits } = await supabase
            .from('student_lesson_credits')
            .select('*')
            .eq('student_id', studentId)
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
              student_id: studentId,
              class_id: id,
              session_id: currentSession.id,
              credits_used: -1,
              usage_type: 'refund',
              notes: `Estorno de presença em ${classInfo.name} (Registrado pela Admin)`
            })
          }
        }
      }

      const presentCount = Object.values(attendance).filter(s => s === 'present' || s === 'confirmed').length
      await supabase
        .from('sessions')
        .update({ 
          status: 'realizada',
          attendance_count: presentCount,
          content_taught: contentTaught
        })
        .eq('id', currentSession.id)

      toast({
        title: "Chamada Realizada",
        description: "As presenças foram salvas com sucesso pela administração."
      })
      router.push('/dashboard/ao-vivo')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header title="Gerenciar Chamada" />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Header title="Gerenciar Chamada" />
      
      <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/ao-vivo`}>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Painel de Chamada (Admin)</h2>
              <p className="text-sm text-muted-foreground">{classInfo?.name} • {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold h-10"
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar e Finalizar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Save className="w-5 h-5 text-indigo-600" />
                Resumo da {vocabulary.service}
              </CardTitle>
              <CardDescription>O {vocabulary.provider.toLowerCase()} ou administrador pode registrar o que foi ensinado.</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[80px] p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                placeholder="O que foi ensinado hoje?..."
                value={contentTaught}
                onChange={(e) => setContentTaught(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Lista de {vocabulary.clients}
                </CardTitle>
                <div className="flex gap-3 text-[10px] font-black uppercase">
                  <span className="text-emerald-600">Presentes: {Object.values(attendance).filter(v => v === 'present' || v === 'confirmed').length}</span>
                  <span className="text-rose-600">Faltas: {Object.values(attendance).filter(v => v === 'absent').length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {students.length > 0 ? (
                  students.map((student) => (
                    <div 
                      key={student.id} 
                      className={cn(
                        "p-4 transition-colors",
                        attendance[student.id] === 'absent' ? "bg-rose-50/20" : "bg-white dark:bg-slate-900/50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                          <Avatar className="h-10 w-10 border border-slate-100 shrink-0">
                            <AvatarFallback className={cn(
                              "font-bold text-xs",
                              attendance[student.id] === 'present' || attendance[student.id] === 'confirmed' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            )}>
                              {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-bold text-sm truncate">{student.name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {attendance[student.id] === 'confirmed' && (
                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[8px] font-black uppercase">WhatsApp ✅</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          size="sm"
                          variant="outline"
                          className={cn(
                            "h-10 px-4 font-black text-[10px] uppercase border-2 shrink-0 transition-all",
                            attendance[student.id] === 'present' || attendance[student.id] === 'confirmed'
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-rose-500 bg-rose-50 text-rose-700"
                          )}
                          onClick={() => toggleStatus(student.id)}
                        >
                          {attendance[student.id] === 'present' || attendance[student.id] === 'confirmed' ? "Presente" : "Faltou"}
                        </Button>
                      </div>
                      
                      <Input
                        placeholder={`Observação da admin sobre este ${vocabulary.client.toLowerCase()}...`}
                        className="mt-3 h-8 text-[10px] bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-lg"
                        value={studentNotes[student.id] || ""}
                        onChange={(e) => setStudentNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-4 text-muted-foreground text-xs italic">
                    Nenhum {vocabulary.client.toLowerCase()} matriculado nesta {vocabulary.service.toLowerCase()}.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
