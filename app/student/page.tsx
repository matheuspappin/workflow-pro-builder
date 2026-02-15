"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  Trophy, 
  ChevronRight,
  Plus,
  PlayCircle,
  AlertCircle,
  History,
  Receipt,
  LayoutDashboard,
  User,
  Loader2,
  Sparkles,
  QrCode as QrCodeIcon
} from "lucide-react"
import QRCode from "react-qr-code"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useVocabulary } from "@/hooks/use-vocabulary"

export default function StudentDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { vocabulary } = useVocabulary()
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nextClass, setNextClass] = useState<any>(null)
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null)
  const [pendingPayment, setPendingPayment] = useState<any>(null)
  const [studentCredits, setStudentCredits] = useState<any>(null)
  const [creditPackages, setCreditPackages] = useState<any[]>([])
  const [availableToday, setAvailableToday] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [isClassQrOpen, setIsClassQrOpen] = useState(false)
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false)
  const [isStatementOpen, setIsStatementOpen] = useState(false)
  const [isBuying, setIsBuyIng] = useState(false)
  const [creditTransactions, setCreditTransactions] = useState<any[]>([])

  const handleBuyCredits = async (pkg: any) => {
    try {
      setIsBuyIng(true)
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: pkg.id,
          amount: Number(pkg.price),
          description: `Pacote: ${pkg.name}`,
          studentId: student.id,
          studioId: student.studio_id || student.studioId,
          type: 'package'
        })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento')
      }
    } catch (e: any) {
      toast({
        title: "Erro técnico",
        description: e.message,
        variant: "destructive"
      })
    } finally {
      setIsBuyIng(false)
    }
  }

  const [activeAttendanceId, setActiveAttendanceId] = useState<string | null>(null)

  const handleConfirmAttendance = async (classToBook?: any) => {
    try {
      const targetClass = classToBook || nextClass
      if (!targetClass) return

      // Validar créditos antes de mostrar QR de reserva existente
      if (!classToBook && (!studentCredits || studentCredits.remaining_credits <= 0)) {
        toast({
          title: "Créditos insuficientes ⚠️",
          description: "Você não possui créditos para esta aula. Por favor, adquira um novo pacote.",
          variant: "destructive"
        })
        setIsBuyCreditsOpen(true)
        return
      }

      // Se for uma reserva nova OU se não houver registro de presença para hoje
      if (classToBook || !attendanceRecord) {
        setIsLoading(true) // Mostrar loading enquanto gera o QR
        const { data, error } = await supabase.rpc('enroll_student_in_class', {
          p_student_id: student.id,
          p_class_id: targetClass.id,
          p_studio_id: student.studio_id
        })

        if (error) throw error

        if (!data.success) {
          toast({
            title: "Não foi possível gerar check-in",
            description: data.message,
            variant: "destructive"
          })
          setIsLoading(false)
          return
        }

        if (classToBook) {
          toast({
            title: "Reserva Realizada! 🗓️",
            description: data.message,
          })
        }
        
        // Ensure immediate UI update
        if (data.attendance_id) {
           setActiveAttendanceId(data.attendance_id);
           setIsClassQrOpen(true);
        }
        
        await fetchStudentData(student.id, student.studio_id)
        setIsLoading(false)
        return
      }

      // Se já existe um registro de presença, apenas mostramos o QR
      setActiveAttendanceId(attendanceRecord.id);
      setIsClassQrOpen(true)
    } catch (e: any) {
      setIsLoading(false)
      toast({
        title: "Erro ao processar check-in",
        description: e.message,
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      
      const userData = localStorage.getItem("danceflow_user")
      let userFromStorage = null;
      if (userData) {
        try {
          userFromStorage = JSON.parse(userData);
        } catch (e) {
          console.error("Erro ao parsear dados do usuário do localStorage:", e);
          localStorage.removeItem("danceflow_user"); // Limpa dados corrompidos
        }
      }

      if (!session?.user || !userFromStorage) {
        // Se não houver sessão ou dados de usuário válidos, redireciona para o login
        console.log("⚠️ Nenhuma sessão ou dados de usuário válidos encontrados. Redirecionando para /login");
        router.push("/login");
        setIsLoading(false);
        return;
      }
      
      const studentId = session.user.id; // Use SEMPRE o ID do usuário da sessão do Supabase Auth
      setStudent({ ...userFromStorage, id: studentId });
      fetchStudentData(studentId, userFromStorage.studio_id || userFromStorage.studioId);
        
        const channel = supabase
          .channel('student-dashboard-realtime')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'student_lesson_credits',
            filter: `student_id=eq.${studentId}` 
          }, (payload) => {
            console.log('🔔 Créditos alterados:', payload);
            fetchStudentData(studentId, userFromStorage.studio_id || userFromStorage.studioId);
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'attendance',
            filter: `student_id=eq.${studentId}` 
          }, (payload) => {
            console.log('🔔 Presença alterada:', payload);
            fetchStudentData(studentId, userFromStorage.studio_id || userFromStorage.studioId);
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'enrollments',
            filter: `student_id=eq.${studentId}` 
          }, (payload) => {
            console.log('🔔 Matrícula alterada:', payload);
            fetchStudentData(studentId, userFromStorage.studio_id || userFromStorage.studioId);
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'student_credit_transactions',
            filter: `student_id=eq.${studentId}` 
          }, () => fetchStudentData(studentId, userFromStorage.studio_id || userFromStorage.studioId))
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${studentId}` 
          }, () => fetchStudentData(studentId, userFromStorage.studio_id || userFromStorage.studioId))
          .subscribe((status) => {
            console.log('📡 Status do Realtime:', status);
          })

        return () => {
          supabase.removeChannel(channel)
        }
    }
    
    loadSession()
  }, [])

  const fetchStudentData = async (studentId: string, studioId: string) => {
    try {
      if (!studioId) {
        setIsLoading(false);
        return;
      }
      console.log('🔄 Buscando dados atualizados para o aluno:', studentId);
      
      // 1. Fetch next class (Only ACTIVE ones)
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          class_id,
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
        .order('created_at', { ascending: false });

      if (enrollments && enrollments.length > 0) {
        setNextClass(enrollments[0].classes);
        
        // Fetch ALL attendance records for today for this student
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: attRecords } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentId)
          .eq('date', todayStr);
        
        // Find attendance for the current "next class"
        const currentAtt = attRecords?.find(a => a.class_id === enrollments[0].class_id);
        console.log('✅ Registro de presença encontrado:', currentAtt);
        setAttendanceRecord(currentAtt || null);

        // Fetch session status for today
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('status')
          .eq('class_id', enrollments[0].class_id)
          .eq('scheduled_date', todayStr)
          .maybeSingle();
        
        if (sessionData?.status === 'cancelled') {
          setNextClass((prev: any) => ({ ...prev, isCancelledToday: true }));
        }
      } else {
        setNextClass(null);
        setAttendanceRecord(null);
      }

      // 4. Fetch Credit Balance (Ensure we get the LATEST)
      const { data: credits, error: creditError } = await supabase
        .from('student_lesson_credits')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (creditError) console.error('Erro ao buscar créditos:', creditError);
      console.log('💰 Saldo de créditos atualizado:', credits?.remaining_credits);
      setStudentCredits(credits);

      // 4.1 Fetch Available Credit Packages
      const { data: pkgs } = await supabase
        .from('lesson_packages')
        .select('*')
        .eq('studio_id', studioId)
        .eq('is_active', true)
        .order('lessons_count', { ascending: true })
      
      setCreditPackages(pkgs || [])

      // 5. Fetch Studio Classes for Today/Tomorrow
      const todayIdx = new Date().getDay()
      const tomorrowIdx = (todayIdx + 1) % 7
      
      const { data: allStudioClasses } = await supabase
        .from('classes')
        .select('*, teachers(name)')
        .eq('studio_id', studioId)
        .eq('status', 'active')

      const filtered = (allStudioClasses || []).filter(c => {
        if (!c.schedule || !Array.isArray(c.schedule)) return false
        // Excluir se estiver cancelada hoje
        if (c.id === nextClass?.id && nextClass?.isCancelledToday) return false
        return c.schedule.some((s: any) => 
          s.day_of_week === todayIdx || s.day_of_week === tomorrowIdx
        )
      }).map(c => {
        const sched = c.schedule.find((s: any) => s.day_of_week === todayIdx || s.day_of_week === tomorrowIdx)
        return {
          ...c,
          display_day: sched.day_of_week === todayIdx ? 'Hoje' : 'Amanhã',
          display_time: sched.start_time
        }
      })
      
      setAvailableToday(filtered)

      // 6. Fetch Credit Transactions
      const { data: txs } = await supabase
        .from('student_credit_transactions')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      setCreditTransactions(txs || [])
    } catch (error: any) {
      console.error("Error fetching student data:", error)
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

  if (!student?.studio_id) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Bem-vindo ao Workflow AI!</h1>
        <p className="text-slate-500 max-w-xs mb-8 text-sm">
          Você ainda não está vinculado a nenhum estúdio de dança. <br/><br/>
          Peça o <b>link de convite</b> para seu professor para começar a agendar suas aulas!
        </p>
        <Button 
          variant="outline" 
          className="w-full max-w-[200px]"
          onClick={() => {
            localStorage.removeItem("danceflow_user")
            supabase.auth.signOut().then(() => router.push("/login"))
          }}
        >
          Sair da Conta
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <StudentHeader student={student} />
      
      <main className="container p-4 space-y-6 max-w-md mx-auto">
        {/* Saldo de Créditos Flex */}
        <Card className="border-none shadow-sm bg-indigo-50 dark:bg-indigo-950/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-600/70 dark:text-indigo-400 tracking-widest">Saldo de {vocabulary.service}s</p>
                <p className="text-xl font-black text-indigo-900 dark:text-indigo-100">
                  {studentCredits?.remaining_credits || 0} Créditos
                </p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              {studentCredits ? (
                <>
                  <p className="text-[10px] text-muted-foreground uppercase">Expira em</p>
                  <p className="text-xs font-bold text-rose-500">{new Date(studentCredits.expiry_date).toLocaleDateString('pt-BR')}</p>
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground uppercase">Sem créditos ativos</p>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-[10px] font-bold border-indigo-200 text-indigo-600 bg-white hover:bg-indigo-50"
                onClick={() => setIsBuyCreditsOpen(true)}
              >
                + COMPRAR
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerta de Pagamento */}
        {pendingPayment && (
          <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30 animate-pulse-subtle">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Mensalidade Pendente</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Vencimento: {new Date(pendingPayment.due_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => window.location.href='/student/payments'}>
                Pagar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Próxima Aula */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Minha Reserva
          </h2>
          
          {nextClass ? (
            <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
              <CardContent className="p-0">
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      {nextClass.isCancelledToday ? (
                        <Badge className="bg-rose-500 text-white border-none mb-2 animate-pulse uppercase">CANCELADA HOJE</Badge>
                      ) : (
                        <div className="flex gap-2 mb-2">
                          <Badge className="bg-white/20 text-white border-none uppercase">RESERVADO</Badge>
                          <Badge variant="outline" className="text-white border-white/30 uppercase text-[10px]">
                            {nextClass.level === 'beginner' ? 'Beginner' : nextClass.level === 'intermediate' ? 'Medium' : 'Pro'}
                          </Badge>
                        </div>
                      )}
                      <h3 className="text-xl font-bold">{nextClass.name}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <Clock className="w-4 h-4" />
                    <span>{nextClass.dance_style}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      {nextClass.teachers?.name?.[0] || 'P'}
                    </div>
                    <span className="text-sm font-medium">{nextClass.teachers?.name || vocabulary.provider}</span>
                  </div>
                </div>
                
                <div className="bg-black/10 p-3 flex justify-between items-center px-5">
                  <span className="text-[10px] font-medium opacity-70 uppercase">
                    {attendanceRecord?.status === 'present' ? 'PRESENÇA VALIDADA ✅' : (studentCredits?.remaining_credits > 0 ? 'DESCONTO NO CHECK-IN' : 'CRÉDITOS INSUFICIENTES ⚠️')}
                  </span>
                  {attendanceRecord?.status === 'present' ? (
                    <Badge className="bg-emerald-500 text-white border-none">VALIDADO</Badge>
                  ) : (
                    studentCredits?.remaining_credits > 0 ? (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-white text-indigo-600 hover:bg-white/90 gap-1 text-xs font-bold"
                        onClick={() => handleConfirmAttendance()}
                      >
                        <QrCodeIcon className="w-3 h-3" /> Ver QR Check-in
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="bg-rose-500 hover:bg-rose-600 text-white gap-1 text-xs font-bold animate-pulse"
                        onClick={() => setIsBuyCreditsOpen(true)}
                      >
                        <CreditCard className="w-3 h-3" /> Comprar Créditos
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
             <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center py-8">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Você não tem reserva para hoje.</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Escolha uma {vocabulary.service.toLowerCase()} abaixo para reservar</p>
             </div>
          )}
        </section>

        {/* Escolha sua Aula (Flex Pass) */}
        {studentCredits && studentCredits.remaining_credits > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-indigo-600" />
              Reservar {vocabulary.service}
            </h2>

            <div className="space-y-3">
              {availableToday.length > 0 ? availableToday.slice(0, 5).map((cls) => (
                <Card key={cls.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-bold text-indigo-600 border border-indigo-50">
                        {cls.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold leading-tight">{cls.name}</p>
                          <Badge variant="secondary" className="text-[8px] h-4 px-1 uppercase">
                            {cls.level === 'beginner' ? 'Beginner' : cls.level === 'intermediate' ? 'Medium' : 'Pro'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase">{cls.display_day} às {cls.display_time}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 border border-indigo-100"
                      onClick={() => handleConfirmAttendance(cls)}
                    >
                      Reservar
                    </Button>
                  </CardContent>
                </Card>
              )              ) : (
                <p className="text-xs text-center text-muted-foreground italic py-4">Nenhuma {vocabulary.service.toLowerCase()} disponível hoje.</p>
              )}
              
              <Button 
                variant="ghost" 
                className="w-full text-indigo-600 text-xs font-bold"
                onClick={() => window.location.href='/student/classes/catalogo'}
              >
                Ver Catálogo Completo
              </Button>
            </div>
          </section>
        )}

        {/* Tab Bar Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t flex items-center justify-around h-16 px-4 z-50">
          <Button variant="ghost" className="flex flex-col gap-1 text-primary" onClick={() => window.location.href='/student'}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Início</span>
          </Button>
          <Button variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/classes'}>
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">{vocabulary.service}s</span>
          </Button>
          <Button variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => setIsStatementOpen(true)}>
            <History className="w-5 h-5" />
            <span className="text-[10px]">Extrato</span>
          </Button>
          <Button variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/payments'}>
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px]">Pagar</span>
          </Button>
          <Button variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/profile'}>
            <User className="w-5 h-5" />
            <span className="text-[10px]">Perfil</span>
          </Button>
        </nav>

        {/* Dialogs */}
        <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
          <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl border-none max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Extrato de Créditos
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {creditTransactions.length > 0 ? creditTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {tx.amount > 0 ? <Plus className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </div>
                </div>
              )) : (
                <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma movimentação.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isClassQrOpen} onOpenChange={setIsClassQrOpen}>
          <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl border-none">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-black">QR Code da {vocabulary.service}</DialogTitle>
              <DialogDescription className="text-center">Apresente este código para descontar seu crédito na entrada.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6 gap-6">
              <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-indigo-50">
                {activeAttendanceId || attendanceRecord?.id ? (
                  <div className="flex flex-col items-center gap-4">
                    {/* Tanto o QR Code quanto a Chave utilizam a mesma lógica: DF- + últimos 8 caracteres do ID */}
                    <QRCode
                      value={`DF-${(activeAttendanceId || attendanceRecord?.id)?.toString().slice(-8).toUpperCase()}`}
                      size={220}
                      level="H"
                      viewBox={`0 0 256 256`}
                    />
                    <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 w-full text-center">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-wider">Chave de Acesso</p>
                      <p className="font-mono text-lg font-black text-indigo-600 tracking-widest">
                        DF-{(activeAttendanceId || attendanceRecord?.id)?.toString().slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">Gerando Código Seguro...</p>
                  </div>
                )}
              </div>
              <p className="font-bold text-lg text-indigo-900">{nextClass?.name}</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isBuyCreditsOpen} onOpenChange={setIsBuyCreditsOpen}>
          <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl border-none">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-black">Comprar Créditos</DialogTitle>
              <DialogDescription className="text-center">Escolha o melhor pacote para suas {vocabulary.service.toLowerCase()}s.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 py-4">
              {creditPackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  onClick={() => !isBuying && handleBuyCredits(pkg)} 
                  className={`bg-card text-card-foreground flex flex-col gap-2 rounded-xl p-5 shadow-sm border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group relative ${isBuying ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                        {pkg.lessons_count}
                      </div>
                      <div className="text-left">
                        <p className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground font-medium uppercase">{pkg.lessons_count} {vocabulary.service.toLowerCase()}s mensais</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-indigo-600 text-lg">R$ {Number(pkg.price).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">~ R$ {(Number(pkg.price) / pkg.lessons_count).toFixed(2)}/{vocabulary.service.toLowerCase()}</p>
                    </div>
                  </div>
                  {isBuying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/10 rounded-xl backdrop-blur-[1px]">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
