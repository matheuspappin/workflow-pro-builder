"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
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
  FileText,
  QrCode as QrCodeIcon,
  Shield,
  Truck,
  Check
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
import { useOrganization } from "@/components/providers/organization-provider"
import { AppointmentScheduler } from "@/components/student/appointment-scheduler"

export default function StudentDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { vocabulary, t, language } = useVocabulary()
  const { businessModel, niche } = useOrganization()
  
  // Nichos que usam Ordens de Serviço (OS)
  const isServiceOrderBased = ['auto_detail', 'mechanic', 'tech_repair', 'plumbing', 'electrician', 
    'construction', 'landscaping', 'tailoring', 'cleaning', 'car_wash', 
    'party_venue', 'logistics', 'dentist', 'clinic', 'beauty', 'aesthetics', 
    'spa', 'physio', 'nutrition', 'podiatry', 'tanning', 'vet', 'clinic_vet', 
    'psychology', 'law', 'consulting', 'marketing_agency', 'dev_studio', 
    'interior_design', 'real_estate', 'insurance', 'travel_agency', 'coworking', 
    'tattoo', 'photographer', 'event_planning'].includes(niche)

  // Nichos que NÃO são baseados em turmas fixas (ex: Pet Shop, Barbearia, Clínica)
  const isAppointmentBased = !['dance', 'gym', 'pilates', 'yoga', 'crossfit', 'swim_school', 'personal', 
    'beach_tennis', 'music_school', 'language_school', 'art_studio', 
    'cooking_school', 'photography', 'tutoring', 'driving_school', 
    'sports_center', 'martial_arts'].includes(niche)

  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nextClass, setNextClass] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [isClientIDOpen, setIsClientIDOpen] = useState(false)
  const [isPayingOnline, setIsPayingOnline] = useState(false)
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null)
  const [pendingPayment, setPendingPayment] = useState<any>(null)
  const [studentCredits, setStudentCredits] = useState<any>(null)
  const [totalPendingAmount, setTotalPendingAmount] = useState(0)
  const [creditPackages, setCreditPackages] = useState<any[]>([])
  const [availableToday, setAvailableToday] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [isClassQrOpen, setIsClassQrOpen] = useState(false)
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false)
  const [isStatementOpen, setIsStatementOpen] = useState(false)
  const [isBuying, setIsBuyIng] = useState(false)
  const [creditTransactions, setCreditTransactions] = useState<any[]>([])

  const handlePayOS = async (order: any) => {
    try {
      setIsPayingOnline(true)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: order.id,
          amount: Number(order.total_amount || order.amount),
          description: `Pagamento OS #${order.tracking_code || order.id?.substring(0, 8) || ''}`,
          studentId: student?.id,
          studioId: student?.studio_id || student?.studioId,
          type: 'service_order'
        })
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error || 'Erro ao criar sessão de pagamento')
    } catch (e: any) {
      toast({ title: 'Erro no pagamento', description: e.message, variant: 'destructive' })
    } finally {
      setIsPayingOnline(false)
    }
  }

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

  const handleRequestReload = async () => {
    setIsLoading(true);
    try {
        const selectedItems = assets.filter(a => selectedAssets.includes(a.id));
        if (selectedItems.length === 0) return;

        const description = `Recarga de ${selectedItems.length} extintores: ${selectedItems.map((a: any) => a.name).join(', ')}`;
        
        const { error } = await supabase
            .from('service_orders')
            .insert({
                studio_id: student.studio_id || student.studioId,
                customer_id: student.id,
                description: description,
                status: 'open',
                priority: 'high', // Recarga é urgente geralmente
                type: 'maintenance'
            });
        
        if (error) throw error;
        
        toast({ title: 'Pedido Enviado! 🚚', description: 'Nossa equipe agendará a coleta.' });
        setIsRequestReloadOpen(false);
        setSelectedAssets([]);
        // Refresh OS list
        fetchStudentData(student.id, student.studio_id || student.studioId);

    } catch (e: any) {
        toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }

  const [activeAttendanceId, setActiveAttendanceId] = useState<string | null>(null)
  
  // Fire Protection States
  const [assets, setAssets] = useState<any[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isRequestReloadOpen, setIsRequestReloadOpen] = useState(false)

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
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function loadSession() {
      // CORRIGIDO: getUser() valida o JWT; getSession() não valida
      const { data: { user: authUser } } = await supabase.auth.getUser()

      const userData = localStorage.getItem("danceflow_user")
      let userFromStorage: any = null
      if (userData) {
        try {
          userFromStorage = JSON.parse(userData)
        } catch (e) {
          console.error("Erro ao parsear dados do usuário do localStorage:", e)
          localStorage.removeItem("danceflow_user")
        }
      }

      if (!authUser || !userFromStorage) {
        router.push("/login")
        setIsLoading(false)
        return
      }

      const studentId = authUser.id
      const studioId = userFromStorage.studio_id || userFromStorage.studioId || authUser.user_metadata?.studio_id
      setStudent({ ...userFromStorage, id: studentId })
      fetchStudentData(studentId, studioId)

      // CORRIGIDO: channel atribuído à variável externa — cleanup retornado pelo useEffect
      channel = supabase
        .channel(`student-dashboard-${studentId}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'student_lesson_credits',
          filter: `student_id=eq.${studentId}`,
        }, () => fetchStudentData(studentId, studioId))
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'attendance',
          filter: `student_id=eq.${studentId}`,
        }, () => fetchStudentData(studentId, studioId))
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'enrollments',
          filter: `student_id=eq.${studentId}`,
        }, () => fetchStudentData(studentId, studioId))
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'student_credit_transactions',
          filter: `student_id=eq.${studentId}`,
        }, () => fetchStudentData(studentId, studioId))
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${studentId}`,
        }, () => fetchStudentData(studentId, studioId))
        .subscribe()
    }

    loadSession()

    // CORRIGIDO: cleanup retornado diretamente pelo useEffect — não de dentro da async function
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
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

      // 6.1 If Monetary, fetch pending payments total
      if (businessModel === 'MONETARY') {
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, service_order_id, status, due_date, description, reference_month')
          .eq('student_id', studentId)
        
        const pendingPayments = payments?.filter(p => p.status === 'pending') || []
        const total = pendingPayments.reduce((acc, p) => acc + Number(p.amount), 0) || 0
        setTotalPendingAmount(total)
        
        // Se houver pagamentos pendentes, pega o mais próximo
        const latestPending = [...pendingPayments].sort((a, b) => 
          new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime()
        )[0]
        
        setPendingPayment(latestPending || null)
      }

      // 6.2 Fetch Assets for Fire Protection
      if (niche === 'fire_protection') {
        const { data: assetsData } = await supabase
          .from('assets')
          .select('*')
          .eq('student_id', studentId)
          .order('expiration_date', { ascending: true }); // Vencidos primeiro
        
        // Calculate status dynamically
        const processedAssets = (assetsData || []).map((asset: any) => {
            const now = new Date();
            const expiration = asset.expiration_date ? new Date(asset.expiration_date) : new Date(8640000000000000);
            const warningDate = new Date();
            warningDate.setDate(warningDate.getDate() + 30);
            
            let status = 'ok';
            if (asset.expiration_date && expiration < now) status = 'expired';
            else if (asset.expiration_date && expiration < warningDate) status = 'warning';
            
            return { ...asset, status };
        });

        setAssets(processedAssets);
      }

      // 7. Fetch Recent Service Orders if applicable
      if (isServiceOrderBased) {
        const { data: osData } = await supabase
          .from('service_orders')
          .select('*, teachers(name)')
          .eq('customer_id', studentId)
          .order('created_at', { ascending: false })
          .limit(3)
        
        setRecentOrders(osData || [])
      }
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
          Você ainda não está vinculado a nenhum {vocabulary.establishment.toLowerCase()}. <br/><br/>
          Peça o <b>link de convite</b> para seu profissional para começar a acompanhar seus serviços!
        </p>
        <Button 
          variant="outline" 
          className="w-full max-w-[200px]"
          onClick={async () => {
            await supabase.auth.signOut()
            try {
              await fetch('/api/auth/logout', { method: 'POST' })
            } catch (e) {}
            localStorage.removeItem("danceflow_user")
            window.location.href = "/login"
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
        {/* Dashboard de Ativos (Extintores) - Nicho Fire Protection */}
        {niche === 'fire_protection' && assets.length > 0 && (
          <section className="space-y-4">
             <div className="grid grid-cols-2 gap-3 mb-2">
                <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{assets.filter(a => a.status === 'ok').length}</p>
                        <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-500 tracking-widest">Em Dia</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800">
                    <CardContent className="p-4 text-center relative">
                        {assets.filter(a => a.status === 'expired' || a.status === 'warning').length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                        <p className="text-3xl font-black text-rose-700 dark:text-rose-400">{assets.filter(a => a.status === 'expired' || a.status === 'warning').length}</p>
                        <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-500 tracking-widest">Atenção/Vencidos</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Meus Extintores
              </h2>
              <Button type="button" size="sm" variant="outline" className="text-xs h-8 gap-2 bg-white" onClick={() => setIsRequestReloadOpen(true)}>
                <Truck className="w-3 h-3 text-indigo-600" /> Solicitar Recarga
              </Button>
            </div>

            <div className="space-y-3">
              {assets.slice(0, 3).map((asset) => (
                <Card key={asset.id} className={`border-l-4 shadow-sm ${
                    asset.status === 'expired' ? 'border-l-rose-500' : 
                    asset.status === 'warning' ? 'border-l-amber-500' : 
                    'border-l-emerald-500'
                }`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold leading-tight">{asset.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase mt-1">{asset.type} • Selo: {asset.serial_number}</p>
                      <p className={`text-[10px] font-bold mt-1 ${
                        asset.status === 'expired' ? 'text-rose-600' : 
                        asset.status === 'warning' ? 'text-amber-600' : 
                        'text-emerald-600'
                      }`}>
                        Vence: {new Date(asset.expiration_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {assets.length > 3 && (
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground">Ver todos ({assets.length})</Button>
              )}
            </div>
          </section>
        )}

        {/* Ordens de Serviço Recentes (Para modelos de crédito) */}
        {businessModel === 'CREDIT' && isServiceOrderBased && recentOrders.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Minhas Ordens
              </h2>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-indigo-600 font-bold" onClick={() => router.push('/student/os')}>
                Ver Todas
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => router.push(`/student/os/${order.id}`)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        #{order.tracking_code || order.id.substring(0, 4)}
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight">{order.description || 'Ordem de Serviço'}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')} • {
                            order.status === 'open' ? 'Aberta' : 
                            order.status === 'in_progress' ? 'Em Andamento' : 
                            order.status === 'finished' ? 'Finalizada' : 'Cancelada'
                          }
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Agendador Pontual para Nichos de Serviço */}
        {isAppointmentBased && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Agendar Horário
            </h2>
            <AppointmentScheduler student={student} vocabulary={vocabulary} />
          </section>
        )}

        {/* Saldo / Financeiro Flex */}
        <Card className={`border-none shadow-sm ${businessModel === 'MONETARY' ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-indigo-50 dark:bg-indigo-950/40'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg dark:shadow-none ${businessModel === 'MONETARY' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
                {businessModel === 'MONETARY' ? <User className="w-6 h-6 text-white" /> : <PlayCircle className="w-6 h-6 text-white" />}
              </div>
              <div>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${businessModel === 'MONETARY' ? 'text-emerald-600/70 dark:text-emerald-400' : 'text-indigo-600/70 dark:text-indigo-400'}`}>
                  {businessModel === 'MONETARY' ? 'Meu Cartão de Acesso' : `Saldo de ${vocabulary.service}s`}
                </p>
                <p className={`text-xl font-black ${businessModel === 'MONETARY' ? 'text-emerald-900 dark:text-emerald-100' : 'text-indigo-900 dark:text-indigo-100'}`}>
                  {businessModel === 'MONETARY' 
                    ? `ID: #${student.id.substring(0, 6).toUpperCase()}`
                    : `${studentCredits?.remaining_credits || 0} Créditos`
                  }
                </p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              {businessModel === 'MONETARY' ? (
                <Button 
                  size="sm" 
                  className="h-8 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-200"
                  onClick={() => setIsClientIDOpen(true)}
                >
                  <QrCodeIcon className="w-3.5 h-3.5" /> ABRIR QR
                </Button>
              ) : (
                <>
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
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status das Ordens de Serviço (Somente para Monetário) */}
        {businessModel === 'MONETARY' && recentOrders.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Acompanhamento de {vocabulary.service}s
            </h2>
            
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const statusStep = order.status === 'open' ? 1 : order.status === 'in_progress' ? 2 : order.status === 'finished' ? 3 : 0;
                const isPaid = order.payment_status === 'paid';

                return (
                  <Card key={order.id} className={`border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 border-l-4 ${order.status === 'finished' ? 'border-emerald-500' : 'border-slate-300'}`} onClick={() => router.push(`/student/os/${order.id}`)}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`text-[10px] font-black uppercase ${order.status === 'finished' ? 'text-emerald-600' : 'text-slate-500'}`}>OS #{order.tracking_code || order.id.substring(0, 8)}</p>
                          <h3 className="text-sm font-bold">{order.description || 'Serviço em andamento'}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`${
                            order.status === 'open' ? 'bg-blue-100 text-blue-600' : 
                            order.status === 'in_progress' ? 'bg-amber-100 text-amber-600' : 
                            order.status === 'finished' ? 'bg-emerald-100 text-emerald-600' : 
                            'bg-slate-100 text-slate-600'
                          } border-none text-[10px] uppercase`}>
                            {order.status === 'open' ? 'Aguardando' : 
                             order.status === 'in_progress' ? 'Em Execução' : 
                             order.status === 'finished' ? 'Finalizado' : 'Cancelado'}
                          </Badge>
                          {isPaid ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[8px] uppercase font-bold">PAGO ✅</Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[8px] uppercase font-bold">PAGAMENTO PENDENTE ⚠️</Badge>
                          )}
                        </div>
                      </div>

                      {/* Barra de Progresso Visual */}
                      <div className="flex items-center gap-2 py-2">
                        <div className={`h-1.5 flex-1 rounded-full ${statusStep >= 1 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${statusStep >= 2 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${statusStep >= 3 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                      </div>

                      {order.status === 'finished' && !isPaid && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                          <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 leading-tight mb-3">
                            Este serviço foi concluído! Efetue o pagamento para liberar a retirada.
                          </p>
                          <Button 
                            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayOS(order);
                            }}
                            disabled={isPayingOnline}
                          >
                            {isPayingOnline ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                            PAGAR E LIBERAR AGORA
                          </Button>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Atualizado em {new Date(order.updated_at || order.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {order.status === 'finished' && isPaid && (
                          <div className="flex items-center gap-2 text-emerald-600">
                             <span className="text-[10px] font-black animate-pulse uppercase tracking-widest">PRONTO PARA RETIRADA 🚀</span>
                             <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 rounded-full bg-emerald-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsClientIDOpen(true);
                              }}
                             >
                               <QrCodeIcon className="w-4 h-4" />
                             </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Alerta de Vencimento de Extintores (Nicho Fire Protection) */}
        {niche === 'fire_protection' && assets.some(a => a.status !== 'ok') && (
          <Card className="bg-rose-50 border-rose-200 dark:bg-rose-950/10 dark:border-rose-900/30 animate-pulse-subtle">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">Atenção: Extintores Vencidos ou Próximos!</p>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  Você tem {assets.filter(a => a.status === 'expired').length} extintor(es) vencido(s) e {assets.filter(a => a.status === 'warning').length} próximo(s) do vencimento.
                </p>
              </div>
              <Button type="button" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => setIsRequestReloadOpen(true)}>
                Solicitar Recarga
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Alerta de Pagamento (Genérico, se não houver alerta de extintor) */}
        {pendingPayment && !(niche === 'fire_protection' && assets.some(a => a.status !== 'ok')) && (
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
              <Button type="button" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => window.location.href='/student/payments'}>
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
                    {attendanceRecord?.status === 'present' ? 'VALIDADO ✅' : (businessModel === 'MONETARY' ? 'AGUARDANDO ATENDIMENTO' : (studentCredits?.remaining_credits > 0 ? 'DESCONTO NO CHECK-IN' : 'CRÉDITOS INSUFICIENTES ⚠️'))}
                  </span>
                  {attendanceRecord?.status === 'present' ? (
                    <Badge className="bg-emerald-500 text-white border-none">VALIDADO</Badge>
                  ) : (
                    businessModel === 'MONETARY' ? (
                      <Badge variant="outline" className="text-white border-white/30 uppercase text-[10px]">AGENDADO</Badge>
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
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
             <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center py-8">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Você não tem reserva para hoje.</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Escolha um {vocabulary.service.toLowerCase()} abaixo para reservar</p>
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
          <Button type="button" variant="ghost" className="flex flex-col gap-1 text-primary" onClick={() => window.location.href='/student'}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Início</span>
          </Button>
          
          {isServiceOrderBased && niche !== 'fire_protection' ? (
            <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/os'}>
              <FileText className="w-5 h-5" />
              <span className="text-[10px]">Minhas OS</span>
            </Button>
          ) : niche === 'fire_protection' ? (
            <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/os'}>
              <Shield className="w-5 h-5" />
              <span className="text-[10px]">Meus Extintores</span>
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/classes'}>
              <Calendar className="w-5 h-5" />
              <span className="text-[10px]">{vocabulary.service}s</span>
            </Button>
          )}

          <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => businessModel === 'MONETARY' ? window.location.href='/student/payments' : setIsStatementOpen(true)}>
            <History className="w-5 h-5" />
            <span className="text-[10px]">{businessModel === 'MONETARY' ? 'Financeiro' : 'Extrato'}</span>
          </Button>
          <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/payments'}>
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px]">Pagar</span>
          </Button>
          <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/profile'}>
            <User className="w-5 h-5" />
            <span className="text-[10px]">Perfil</span>
          </Button>
        </nav>

        {/* Dialogs */}
        <Dialog open={isRequestReloadOpen} onOpenChange={setIsRequestReloadOpen}>
          <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl border-none max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Solicitar Recarga</DialogTitle>
              <DialogDescription>Selecione os equipamentos para coleta.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
                {assets.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">Nenhum equipamento cadastrado.</p>
                )}
                {assets.map((asset: any) => (
                    <div key={asset.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAssets.includes(asset.id) ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200'
                        }`}
                        onClick={() => {
                            if (selectedAssets.includes(asset.id)) {
                                setSelectedAssets(prev => prev.filter(id => id !== asset.id));
                            } else {
                                setSelectedAssets(prev => [...prev, asset.id]);
                            }
                        }}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${selectedAssets.includes(asset.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                            {selectedAssets.includes(asset.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">{asset.name}</p>
                            <p className="text-[10px] text-muted-foreground">Vence: {new Date(asset.expiration_date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] uppercase border bg-opacity-50 ${
                            asset.status === 'expired' ? 'text-rose-600 border-rose-200 bg-rose-50' : 
                            asset.status === 'warning' ? 'text-amber-600 border-amber-200 bg-amber-50' : 
                            'text-emerald-600 border-emerald-200 bg-emerald-50'
                        }`}>
                            {asset.status === 'expired' ? 'Vencido' : asset.status === 'warning' ? 'Vence logo' : 'Ok'}
                        </Badge>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-2">
                <Button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12" onClick={handleRequestReload} disabled={selectedAssets.length === 0 || isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                    SOLICITAR COLETA ({selectedAssets.length})
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsRequestReloadOpen(false)}>Cancelar</Button>
            </div>
          </DialogContent>
        </Dialog>

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
                        <p className="text-xs text-muted-foreground font-medium uppercase">{pkg.lessons_count} {vocabulary.service.toLowerCase()}s</p>
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

        <Dialog open={isClientIDOpen} onOpenChange={setIsClientIDOpen}>
          <DialogContent className="sm:max-w-md max-w-[90vw] rounded-3xl border-none p-0 overflow-hidden">
          <div className="bg-emerald-600 p-8 text-center text-white space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Cartão Digital</h2>
            <p className="text-emerald-100 text-sm font-medium opacity-90">Apresente este código para liberar seu serviço ou retirar produtos.</p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-10 gap-8 bg-white dark:bg-slate-950">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-8 border-emerald-50">
              <QRCode
                value={`SECURE-CLI-${student?.id?.toString().slice(-12).toUpperCase()}-${new Date().toISOString().slice(0,10)}`}
                size={240}
                level="H"
                viewBox={`0 0 256 256`}
              />
            </div>

            <div className="space-y-4 w-full px-10">
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 w-full text-center">
                <p className="text-[11px] text-muted-foreground font-black uppercase mb-1 tracking-widest">TOKEN DE SEGURANÇA DIÁRIO</p>
                <p className="font-mono text-2xl font-black text-emerald-600 tracking-[0.2em]">
                  CLI-{student?.id?.toString().slice(-8).toUpperCase()}
                </p>
              </div>
              
              <div className="flex items-center gap-3 justify-center text-slate-400">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest italic">Válido apenas para hoje • akaaicore Guard</span>
              </div>
            </div>
          </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t">
              <Button type="button" variant="ghost" className="w-full font-bold text-slate-500 h-12 rounded-xl" onClick={() => setIsClientIDOpen(false)}>
                FECHAR CARTÃO
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
