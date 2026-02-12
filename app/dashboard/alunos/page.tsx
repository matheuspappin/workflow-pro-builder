"use client"

import { useState, useEffect, Suspense } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  Users,
  User,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import StudentProfile from "@/components/StudentProfile"
import { useSearchParams } from "next/navigation"
import LoadingComponent from "./loading"
import { getStudents, saveStudent, getClasses, deleteStudent } from "@/lib/database-utils"
import { isLimitReached, PLAN_LIMITS } from "@/lib/plan-limits"
import { supabase } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { DynamicMetadataForm } from "@/components/niche/dynamic-metadata-form"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { ModuleGuard } from "@/components/providers/module-guard"

interface Student {
  id: number
  uuid?: string // UUID do Supabase para operações
  name: string
  email: string
  phone: string
  modality: string
  status: "ativo" | "inativo" | "risco"
  enrollmentDate: string
  lastClass: string
  monthlyFee: number
  paymentStatus: "pago" | "pendente" | "atrasado"
  studio_id?: string // Adicionar para garantir consistência
  credits?: number
  expiryDate?: string
  metadata?: any
}

const initialStudents: Student[] = []

const modalities = ["Ballet", "Jazz", "Hip Hop", "Contemporaneo", "Salsa"]

function StudentsContent() {
  const { toast } = useToast()
  const { schemas, vocabulary } = useVocabulary()
  const searchParams = useSearchParams()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [modalityFilter, setModalityFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    monthlyFee: "",
    metadata: {}
  })
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [studentCredits, setStudentCredits] = useState<{remaining: number, id?: string} | null>(null)
  const [adjustAmount, setAdjustAmount] = useState<number>(0)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [agendaModalOpen, setAgendaModalOpen] = useState(false)
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [studioPlan, setStudioPlan] = useState("gratuito")
  const [dbModalities, setDbModalities] = useState<any[]>([])

  // Carregar alunos e turmas
  useEffect(() => {
    if (!dataLoaded) {
      loadStudents()
      loadClasses()
      loadStudioPlan()
      loadModalities()
    }
  }, [dataLoaded])

  const loadModalities = async () => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const { data, error } = await supabase
        .from('modalities')
        .select('*')
        .eq('studio_id', studioId)
        .order('name')

      if (!error && data) {
        setDbModalities(data)
      }
    } catch (e) {
      console.error('Erro ao carregar modalidades:', e)
    }
  }

  const loadStudioPlan = async () => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const { data, error } = await supabase
        .from('studios')
        .select('plan')
        .eq('id', studioId)
        .single()

      if (!error && data) {
        setStudioPlan(data.plan || "gratuito")
      }
    } catch (e) {
      console.error('Erro ao carregar plano:', e)
    }
  }

  const loadClasses = async () => {
    try {
      const classes = await getClasses()
      setAvailableClasses(classes)
    } catch (error) {
      console.error('Erro ao carregar turmas:', error)
    }
  }

  const loadStudents = async (forceReload = false) => {
    try {
      // Verificar se já temos dados em cache e não foi forçado recarregar
      const cacheKey = 'danceflow_students_cache'
      const cachedData = localStorage.getItem(cacheKey)

      if (cachedData && !forceReload) {
        const { data, timestamp } = JSON.parse(cachedData)
        const cacheAge = Date.now() - timestamp

        // Cache válido por 5 minutos
        if (cacheAge < 5 * 60 * 1000) {
          console.log('📦 Usando dados em cache dos alunos')
          setStudents(data)
          setDataLoaded(true)
          setLoading(false)
          return
        }
      }

      setLoading(true)
      const result = await getStudents({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      })

      console.log('👥 Alunos brutos carregados:', result.data.length)
      if (result.data.length > 0) {
        console.log('📝 Exemplo de aluno com join:', {
          name: result.data[0].name,
          credits_raw: result.data[0].student_lesson_credits
        })
      }

      // Mapear dados do Supabase para o formato da interface
      const mappedStudents: Student[] = result.data.map((student, index) => {
        // Obter créditos de forma robusta (Supabase pode retornar objeto único ou array)
        let creditValue = 0
        let expiryValue = undefined
        if (student.student_lesson_credits) {
          if (Array.isArray(student.student_lesson_credits)) {
            creditValue = student.student_lesson_credits[0]?.remaining_credits ?? 0
            expiryValue = student.student_lesson_credits[0]?.expiry_date
          } else {
            creditValue = (student.student_lesson_credits as any).remaining_credits ?? 0
            expiryValue = (student.student_lesson_credits as any).expiry_date
          }
        }

        return {
          id: index + 1,
          uuid: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone || "",
          modality: student.modality || "Geral",
          status: student.status === 'active' ? 'ativo' : student.status === 'inactive' ? 'inativo' : 'risco',
          enrollmentDate: student.enrollment_date,
          lastClass: student.last_attendance_date ? new Date(student.last_attendance_date).toLocaleDateString('pt-BR') : 'N/A',
          monthlyFee: student.monthly_fee || 0,
          paymentStatus: 'pago',
          studio_id: student.studio_id,
          credits: creditValue,
          expiryDate: expiryValue,
          metadata: student.metadata || {}
        }
      })

      setStudents(mappedStudents)
      setDataLoaded(true)

      // Salvar no cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data: mappedStudents,
        timestamp: Date.now()
      }))

      console.log('💾 Dados dos alunos salvos no cache')

    } catch (error) {
      console.error('Erro ao carregar alunos:', error?.message || error)
      toast({
        title: "Erro",
        description: `Não foi possível carregar a lista de ${vocabulary.clients.toLowerCase()}.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "ativo" && (student.credits ?? 0) > 0) ||
      (statusFilter === "baixo" && (student.credits ?? 0) > 0 && (student.credits ?? 0) <= 2) ||
      (statusFilter === "inativo" && (student.credits ?? 0) === 0)
    const matchesModality = modalityFilter === "all" || student.modality === modalityFilter
    return matchesSearch && matchesStatus && matchesModality
  })

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.phone) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Verificar limite do plano
    if (isLimitReached(students.length, studioPlan, 'maxStudents')) {
      toast({
        title: "Limite de Plano Atingido",
        description: `Seu plano atual (${studioPlan}) permite até ${PLAN_LIMITS[studioPlan].maxStudents} ${vocabulary.clients.toLowerCase()}. Faça o upgrade para continuar.`,
        variant: "destructive",
      })
      // Opcional: router.push("/dashboard/faturamento")
      return
    }

    try {
      const studentData = {
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        monthly_fee: Number(newStudent.monthlyFee) || 0,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active',
        metadata: newStudent.metadata
      }

      const savedStudent = await saveStudent(studentData)

      if (!savedStudent) {
        throw new Error(`O ${vocabulary.client.toLowerCase()} não pôde ser salvo. Verifique se os dados estão corretos.`)
      }

      // Recarregar lista de ${vocabulary.clients}
      await loadStudents()

      setNewStudent({ name: "", email: "", phone: "", monthlyFee: "", metadata: {} })
      setIsDialogOpen(false)
      toast({
        title: `${vocabulary.client} adicionado!`,
        description: `${savedStudent.name} foi cadastrado com sucesso.`,
      })
    } catch (error: any) {
      console.error('Erro ao salvar aluno (completo):', error)
      const message = error.message || (typeof error === 'string' ? error : '')
      toast({
        title: "Erro ao salvar",
        description: message || "Verifique se o e-mail já está cadastrado ou se os campos estão corretos.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (credits: number = 0, expiryDate?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = expiryDate ? new Date(expiryDate) : null;
    const isExpired = expiry && expiry < today;

    if (isExpired && credits > 0) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1" /> Congelado
        </Badge>
      );
    }

    if (credits > 0) {
      return <Badge className="bg-success/20 text-success-foreground hover:bg-success/30"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>
    } else {
      return <Badge variant="secondary">Inativo</Badge>
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-success/20 text-success-foreground hover:bg-success/30">Pago</Badge>
      case "pendente":
        return <Badge className="bg-warning/20 text-warning-foreground hover:bg-warning/30">Pendente</Badge>
      case "atrasado":
        return <Badge variant="destructive">Atrasado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const stats = [
    { label: `Total de ${vocabulary.clients}`, value: students.length, icon: Users },
    { label: `${vocabulary.clients} Ativos`, value: students.filter(s => (s.credits ?? 0) > 0).length, color: "text-success" },
    { label: "Baixo Crédito", value: students.filter(s => (s.credits ?? 0) > 0 && (s.credits ?? 0) <= 2).length, color: "text-warning" },
    { label: "Inativos", value: students.filter(s => (s.credits ?? 0) === 0).length, color: "text-muted-foreground" },
  ]

  const handleSendEmail = (student: Student) => {
    window.open(`mailto:${student.email}?subject=DanceFlow AI - Contato&body=Ola ${student.name},`)
    toast({
      title: "Email",
      description: `Abrindo email para ${student.name}`,
    })
  }

  const handleWhatsApp = (student: Student) => {
    const phone = student.phone.replace(/\D/g, "")
    const studioName = localStorage.getItem("danceflow_user") ? JSON.parse(localStorage.getItem("danceflow_user")!).studioName : "nossa empresa"
    window.open(`https://wa.me/55${phone}?text=Olá ${student.name}, aqui é da *${studioName}*!`, "_blank")
    toast({
      title: "WhatsApp",
      description: `Abrindo WhatsApp para ${student.name}`,
    })
  }

  const handleSendAcesso = async (student: Student) => {
    try {
      const userStr = localStorage.getItem("danceflow_user")
      if (!userStr) return
      const adminUser = JSON.parse(userStr)
      const studioSlug = adminUser.studioSlug
      const studioName = adminUser.studioName || vocabulary.establishment
      const studioId = adminUser.studio_id

      const loginLink = `${window.location.origin}/s/${studioSlug}/login?email=${encodeURIComponent(student.email)}`
      
      const message = `Olá *${student.name}*! 👋\n\nSeu acesso ao Portal do ${vocabulary.client} da *${studioName}* está liberado! ✨\n\nNo portal você poderá:\n✅ Ver seu saldo de créditos\n✅ Confirmar presença em ${vocabulary.services.toLowerCase()}\n✅ Ver seu histórico de pagamentos\n\n🚀 *Acesse agora:* ${loginLink}\n\nSeja bem-vindo(a)!`

      toast({
        title: "Enviando Acesso...",
        description: `Preparando mensagem para ${student.name}`,
      })

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: student.phone.replace(/\D/g, ""),
          message: message,
          studioId: studioId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Acesso Enviado!",
          description: `O link foi enviado com sucesso para ${student.name} via WhatsApp.`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Erro ao enviar acesso:', error)
      toast({
        title: "Erro ao Enviar",
        description: "Não foi possível enviar via WhatsApp automaticamente. Abrindo manual...",
        variant: "destructive",
      })
      // Fallback para link direto se o bot falhar
      handleWhatsApp(student)
    }
  }

  const handleDeactivate = async (student: Student) => {
    try {
      const newStatus = student.status === "ativo" ? "inactive" : "active"

      await saveStudent({
        id: student.uuid || student.id.toString(),
        status: newStatus
      })

      // Recarregar lista de alunos
      await loadStudents()

      toast({
        title: newStatus === "active" ? `${vocabulary.client} Reativado` : `${vocabulary.client} Desativado`,
        description: `${student.name} foi ${newStatus === "active" ? "reativado" : "desativado"}.`,
      })
    } catch (error) {
      console.error('Erro ao alterar status do aluno:', error)
      toast({
        title: "Erro",
        description: `Não foi possível alterar o status do ${vocabulary.client.toLowerCase()}.`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return

    try {
      await deleteStudent(studentToDelete.uuid || studentToDelete.id.toString())
      
      localStorage.removeItem('danceflow_students_cache')
      await loadStudents(true)

      setDeleteConfirmOpen(false)
      setStudentToDelete(null)
      toast({
        title: `${vocabulary.client} excluído`,
        description: `O registro do ${vocabulary.client.toLowerCase()} foi removido permanentemente.`,
      })
    } catch (error) {
      console.error('Erro ao excluir aluno:', error)
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível excluir o ${vocabulary.client.toLowerCase()}. Verifique se ele possui vínculos ativos.`,
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    const csv = [
      ["Nome", "Email", "Telefone", "Modalidade", "Status", "Mensalidade", "Pagamento"].join(","),
      ...filteredStudents.map(s => [s.name, s.email, s.phone, s.modality, s.status, s.monthlyFee, s.paymentStatus].join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lista-${vocabulary.clients.toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Exportado!",
      description: `Lista de ${vocabulary.clients.toLowerCase()} exportada com sucesso.`,
    })
  }

  // Handlers para ações do dropdown
  const handleViewProfile = (student: Student) => {
    // Converter dados do Student para o formato esperado pelo StudentProfile
    const profileData = {
      id: student.uuid || student.id.toString(),
      name: student.name,
      age: 25, // Idade aproximada baseada na data de matrícula
      avatar: '/placeholder-user.jpg',
      status: student.status === 'ativo' ? 'active' : 'overdue',
      joinDate: student.enrollmentDate,
      phone: student.phone,
      email: student.email,

      // Medidas corporais (mock para demonstração)
      measurements: {
        bust: 88,
        waist: 68,
        hip: 95,
        height: 168,
        shoeSize: 38,
      },

      // Gamification - conquistas mockadas
      achievements: [
        {
          id: 1,
          name: 'Primeira Aula',
          description: 'Completou sua primeira aula',
          icon: 'CheckCircle',
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          unlockedAt: student.enrollmentDate,
        },
        {
          id: 2,
          name: 'Aluno Pontual',
          description: 'Presença em 5 aulas consecutivas',
          icon: 'Star',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          unlockedAt: '2024-01-15',
        },
      ],

      // Turmas matriculadas
      enrolledClasses: [
        {
          id: 1,
          name: `${student.modality} - Intermediário`,
          style: student.modality,
          level: 'Intermediário',
          schedule: 'Terça e Quinta - 19h',
          teacher: 'Prof. Ana Silva',
          status: 'active',
        },
      ],

      // Dados de presença (últimos 6 meses)
      attendanceData: [
        { month: 'Jul', attendance: 95, target: 100 },
        { month: 'Ago', attendance: 88, target: 100 },
        { month: 'Set', attendance: 92, target: 100 },
        { month: 'Out', attendance: 96, target: 100 },
        { month: 'Nov', attendance: 89, target: 100 },
        { month: 'Dez', attendance: 94, target: 100 },
      ],

      // Histórico financeiro
      paymentHistory: [
        {
          month: 'Dezembro 2024',
          amount: student.monthlyFee,
          dueDate: '2024-12-10',
          paymentDate: student.paymentStatus === 'pago' ? '2024-12-08' : null,
          status: student.paymentStatus === 'pago' ? 'pago' : 'pendente',
        },
        {
          month: 'Novembro 2024',
          amount: student.monthlyFee,
          dueDate: '2024-11-10',
          paymentDate: '2024-11-08',
          status: 'pago',
        },
      ],

      // Anotações pedagógicas
      notes: [
        {
          id: 1,
          teacher: 'Prof. Ana Silva',
          date: '2024-01-15',
          note: 'Excelente progresso nas aulas. Demonstra grande dedicação e interesse.',
          type: 'positive',
        },
        {
          id: 2,
          teacher: 'Prof. Ana Silva',
          date: '2024-01-08',
          note: 'Faltou à aula sem justificativa. Entrar em contato para acompanhar.',
          type: 'concern',
        },
      ],
    }

    setSelectedStudent(profileData)
    setProfileModalOpen(true)
  }

  const handleViewAgenda = (student: Student) => {
    setSelectedStudent(student)
    setAgendaModalOpen(true)
  }

  const handleViewPayments = (student: Student) => {
    setSelectedStudent(student)
    setPaymentsModalOpen(true)
  }

  const handleEditStudent = async () => {
    if (!editStudent || !editStudent.uuid) return

    try {
      await saveStudent({
        id: editStudent.uuid,
        name: editStudent.name,
        email: editStudent.email,
        phone: editStudent.phone,
        monthly_fee: Number(editStudent.monthlyFee),
        metadata: editStudent.metadata
      })

      localStorage.removeItem('danceflow_students_cache')
      await loadStudents(true)

      setIsEditDialogOpen(false)
      setEditStudent(null)
      toast({
        title: `${vocabulary.client} atualizado!`,
        description: `${editStudent.name} foi atualizado com sucesso.`,
      })
    } catch (error: any) {
      console.error('Erro ao atualizar aluno:', error)
      const message = error.message || (typeof error === 'string' ? error : '')
      toast({
        title: "Erro ao atualizar",
        description: message || `Não foi possível atualizar os dados do ${vocabulary.client.toLowerCase()}.`,
        variant: "destructive",
      })
    }
  }

  const loadStudentCredits = async (studentUuid: string, studentStudioId?: string) => {
    try {
      let studioId = studentStudioId

      if (!studioId) {
        const userStr = localStorage.getItem('danceflow_user')
        if (!userStr) return
        const user = JSON.parse(userStr)
        studioId = user.studio_id || user.studioId
      }

      const { data, error } = await supabase
        .from('student_lesson_credits')
        .select('remaining_credits, id')
        .eq('student_id', studentUuid)
        .eq('studio_id', studioId)
        .maybeSingle()

      if (error) throw error
      setStudentCredits(data ? { remaining: data.remaining_credits, id: data.id } : { remaining: 0 })
    } catch (e) {
      console.error('Erro ao carregar créditos do aluno:', e)
    }
  }

  const handleAdjustCredits = async (type: 'add' | 'remove') => {
    if (!editStudent || !editStudent.uuid || adjustAmount <= 0) return
    
    setIsAdjusting(true)
    try {
      let studioId = editStudent.studio_id

      if (!studioId) {
        const userStr = localStorage.getItem('danceflow_user')
        if (!userStr) return
        const user = JSON.parse(userStr)
        studioId = user.studio_id || user.studioId
      }

      const amount = type === 'add' ? adjustAmount : -adjustAmount

      console.log('🔄 Ajustando créditos:', { student_id: editStudent.uuid, studio_id: studioId, amount })

      const { data, error } = await supabase.rpc('adjust_student_credits', {
        p_student_id: editStudent.uuid,
        p_studio_id: studioId,
        p_amount: amount
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Sucesso!",
          description: `${data.message} Novo saldo: ${data.new_balance}`,
        })
        setAdjustAmount(0)
        setStudentCredits({ remaining: data.new_balance }) // Atualiza na hora!
        
        // Atualizar também na lista (tabela) sem precisar de refresh completo
        setStudents(prev => {
          const updatedStudents = prev.map(s => 
            s.uuid === editStudent.uuid ? { ...s, credits: data.new_balance } : s
          )
          
          // Atualizar cache para que refreshes não revertam o dado
          const cacheKey = 'danceflow_students_cache'
          const cachedStr = localStorage.getItem(cacheKey)
          if (cachedStr) {
            const cached = JSON.parse(cachedStr)
            localStorage.setItem(cacheKey, JSON.stringify({
              ...cached,
              data: updatedStudents
            }))
          }

          return updatedStudents
        })
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
      setIsAdjusting(false)
    }
  }

  return (
    <ModuleGuard module="students" showFullError>
      <div className="min-h-screen bg-background">
        <Header title={vocabulary.clients} />

        <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color || "text-card-foreground"}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Actions */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadStudents(true)}
                  disabled={loading}
                  className="whitespace-nowrap"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Atualizando...' : 'Atualizar'}
                </Button>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-background">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="baixo">Baixo Crédito</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={modalityFilter} onValueChange={setModalityFilter}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder={vocabulary.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas {pluralize(vocabulary.category)}</SelectItem>
                    {dbModalities.length > 0 ? (
                      dbModalities.map((mod) => (
                        <SelectItem key={mod.id} value={mod.name}>{mod.name}</SelectItem>
                      ))
                    ) : (
                      <p className="p-2 text-sm text-muted-foreground italic text-center">Nenhuma cadastrada</p>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExport}>
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      <Plus className="w-4 h-4" />
                      Novo {vocabulary.client}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo {vocabulary.client}</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do novo {vocabulary.client.toLowerCase()} para realizar a matricula.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                          id="name"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                          placeholder="Nome do {vocabulary.client.toLowerCase()}"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newStudent.email}
                          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                          placeholder="email@exemplo.com"
                          className="bg-background"
                        />
                      </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={newStudent.phone}
                        onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyFee">Mensalidade ({vocabulary.service}) (R$)</Label>
                      <Input
                        id="monthlyFee"
                        type="number"
                        value={newStudent.monthlyFee}
                        onChange={(e) => setNewStudent({ ...newStudent, monthlyFee: e.target.value })}
                        placeholder="200"
                        className="bg-background"
                      />
                    </div>
                    
                    {schemas?.student && (
                      <DynamicMetadataForm 
                        schema={schemas.student} 
                        value={newStudent.metadata} 
                        onChange={(m) => setNewStudent({...newStudent, metadata: m})} 
                      />
                    )}

                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddStudent} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Adicionar {vocabulary.client}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Lista de {vocabulary.clients}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{vocabulary.client}</TableHead>
                    <TableHead>{vocabulary.category}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Última {vocabulary.service}</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{student.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.modality}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(student.credits, student.expiryDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 font-bold">
                          {student.credits ?? 0} {vocabulary.services.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{student.lastClass}</TableCell>
                      <TableCell className="text-foreground">R$ {student.monthlyFee}</TableCell>
                      <TableCell>{getPaymentBadge(student.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProfile(student)}>
                              <User className="w-4 h-4 mr-2" />
                              Ver Perfil 360º de {vocabulary.client}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendAcesso(student)}>
                              <Phone className="w-4 h-4 mr-2 text-emerald-500" />
                              Enviar Acesso WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { 
                              setEditStudent(student); 
                              setIsEditDialogOpen(true); 
                              if (student.uuid) loadStudentCredits(student.uuid, student.studio_id);
                            }}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAgenda(student)}>Ver Agenda</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPayments(student)}>Histórico de Pagamentos</DropdownMenuItem>
                            <DropdownMenuItem className="text-warning" onClick={() => handleDeactivate(student)}>
                              {student.status === "ativo" ? "Desativar" : "Reativar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive font-bold" 
                              onClick={() => {
                                setStudentToDelete(student);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir Permanentemente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum {vocabulary.client.toLowerCase()} encontrado com os filtros selecionados.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditStudent(null);
            setStudentCredits(null);
            setAdjustAmount(0);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar {vocabulary.client}</DialogTitle>
              <DialogDescription>
                Atualize os dados do {vocabulary.client.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            {editStudent && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={editStudent.name}
                    onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editStudent.email}
                    onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={editStudent.phone}
                    onChange={(e) => setEditStudent({ ...editStudent, phone: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fee">Mensalidade (R$)</Label>
                  <Input
                    id="edit-fee"
                    type="number"
                    value={editStudent.monthlyFee}
                    onChange={(e) => setEditStudent({ ...editStudent, monthlyFee: Number(e.target.value) })}
                    className="bg-background"
                  />
                </div>

                {schemas?.student && (
                  <DynamicMetadataForm 
                    schema={schemas.student} 
                    value={editStudent.metadata} 
                    onChange={(m) => setEditStudent({...editStudent, metadata: m})} 
                  />
                )}

                <div className="pt-4 border-t border-border mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Créditos de {vocabulary.service}</h4>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 font-bold">
                      {studentCredits ? `${studentCredits.remaining} disponíveis` : 
                       editStudent.credits !== undefined ? `${editStudent.credits} disponíveis` : 
                       '0 disponíveis'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Quantidade"
                        value={adjustAmount === 0 ? "" : adjustAmount}
                        onChange={(e) => setAdjustAmount(Math.abs(parseInt(e.target.value) || 0))}
                        className="bg-background"
                      />
                      <div className="flex gap-1">
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          onClick={() => handleAdjustCredits('add')}
                          disabled={isAdjusting || adjustAmount <= 0}
                        >
                          {isAdjusting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                          Add
                        </Button>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          onClick={() => handleAdjustCredits('remove')}
                          disabled={isAdjusting || adjustAmount <= 0}
                        >
                          {isAdjusting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                          Remover
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      * O ajuste é imediato e envia uma notificação para o {vocabulary.client.toLowerCase()}.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditStudent} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Salvar Alteracoes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Agenda do {vocabulary.client} */}
        <Dialog open={agendaModalOpen} onOpenChange={setAgendaModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Agenda - {selectedStudent?.name}</DialogTitle>
              <DialogDescription>
                Próximas {vocabulary.services.toLowerCase()} e horários do {vocabulary.client.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedStudent && (
                <div className="space-y-3">
                  {availableClasses.filter(c => {
                    // Aqui precisaríamos de um campo em enrollments para saber se o aluno está na turma
                    // Por enquanto vamos simular usando a modalidade, mas o ideal é ter a tabela de enrollments
                    return true; 
                  }).slice(0, 3).map((c, i) => (
                    <div key={i} className={`p-4 bg-gradient-to-r ${i === 0 ? 'from-violet-50 to-fuchsia-50' : i === 1 ? 'from-blue-50 to-cyan-50' : 'from-green-50 to-teal-50'} rounded-lg border border-opacity-20`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{c.name}</h4>
                        <Badge className="bg-green-100 text-green-800">{i === 0 ? `Próxima ${vocabulary.service.toLowerCase()}` : 'Confirmado'}</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>⏰ {c.schedule?.[0]?.start_time || 'Horário'}</p>
                        <p>📍 {c.room || 'Sala principal'} - {c.teacher?.name || vocabulary.provider}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Histórico de Pagamentos do {vocabulary.client} */}
        <Dialog open={paymentsModalOpen} onOpenChange={setPaymentsModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pagamentos - {selectedStudent?.name}</DialogTitle>
              <DialogDescription>
                Histórico completo de mensalidades e pagamentos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedStudent && (
                <div className="space-y-4">
                  {/* Status Atual */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-violet-700">R$ {selectedStudent.monthlyFee}</p>
                      <p className="text-sm text-violet-600">Mensalidade atual</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${selectedStudent.paymentStatus === 'pago' ? 'text-green-700' : 'text-red-700'}`}>
                        {selectedStudent.paymentStatus === 'pago' ? 'Em dia' : 'Pendente'}
                      </p>
                      <p className="text-sm text-gray-600">Status de pagamento</p>
                    </div>
                  </div>

                  {/* Histórico Detalhado */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Histórico de Pagamentos</h4>
                    {[
                      { month: 'Janeiro 2026', amount: selectedStudent.monthlyFee, status: 'pago', date: '2026-01-05' },
                      { month: 'Dezembro 2025', amount: selectedStudent.monthlyFee, status: 'pago', date: '2025-12-03' },
                      { month: 'Novembro 2025', amount: selectedStudent.monthlyFee, status: 'pago', date: '2025-11-02' },
                      { month: 'Outubro 2025', amount: selectedStudent.monthlyFee - 20, status: 'pago', date: '2025-10-28' },
                      { month: 'Setembro 2025', amount: selectedStudent.monthlyFee, status: 'atrasado', date: null },
                      { month: 'Agosto 2025', amount: selectedStudent.monthlyFee, status: 'pago', date: '2025-08-01' },
                    ].map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900">{payment.month}</p>
                            <Badge className={
                              payment.status === 'pago'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }>
                              {payment.status === 'pago' ? 'Pago' : 'Em atraso'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {payment.date
                              ? `Pago em ${new Date(payment.date).toLocaleDateString('pt-BR')}`
                              : 'Pagamento pendente'
                            }
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-lg text-gray-900">R$ {payment.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
            <div className="h-[90vh] overflow-auto">
              {selectedStudent && <StudentProfile studentData={selectedStudent} />}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o {vocabulary.client.toLowerCase()}
                <span className="font-bold"> {studentToDelete?.name} </span> e todos os dados associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </div>
    </ModuleGuard>
  )
}

export default function StudentsPage() {
  const { vocabulary } = useVocabulary()
  return (
    <Suspense fallback={<div className="p-6">Carregando {vocabulary.clients.toLowerCase()}...</div>}>
      <StudentsContent />
    </Suspense>
  )
}
