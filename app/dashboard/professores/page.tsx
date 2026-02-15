"use client"

import { useState, useEffect, Suspense } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  GraduationCap,
  DollarSign,
  Calendar,
  Star,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { getTeachers, saveTeacher, getClasses, deleteTeacher } from "@/lib/database-utils"
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

import { useVocabulary } from "@/hooks/use-vocabulary"
import { ModuleGuard } from "@/components/providers/module-guard"

interface Teacher {
  id: number
  uuid?: string
  name: string
  email: string
  phone: string
  specialties: string[]
  perClassRate: number
  status: "ativo" | "inativo"
  classesThisMonth: number
  rating: number
  hireDate: string
}

const initialTeachers: Teacher[] = [
  {
    id: 1,
    name: "Ana Paula Rodrigues",
    email: "ana.paula@email.com",
    phone: "(11) 98888-1111",
    specialties: ["Ballet", "Contemporaneo"],
    perClassRate: 80,
    status: "ativo",
    classesThisMonth: 24,
    rating: 4.9,
    hireDate: "2022-03-15",
  },
  {
    id: 2,
    name: "Carlos Eduardo Silva",
    email: "carlos.e@email.com",
    phone: "(11) 98888-2222",
    specialties: ["Hip Hop", "Jazz"],
    perClassRate: 70,
    status: "ativo",
    classesThisMonth: 20,
    rating: 4.7,
    hireDate: "2023-01-10",
  },
  {
    id: 3,
    name: "Lucas Oliveira",
    email: "lucas.o@email.com",
    phone: "(11) 98888-3333",
    specialties: ["Hip Hop"],
    perClassRate: 65,
    status: "ativo",
    classesThisMonth: 18,
    rating: 4.8,
    hireDate: "2023-06-20",
  },
  {
    id: 4,
    name: "Marina Santos",
    email: "marina.s@email.com",
    phone: "(11) 98888-4444",
    specialties: ["Salsa", "Jazz"],
    perClassRate: 75,
    status: "ativo",
    classesThisMonth: 16,
    rating: 4.6,
    hireDate: "2022-08-05",
  },
  {
    id: 5,
    name: "Roberto Ferreira",
    email: "roberto.f@email.com",
    phone: "(11) 98888-5555",
    specialties: ["Contemporaneo"],
    perClassRate: 85,
    status: "inativo",
    classesThisMonth: 0,
    rating: 4.5,
    hireDate: "2021-11-30",
  },
]

const allSpecialties = ["Ballet", "Jazz", "Hip Hop", "Contemporaneo", "Salsa"]

function TeachersContent() {
  const { vocabulary } = useVocabulary()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTeacher, setNewTeacher] = useState<any>({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    perClassRate: "",
    bonusPerStudent: "0",
    role: "teacher",
    bio: ""
  })

  // Estados para modais
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [agendaModalOpen, setAgendaModalOpen] = useState(false)
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [studioPlan, setStudioPlan] = useState("gratuito")
  const [modalities, setModalities] = useState<any[]>([])
  
  // Estados para finanças do professor selecionado
  const [teacherFinances, setTeacherFinances] = useState({
    classesThisMonth: 0,
    totalDue: 0,
    paymentHistory: [] as any[]
  })
  const [loadingFinances, setLoadingFinances] = useState(false)

  // Carregar dados automaticamente
  useEffect(() => {
    if (!dataLoaded) {
      loadTeachers()
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
        setModalities(data)
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

  const loadTeachers = async (forceReload = false) => {
    try {
      // Verificar se já temos dados em cache e não foi forçado recarregar
      const cacheKey = 'danceflow_teachers_cache'
      const cachedData = localStorage.getItem(cacheKey)

      if (cachedData && !forceReload) {
        const { data, timestamp } = JSON.parse(cachedData)
        const cacheAge = Date.now() - timestamp

        // Cache válido por 5 minutos
        if (cacheAge < 5 * 60 * 1000) {
          console.log('📦 Usando dados em cache dos professores')
          setTeachers(data)
          setDataLoaded(true)
          setLoading(false)
          return
        }
      }

      setLoading(true)
      const result = await getTeachers({
        status: statusFilter !== "all" ? statusFilter : undefined
      })

      // Mapear dados do Supabase para o formato da interface
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      // Buscar sessões de todos os professores para este mês
      const { data: allSessions } = await supabase
        .from('sessions')
        .select('actual_teacher_id')
        .gte('scheduled_date', firstDayOfMonth)
        .lte('scheduled_date', lastDayOfMonth)
        .eq('status', 'completed')

      const sessionCounts: Record<string, number> = {}
      allSessions?.forEach(s => {
        if (s.actual_teacher_id) {
          sessionCounts[s.actual_teacher_id] = (sessionCounts[s.actual_teacher_id] || 0) + 1
        }
      })

      const mappedTeachers: Teacher[] = result.map((teacher, index) => {
        const classesCount = sessionCounts[teacher.id] || 0
        return {
          id: index + 1,
          uuid: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone || "",
          specialties: teacher.specialties || [],
          perClassRate: teacher.hourly_rate || 0,
          bonusPerStudent: teacher.bonus_per_student || 0,
          status: teacher.status === 'active' ? 'ativo' : 'inativo',
          hireDate: teacher.hire_date || new Date().toISOString().split('T')[0],
          classesThisMonth: classesCount,
          rating: 4.5 // Placeholder
        }
      })

      setTeachers(mappedTeachers)
      setDataLoaded(true)

      // Salvar no cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data: mappedTeachers,
        timestamp: Date.now()
      }))

      console.log('💾 Dados dos professores salvos no cache')

    } catch (error) {
      console.error('Erro ao carregar professores:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de professores.",
        variant: "destructive",
      })
      // Fallback para dados mockados em caso de erro
      setTeachers(initialTeachers)
    } finally {
      setLoading(false)
    }
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || teacher.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.phone || !newTeacher.specialty) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Verificar limite do plano
    if (isLimitReached(teachers.filter(t => t.status === "ativo").length, studioPlan, 'maxTeachers')) {
      toast({
        title: "Limite de Plano Atingido",
        description: `Seu plano atual (${studioPlan}) permite até ${PLAN_LIMITS[studioPlan].maxTeachers} ${vocabulary.providers.toLowerCase()} ativos. Faça o upgrade para continuar.`,
        variant: "destructive",
      })
      return
    }

    try {
      const teacherData = {
        name: newTeacher.name,
        email: newTeacher.email,
        phone: newTeacher.phone,
        specialties: [newTeacher.specialty],
        bio: newTeacher.bio,
        hourly_rate: Number(newTeacher.perClassRate) || 70,
        bonus_per_student: Number(newTeacher.bonusPerStudent) || 0,
        status: 'active',
        hire_date: new Date().toISOString().split("T")[0]
      }

      await saveTeacher(teacherData)
      
      // Forçar recarregamento do cache
      localStorage.removeItem('danceflow_teachers_cache')
      await loadTeachers(true)

      setNewTeacher({ name: "", email: "", phone: "", specialty: "", perClassRate: "", bonusPerStudent: "0", role: "teacher" })
      setIsDialogOpen(false)
      toast({
        title: "Professor adicionado!",
        description: `${teacherData.name} foi cadastrado com sucesso.`,
      })
    } catch (error: any) {
      console.error('Erro ao salvar professor:', error)
      toast({
        title: "Erro",
        description: error.message || `Não foi possível salvar o ${vocabulary.provider.toLowerCase()}. Verifique se o e-mail já está cadastrado.`,
        variant: "destructive",
      })
    }
  }

  const totalActiveTeachers = teachers.filter(t => t.status === "ativo").length
  const totalClassesThisMonth = teachers.reduce((acc, t) => acc + (t.classesThisMonth || 0), 0)
  const totalPayment = teachers.reduce((acc, t) => acc + ((t.classesThisMonth || 0) * t.perClassRate), 0)

  // Handlers para ações do dropdown
  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher({ ...teacher })
    setEditModalOpen(true)
  }

  const handleViewAgenda = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setAgendaModalOpen(true)
  }

  const handleViewPayments = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setPaymentsModalOpen(true)
    loadTeacherFinances(teacher)
  }

  const loadTeacherFinances = async (teacher: Teacher) => {
    if (!teacher.uuid) return
    setLoadingFinances(true)
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      // 1. Buscar sessões (aulas dadas) este mês
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact' })
        .eq('actual_teacher_id', teacher.uuid)
        .gte('scheduled_date', firstDayOfMonth)
        .lte('scheduled_date', lastDayOfMonth)
        .eq('status', 'completed')

      // 2. Buscar histórico de pagamentos
      const { data: payments, error: paymentsError } = await supabase
        .from('teacher_payments')
        .select('*')
        .eq('teacher_id', teacher.uuid)
        .order('payment_date', { ascending: false })

      const classesCount = sessions?.length || 0
      
      setTeacherFinances({
        classesThisMonth: classesCount,
        totalDue: classesCount * teacher.perClassRate,
        paymentHistory: payments || []
      })
    } catch (e) {
      console.error('Erro ao carregar finanças do professor:', e)
    } finally {
      setLoadingFinances(false)
    }
  }

  const handleDeactivateTeacher = async (teacher: Teacher) => {
    try {
      const newStatus = teacher.status === "ativo" ? "inactive" : "active"
      
      await saveTeacher({
        id: teacher.uuid,
        status: newStatus
      })

      localStorage.removeItem('danceflow_teachers_cache')
      await loadTeachers(true)

      toast({
        title: newStatus === "inactive" ? "Professor desativado" : "Professor reativado",
        description: `${teacher.name} foi ${newStatus === "inactive" ? 'desativado' : 'reativado'} com sucesso.`,
      })
    } catch (error: any) {
      console.error('Erro ao mudar status do professor:', error)
      toast({
        title: "Erro",
        description: error.message || `Não foi possível alterar o status do ${vocabulary.provider.toLowerCase()}.`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete || !teacherToDelete.uuid) return

    try {
      await deleteTeacher(teacherToDelete.uuid)
      
      localStorage.removeItem('danceflow_teachers_cache')
      await loadTeachers(true)

      setDeleteConfirmOpen(false)
      setTeacherToDelete(null)
      toast({
        title: `Professor excluído`,
        description: `O registro do ${vocabulary.provider.toLowerCase()} foi removido permanentemente.`,
      })
    } catch (error: any) {
      console.error('Erro ao excluir professor:', error)
      toast({
        title: "Erro ao excluir",
        description: error.message || `Não foi possível excluir o ${vocabulary.provider.toLowerCase()}. Ele pode ter registros de ${vocabulary.services.toLowerCase()} ou finanças vinculados.`,
        variant: "destructive",
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedTeacher || !selectedTeacher.uuid) return

    try {
      await saveTeacher({
        id: selectedTeacher.uuid,
        name: selectedTeacher.name,
        email: selectedTeacher.email,
        phone: selectedTeacher.phone,
        hourly_rate: selectedTeacher.perClassRate,
        bonus_per_student: selectedTeacher.bonusPerStudent,
        bio: selectedTeacher.bio
      })

      localStorage.removeItem('danceflow_teachers_cache')
      await loadTeachers(true)

      setEditModalOpen(false)
      setSelectedTeacher(null)
      toast({
        title: `Professor atualizado`,
        description: `Dados do ${vocabulary.provider.toLowerCase()} foram salvos com sucesso.`,
      })
    } catch (error: any) {
      console.error('Erro ao atualizar professor:', error)
      toast({
        title: "Erro",
        description: error.message || `Não foi possível atualizar os dados do ${vocabulary.provider.toLowerCase()}.`,
        variant: "destructive",
      })
    }
  }

  return (
    <ModuleGuard module="classes" showFullError>
      <div className="min-h-screen bg-background">
        <Header title={vocabulary.providers} />

        <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{vocabulary.providers} Ativos</p>
                  <p className="text-2xl font-bold text-card-foreground">{totalActiveTeachers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{vocabulary.services} este Mês</p>
                  <p className="text-2xl font-bold text-card-foreground">{totalClassesThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total a Pagar</p>
                  <p className="text-2xl font-bold text-card-foreground">R$ {totalPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avaliacao Media</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {totalActiveTeachers > 0 
                      ? (teachers.filter(t => t.status === "ativo").reduce((acc, t) => acc + t.rating, 0) / totalActiveTeachers).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  onClick={() => loadTeachers(true)}
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
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <Plus className="w-4 h-4" />
                    Novo {vocabulary.provider}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo {vocabulary.provider}</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo {vocabulary.provider.toLowerCase()}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={newTeacher.name}
                        onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                        placeholder={`Nome do ${vocabulary.provider.toLowerCase()}`}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newTeacher.email}
                        onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                        placeholder="email@exemplo.com"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={newTeacher.phone}
                        onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Nível de Acesso *</Label>
                        <Select
                          value={newTeacher.role || "teacher"}
                          onValueChange={(value) => setNewTeacher({ ...newTeacher, role: value })}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teacher">Professor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="receptionist">Recepcionista</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidade *</Label>
                        <Select
                          value={newTeacher.specialty}
                          onValueChange={(value) => setNewTeacher({ ...newTeacher, specialty: value })}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {modalities.length > 0 ? (
                              modalities.map((mod) => (
                                <SelectItem key={mod.id} value={mod.name}>{mod.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="Geral" disabled>Nenhuma modalidade</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="perClassRate">Base por Aula (R$)</Label>
                        <Input
                          id="perClassRate"
                          type="number"
                          value={newTeacher.perClassRate}
                          onChange={(e) => setNewTeacher({ ...newTeacher, perClassRate: e.target.value })}
                          placeholder="70"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bonusPerStudent">Bônus por Aluno (R$)</Label>
                        <Input
                          id="bonusPerStudent"
                          type="number"
                          value={newTeacher.bonusPerStudent}
                          onChange={(e) => setNewTeacher({ ...newTeacher, bonusPerStudent: e.target.value })}
                          placeholder="0"
                          className="bg-background"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografia / Experiência (IA Contexto)</Label>
                      <Textarea
                        id="bio"
                        value={newTeacher.bio || ""}
                        onChange={(e) => setNewTeacher({ ...newTeacher, bio: e.target.value })}
                        placeholder="Ex: Formado em Ballet clássico na Rússia, com 10 anos de experiência..."
                        className="bg-background"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddTeacher} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Adicionar {vocabulary.provider}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                      {teacher.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-card-foreground">{teacher.name}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="text-sm text-muted-foreground">{teacher.rating}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTeacher(teacher)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewAgenda(teacher)}>Ver Agenda</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewPayments(teacher)}>Histórico de Pagamentos</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-warning"
                        onClick={() => handleDeactivateTeacher(teacher)}
                      >
                        {teacher.status === "ativo" ? "Desativar" : "Reativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive font-bold" 
                        onClick={() => {
                          setTeacherToDelete(teacher);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Permanentemente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {teacher.specialties.map((spec) => (
                    <Badge key={spec} variant="secondary" className="bg-primary/10 text-primary">
                      {spec}
                    </Badge>
                  ))}
                  <Badge variant={teacher.status === "ativo" ? "default" : "secondary"} className={teacher.status === "ativo" ? "bg-success/20 text-success-foreground" : ""}>
                    {teacher.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {teacher.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {teacher.phone}
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{teacher.classesThisMonth}</p>
                      <p className="text-xs text-muted-foreground">{vocabulary.services} este mês</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">R$ {(teacher.classesThisMonth * teacher.perClassRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">A receber</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Configuração: <span className="font-medium text-foreground">R$ {teacher.perClassRate} base + R$ {teacher.bonusPerStudent}/{vocabulary.client.toLowerCase()}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTeachers.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum {vocabulary.provider.toLowerCase()} encontrado.</p>
            </CardContent>
          </Card>
        )}

        {/* Modal de Edição */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar {vocabulary.provider}</DialogTitle>
              <DialogDescription>
                Atualize os dados do {vocabulary.provider.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            {selectedTeacher && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={selectedTeacher.name}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, name: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedTeacher.email}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, email: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedTeacher.phone}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, phone: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-rate">Base por Aula (R$)</Label>
                    <Input
                      id="edit-rate"
                      type="number"
                      value={selectedTeacher.perClassRate}
                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, perClassRate: Number(e.target.value) })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bonus">Bônus por Aluno (R$)</Label>
                    <Input
                      id="edit-bonus"
                      type="number"
                      value={selectedTeacher.bonusPerStudent}
                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, bonusPerStudent: Number(e.target.value) })}
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Agenda */}
        <Dialog open={agendaModalOpen} onOpenChange={setAgendaModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Agenda - {selectedTeacher?.name}</DialogTitle>
              <DialogDescription>
                Horários das {vocabulary.services.toLowerCase()} ministradas pelo {vocabulary.provider.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedTeacher && (
                <div className="space-y-3">
                  {availableClasses.filter(c => c.teacher_id === selectedTeacher.uuid).length > 0 ? (
                    availableClasses
                      .filter(c => c.teacher_id === selectedTeacher.uuid)
                      .map((c, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-sm text-gray-600">
                                {c.schedule?.[0]?.day_of_week === 1 ? 'Segunda' : 
                                 c.schedule?.[0]?.day_of_week === 2 ? 'Terça' :
                                 c.schedule?.[0]?.day_of_week === 3 ? 'Quarta' :
                                 c.schedule?.[0]?.day_of_week === 4 ? 'Quinta' :
                                 c.schedule?.[0]?.day_of_week === 5 ? 'Sexta' : 'Sábado'} - {c.schedule?.[0]?.start_time}
                              </p>
                            </div>
                            <Badge className={c.status === 'active' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {c.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Nenhuma turma encontrada para este {vocabulary.provider.toLowerCase()}.</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Histórico de Pagamentos */}
        <Dialog open={paymentsModalOpen} onOpenChange={setPaymentsModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pagamentos - {selectedTeacher?.name}</DialogTitle>
              <DialogDescription>
                Histórico de pagamentos e valores devidos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedTeacher && (
                <div className="space-y-3">
                  {/* Resumo */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-700">
                        {loadingFinances ? "..." : teacherFinances.classesThisMonth}
                      </p>
                      <p className="text-sm text-blue-600">{vocabulary.services} este mês</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700">
                        R$ {loadingFinances ? "..." : teacherFinances.totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-green-600">Valor devido</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-700">
                        R$ {selectedTeacher.perClassRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-purple-600">Valor por {vocabulary.service.toLowerCase()}</p>
                    </div>
                  </div>

                  {/* Histórico de Pagamentos */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Últimos Pagamentos</h4>
                    {loadingFinances ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Carregando histórico...
                      </div>
                    ) : teacherFinances.paymentHistory.length > 0 ? (
                      teacherFinances.paymentHistory.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{payment.reference_month}</p>
                            <p className="text-sm text-gray-600">
                              {payment.payment_date ? `Pago em ${new Date(payment.payment_date).toLocaleDateString('pt-BR')}` : 'Aguardando pagamento'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <Badge className={payment.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                              {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhum pagamento registrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o {vocabulary.provider.toLowerCase()}
                <span className="font-bold"> {teacherToDelete?.name} </span> e todos os dados associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTeacherToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTeacher} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

export default function TeachersPage() {
  const { vocabulary } = useVocabulary()
  return (
    <Suspense fallback={<div className="p-6">Carregando {vocabulary.providers.toLowerCase()}...</div>}>
      <TeachersContent />
    </Suspense>
  )
}
