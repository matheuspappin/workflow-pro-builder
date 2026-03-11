"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  RefreshCw,
  MoreVertical,
  Trash2,
  Edit,
  Tag,
  UserCheck,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { ModuleGuard } from "@/components/providers/module-guard"
import { useOrganization } from "@/components/providers/organization-provider"
import { isLimitReached, PLAN_LIMITS } from "@/lib/plan-limits"
import { supabase } from "@/lib/supabase"

interface ClassItem {
  id: string | number
  uuid?: string
  name: string
  modality: string
  teacher: string
  teacherId?: string
  day: string
  time: string
  endTime: string
  duration: number
  room: string
  maxStudents: number
  enrolledStudents: number
  level: "beginner" | "intermediate" | "advanced"
  status: "ativa" | "cancelada" | "cheia"
  price_in_credits: number
  price_in_currency: number
  isCancelledToday?: boolean
}

const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
const weekDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
const dayToNumber: Record<string, number> = {
  "monday": 1,
  "tuesday": 2,
  "wednesday": 3,
  "thursday": 4,
  "friday": 5,
  "saturday": 6
}

export default function ClassesPage() {
  const { toast } = useToast()
  const { vocabulary, t, language } = useVocabulary()
  const { businessModel } = useOrganization()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>("monday")
  
  useEffect(() => {
    // Sincronizar o dia da semana atual com o selectedDay ao montar
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const todayIndex = currentDate.getDay()
    // Se for domingo, padrão para monday, senão usa o dia atual
    const todayName = todayIndex === 0 ? "monday" : dayNames[todayIndex]
    if (dayKeys.includes(todayName)) {
      setSelectedDay(todayName)
    }
  }, [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
  const [cancelledToday, setCancelledToday] = useState<string[]>([])
  
  const [newClass, setNewClass] = useState({
    name: "",
    modality: "",
    teacherId: "",
    day: "monday",
    time: "18:00",
    duration: "60",
    room: "Sala 1",
    maxStudents: "15",
    level: "beginner",
    price_in_credits: 0,
    price_in_currency: 0,
  })

  // Sincronizar o dia da nova turma com o dia selecionado no filtro
  useEffect(() => {
    setNewClass(prev => ({ ...prev, day: selectedDay }))
  }, [selectedDay])
  const [teachersList, setTeachersList] = useState<any[]>([])
  const [modalitiesList, setModalitiesList] = useState<any[]>([])
  const [isModalityDialogOpen, setIsModalityDialogOpen] = useState(false)
  const [newModality, setNewModality] = useState({ name: "", description: "" })

  // Carregar {vocabulary.services.toLowerCase()}, {vocabulary.providers.toLowerCase()} e {vocabulary.category.toLowerCase()}s do banco
  const getClasses = async () => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return []
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teacher_id:professional_id,
          teacher:professional_id(name)
        `)
        .eq('studio_id', studioId)
        .order('name')

      if (error) throw error
      return data || []
    } catch (e: any) {
      console.error('Erro ao buscar turmas:', e?.message || e)
      return []
    }
  }

  const getTeachers = async () => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return []
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('studio_id', studioId)
        .order('name')

      if (error) throw error
      return data || []
    } catch (e: any) {
      console.error('Erro ao buscar professores:', e?.message || e)
      return []
    }
  }

  const getModalities = async () => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return []
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const { data, error } = await supabase
        .from('modalities')
        .select('*')
        .eq('studio_id', studioId)
        .order('name')

      if (error) throw error
      return data || []
    } catch (e: any) {
      console.error('Erro ao buscar modalidades:', e?.message || e)
      return []
    }
  }

  const saveClass = async (classData: any) => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) throw new Error('Usuário não autenticado')
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const { id, teacher_id, ...data } = classData
      
      const classPayload = {
        ...data,
        professional_id: teacher_id || (data as any).professional_id
      }
      
      if (id) {
        const { data: updated, error } = await supabase
          .from('classes')
          .update(classPayload)
          .eq('id', id)
          .eq('studio_id', studioId)
          .select()
          .single()
        
        if (error) throw error
        return updated
      } else {
        const { data: inserted, error } = await supabase
          .from('classes')
          .insert({ ...classPayload, studio_id: studioId })
          .select()
          .single()
        
        if (error) throw error
        return inserted
      }
    } catch (e) {
      console.error('Erro ao salvar turma:', e)
      throw e
    }
  }

  const saveModality = async (modalityData: any) => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) throw new Error('Usuário não autenticado')
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const { id, ...data } = modalityData
      
      if (id) {
        const { data: updated, error } = await supabase
          .from('modalities')
          .update(data)
          .eq('id', id)
          .eq('studio_id', studioId)
          .select()
          .single()
        
        if (error) throw error
        return updated
      } else {
        const { data: inserted, error } = await supabase
          .from('modalities')
          .insert({ ...data, studio_id: studioId })
          .select()
          .single()
        
        if (error) throw error
        return inserted
      }
    } catch (e) {
      console.error('Erro ao salvar modalidade:', e)
      throw e
    }
  }

  const loadClasses = async () => {
    try {
      setLoading(true)
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId
      const today = new Date().toISOString().split('T')[0]

      const weekDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

      const [data, teachersData, modalitiesData, sessionsData] = await Promise.all([
        getClasses(),
        getTeachers(),
        getModalities(),
        supabase.from('sessions').select('class_id').eq('studio_id', studioId).eq('scheduled_date', today).eq('status', 'cancelled'),
      ])
      
      setTeachersList(teachersData)
      setModalitiesList(modalitiesData)
      
      if (sessionsData.data) {
        setCancelledToday(sessionsData.data.map(s => s.class_id))
      }

      console.log('📚 Turmas carregadas:', data)
      
      const mappedClasses: ClassItem[] = data.map((c: any) => {
        const schedule = Array.isArray(c.schedule) ? c.schedule : []
        const mainSchedule = schedule[0] || {}
        const startTime = mainSchedule.start_time || "00:00"
        const durationMinutes = mainSchedule.duration_minutes || 60

        // Calcular endTime para exibição
        let endTime = ""
        if (startTime.includes(':')) {
          const [h, m] = startTime.split(':').map(Number)
          const totalMinutes = (h * 60 + m) + durationMinutes
          const endH = Math.floor(totalMinutes / 60) % 24
          const endM = totalMinutes % 60
          endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
        }
        
        return {
          id: c.id,
          uuid: c.id,
          name: c.name,
          modality: c.dance_style,
          teacher: c.teacher?.name || (language === 'pt' ? `Sem ${vocabulary.provider.toLowerCase()}` : `No ${vocabulary.provider.toLowerCase()}`),
          teacherId: c.teacher_id,
          day: weekDays.find(d => dayToNumber[d] === mainSchedule.day_of_week) || (language === 'pt' ? "Segunda" : "Monday"),
          time: startTime,
          endTime: endTime,
          duration: durationMinutes,
          room: c.room || (language === 'pt' ? "Sala 1" : "Room 1"),
          maxStudents: c.max_students || 15,
          enrolledStudents: c.current_students || 0,
          level: c.level || "beginner",
          status: c.status === 'active' ? ((c.current_students || 0) >= c.max_students ? "cheia" : "ativa") : "cancelada",
          isCancelledToday: sessionsData.data?.some(s => s.class_id === c.id) || false,
          price_in_credits: c.price_in_credits || 0,
          price_in_currency: c.price_in_currency || 0
        }
      })

      setClasses(mappedClasses)
    } catch (error: any) {
      console.error('Erro detalhado ao carregar turmas:', error)
      const errorMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))
      toast({
        title: "Erro ao carregar turmas",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  const filteredClasses = classes.filter((c) => c.day === selectedDay)

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.modality || !newClass.day || !newClass.time || !newClass.duration) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const duration = Number(newClass.duration);
    if (isNaN(duration) || duration < 10 || duration > 360) {
      toast({
        title: "Erro",
        description: `A duração da ${vocabulary.service.toLowerCase()} deve ser entre 10 e 360 minutos.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await saveClass({
        name: newClass.name,
        teacher_id: newClass.teacherId,
        dance_style: newClass.modality,
        level: newClass.level,
        max_students: Number(newClass.maxStudents),
        status: 'active',
        schedule: [{
          day_of_week: dayToNumber[newClass.day],
          start_time: newClass.time,
          duration_minutes: Number(newClass.duration)
        }]
      })

      loadClasses()
      setIsDialogOpen(false)
      toast({
        title: t.common.success,
        description: `${vocabulary.service} criada com sucesso!`,
      })
    } catch (error) {
      toast({
        title: t.common.error,
        description: `Erro ao criar ${vocabulary.service.toLowerCase()}.`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteClass = async (classItem: ClassItem) => {
    try {
      if (!confirm(`Tem certeza? Isso excluirá permanentemente a ${vocabulary.service.toLowerCase()} e todas as matrículas associadas.`)) {
        return
      }

      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId

      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classItem.uuid)
        .eq('studio_id', studioId)

      if (error) throw error

      loadClasses()
      toast({
        title: t.common.success,
        description: `${vocabulary.service} excluída permanentemente.`,
      })
    } catch (error) {
      toast({
        title: t.common.error,
        description: `Erro ao excluir ${vocabulary.service.toLowerCase()}.`,
        variant: "destructive",
      })
    }
  }

  const handleDeactivateClass = async (classItem: ClassItem) => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      const studioId = user.studio_id || user.studioId
      const studioName = user.studioName || vocabulary.establishment

      const newStatus = classItem.status === "cancelada" ? "active" : "cancelled"
      
      // 1. Atualizar status no banco
      await saveClass({
        id: classItem.uuid,
        status: newStatus
      })

      // 2. Notificar se for cancelamento
      if (newStatus === "cancelled") {
        // Buscar professor
        const { data: teacher } = await supabase
          .from('teachers')
          .select('name, phone, user_id')
          .eq('id', classItem.teacherId)
          .single()

        // Buscar alunos matriculados nesta turma
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id, student:students(name, phone)')
          .eq('class_id', classItem.uuid)
          .eq('status', 'active')

        const messageTitle = `${vocabulary.service} Cancelada: ${classItem.name}`
        const messageProfessor = `⚠️ A ${vocabulary.service.toLowerCase()} ${classItem.name} (${classItem.day} às ${classItem.time}) foi cancelada pela administração.`
        const messageAluno = `⚠️ A ${vocabulary.service.toLowerCase()} ${classItem.name} (${classItem.day} às ${classItem.time}) foi cancelada permanentemente. Procure a recepção para novos horários.`

        // --- SISTEMA DE NOTIFICAÇÃO INTERNA ---
        
        // Notificação interna para o Professor
        if (teacher?.user_id) {
          await supabase.from('notifications').insert({
            studio_id: studioId,
            user_id: teacher.user_id,
            title: messageTitle,
            message: messageProfessor,
            type: 'warning',
            metadata: { class_id: classItem.uuid, type: 'class_cancellation' }
          })
        }

        // Notificações internas para os Alunos
        if (enrollments && enrollments.length > 0) {
          const studentNotifications = enrollments.map(enroll => ({
            studio_id: studioId,
            user_id: enroll.student_id,
            title: messageTitle,
            message: messageAluno,
            type: 'warning',
            metadata: { class_id: classItem.uuid, type: 'class_cancellation' }
          }))
          await supabase.from('notifications').insert(studentNotifications)
        }

        // --- WHATSAPP (OPCIONAL/EXTERNO) ---
        
        // Notificar Professor WhatsApp
        if (teacher?.phone) {
          fetch('/api/whatsapp/send', {
            method: 'POST',
            body: JSON.stringify({ to: teacher.phone, message: `⚠️ *AVISO:* ${vocabulary.provider} *${teacher?.name}*, a ${vocabulary.service.toLowerCase()} *${classItem.name}* foi cancelada na *${studioName}*.`, studioId })
          }).catch(console.error)
        }

        // Notificar Alunos WhatsApp
        enrollments?.forEach(enroll => {
          const student = enroll.student as any
          if (student?.phone) {
            fetch('/api/whatsapp/send', {
              method: 'POST',
              body: JSON.stringify({ to: student.phone, message: `⚠️ *AVISO:* A ${vocabulary.service.toLowerCase()} *${classItem.name}* foi cancelada na *${studioName}*. Entre em contato com a recepção.`, studioId })
            }).catch(console.error)
          }
        })
      }

      loadClasses()
      toast({
        title: t.common.success,
        description: `${vocabulary.service} ${newStatus === 'active' ? 'ativada' : 'cancelada'} com sucesso! Notificações enviadas via sistema e WhatsApp.`,
      })
    } catch (error) {
      toast({
        title: t.common.error,
        description: `Erro ao alterar status da ${vocabulary.service.toLowerCase()}.`,
        variant: "destructive",
      })
    }
  }

  const handleAddModality = async () => {
    if (!newModality.name) {
      toast({ title: "Erro", description: `O nome da ${vocabulary.category.toLowerCase()} é obrigatório.`, variant: "destructive" })
      return
    }

    try {
      await saveModality(newModality)
      const updatedModalities = await getModalities()
      setModalitiesList(updatedModalities)
      setIsModalityDialogOpen(false)
      setNewModality({ name: "", description: "" })
      toast({ title: t.common.success, description: `${vocabulary.category} criada com sucesso!` })
    } catch (error) {
      toast({ title: t.common.error, description: `Erro ao criar ${vocabulary.category.toLowerCase()}.`, variant: "destructive" })
    }
  }

  const handleEditClass = async () => {
    if (!editingClass) return
    if (!editingClass.name || !editingClass.modality || !editingClass.day || !editingClass.time || !editingClass.duration) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const duration = Number(editingClass.duration);
    if (isNaN(duration) || duration < 10 || duration > 360) {
      toast({
        title: "Erro",
        description: `A duração da ${vocabulary.service.toLowerCase()} deve ser entre 10 e 360 minutos.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await saveClass({
        id: editingClass.uuid,
        name: editingClass.name,
        dance_style: editingClass.modality,
        level: editingClass.level,
        max_students: Number(editingClass.maxStudents),
        price_in_credits: Number(editingClass.price_in_credits),
        price_in_currency: Number(editingClass.price_in_currency),
        schedule: [{
          day_of_week: dayToNumber[editingClass.day],
          start_time: editingClass.time,
          duration_minutes: Number(editingClass.duration)
        }]
      })
      loadClasses()
      setIsEditDialogOpen(false)
      toast({
        title: t.common.success,
        description: `${vocabulary.service} atualizada com sucesso!`,
      })
    } catch (error) {
      toast({
        title: t.common.error,
        description: `Erro ao atualizar ${vocabulary.service.toLowerCase()}.`,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string, enrolled: number, max: number, isCancelledToday?: boolean) => {
    if (isCancelledToday) {
      return <Badge variant="destructive" className="bg-rose-600 animate-pulse">{t.classes.cancelledToday}</Badge>
    }
    const percentage = (enrolled / max) * 100
    if (status === "cheia" || percentage >= 100) {
      return <Badge variant="destructive">{t.classes.full}</Badge>
    }
    if (status === "cancelada") {
      return <Badge variant="secondary">{t.common.cancelled}</Badge>
    }
    if (percentage >= 80) {
      return <Badge className="bg-warning/20 text-warning-foreground">{t.classes.almostFull}</Badge>
    }
    return <Badge className="bg-success/20 text-success-foreground">{t.classes.availableSlots}</Badge>
  }

  const totalClassesCount = classes.length
  const totalStudentsEnrolled = classes.reduce((acc, c) => acc + c.enrolledStudents, 0)
  const avgOccupancy = totalClassesCount > 0 ? Math.round(
    (classes.reduce((acc, c) => acc + (c.enrolledStudents / c.maxStudents) * 100, 0) / totalClassesCount)
  ) : 0

  const currentDayIndex = dayKeys.indexOf(selectedDay)

  return (
    <ModuleGuard module="classes" showFullError>
      <div className="min-h-screen bg-background">
        <Header title={vocabulary.services} />

        <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.common.totalOf} {vocabulary.services}</p>
                  <p className="text-2xl font-bold text-card-foreground">{loading ? '...' : totalClassesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{vocabulary.clients} {t.common.enrolled}</p>
                  <p className="text-2xl font-bold text-card-foreground">{loading ? '...' : totalStudentsEnrolled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.common.avgOccupancy}</p>
                  <p className="text-2xl font-bold text-card-foreground">{loading ? '...' : avgOccupancy}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-center h-full">
                <Button type="button" variant="ghost" size="sm" onClick={() => loadClasses()} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t.common.updateData}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Selector and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDay(dayKeys[Math.max(0, currentDayIndex - 1)])}
              disabled={currentDayIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0">
              {dayKeys.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "ghost"}
                  className={selectedDay === day ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setSelectedDay(day)}
                >
                  {t.weekDays[day as keyof typeof t.weekDays]}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDay(dayKeys[Math.min(dayKeys.length - 1, currentDayIndex + 1)])}
              disabled={currentDayIndex === dayKeys.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={() => setIsModalityDialogOpen(true)}>
                <Tag className="w-4 h-4" />
                {t.classes.newCategory.replace('{category}', vocabulary.category)}
              </Button>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Plus className="w-4 h-4" />
                  {t.classes.createNew.replace('{service}', vocabulary.service)}
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t.classes.createNew.replace('{service}', vocabulary.service)}</DialogTitle>
                <DialogDescription>
                  {language === 'pt' ? `Configure os detalhes da nova ${vocabulary.service.toLowerCase()}.` : `Configure the details of the new ${vocabulary.service.toLowerCase()}.`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da {vocabulary.service} *</Label>
                  <Input
                    id="name"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    placeholder={`Ex: ${vocabulary.service} Iniciante`}
                    className="bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modality">{vocabulary.category} *</Label>
                    <Select
                      value={newClass.modality}
                      onValueChange={(value) => setNewClass({ ...newClass, modality: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {modalitiesList.length > 0 ? (
                          modalitiesList.map((mod) => (
                            <SelectItem key={mod.id} value={mod.name}>{mod.name}</SelectItem>
                          ))
                        ) : (
                          <p className="p-2 text-sm text-muted-foreground italic text-center">Nenhuma {vocabulary.category.toLowerCase()} cadastrada</p>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher">{vocabulary.provider} *</Label>
                    <Select
                      value={newClass.teacherId}
                      onValueChange={(value) => setNewClass({ ...newClass, teacherId: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachersList.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Dia da Semana *</Label>
                    <Select
                      value={newClass.day}
                      onValueChange={(value) => setNewClass({ ...newClass, day: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {dayKeys.map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newClass.time}
                      onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (min)</Label>
                    <Input
                      type="number"
                      value={newClass.duration}
                      onChange={(e) => setNewClass({ ...newClass, duration: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Nível *</Label>
                    <Select
                      value={newClass.level}
                      onValueChange={(value: "beginner" | "intermediate" | "advanced") => setNewClass({ ...newClass, level: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Medium</SelectItem>
                        <SelectItem value="advanced">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {businessModel === 'CREDIT' && (
                    <div className="space-y-2">
                      <Label htmlFor="maxStudents">Máximo de {vocabulary.clients}</Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        value={newClass.maxStudents}
                        onChange={(e) => setNewClass({ ...newClass, maxStudents: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                  )}
                  {businessModel === 'MONETARY' && (
                    <div className="space-y-2">
                      <Label htmlFor="priceCurrency">Preço ({(vocabulary as Record<string, string>).currencySymbol ?? 'R$'})</Label>
                      <Input
                        id="priceCurrency"
                        type="number"
                        step="0.01"
                        value={newClass.price_in_currency}
                        onChange={(e) => setNewClass({ ...newClass, price_in_currency: parseFloat(e.target.value) || 0 })}
                        placeholder="Ex: 99.90"
                        className="bg-background"
                      />
                    </div>
                  )}
                  {businessModel === 'CREDIT' && (
                    <div className="space-y-2">
                      <Label htmlFor="priceCredits">Créditos</Label>
                      <Input
                        id="priceCredits"
                        type="number"
                        value={newClass.price_in_credits}
                        onChange={(e) => setNewClass({ ...newClass, price_in_credits: parseInt(e.target.value) || 0 })}
                        placeholder="Ex: 10"
                        className="bg-background"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.common.cancel}
                </Button>
                <Button type="button" onClick={handleAddClass} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {t.classes.createNew.replace('{service}', vocabulary.service)}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Class Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.common.edit} {vocabulary.service}</DialogTitle>
              <DialogDescription>
                {language === 'pt' ? `Atualize os detalhes da ${vocabulary.service.toLowerCase()}.` : `Update the details of the ${vocabulary.service.toLowerCase()}.`}
              </DialogDescription>
            </DialogHeader>
            {editingClass && (
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome da {vocabulary.service} *</Label>
                  <Input
                    id="edit-name"
                    value={editingClass.name}
                    onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-modality">{vocabulary.category} *</Label>
                    <Select
                      value={editingClass.modality}
                      onValueChange={(value) => setEditingClass({ ...editingClass, modality: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modalitiesList.length > 0 ? (
                          modalitiesList.map((mod) => (
                            <SelectItem key={mod.id} value={mod.name}>{mod.name}</SelectItem>
                          ))
                        ) : (
                          <p className="p-2 text-sm text-muted-foreground italic text-center">Nenhuma {vocabulary.category.toLowerCase()} cadastrada</p>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-day">Dia *</Label>
                    <Select
                      value={editingClass.day}
                      onValueChange={(value) => setEditingClass({ ...editingClass, day: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weekDays.map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-time">Horário *</Label>
                    <Input
                      id="edit-time"
                      type="time"
                      value={editingClass.time}
                      onChange={(e) => setEditingClass({ ...editingClass, time: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-duration">Duração (min)</Label>
                    <Input
                      type="number"
                      value={editingClass.duration}
                      onChange={(e) => setEditingClass({ ...editingClass, duration: Number(e.target.value) })}
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-level">Nível *</Label>
                    <Select
                      value={editingClass.level}
                      onValueChange={(value: "beginner" | "intermediate" | "advanced") => setEditingClass({ ...editingClass, level: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Medium</SelectItem>
                        <SelectItem value="advanced">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {businessModel === 'CREDIT' && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-max">Máximo de {vocabulary.clients}</Label>
                      <Input
                        id="edit-max"
                        type="number"
                        value={editingClass.maxStudents}
                        onChange={(e) => setEditingClass({ ...editingClass, maxStudents: Number(e.target.value) })}
                        className="bg-background"
                      />
                    </div>
                  )}
                </div>
                {businessModel === 'MONETARY' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-priceCurrency">Preço ({(vocabulary as Record<string, string>).currencySymbol ?? 'R$'})</Label>
                    <Input
                      id="edit-priceCurrency"
                      type="number"
                      step="0.01"
                      value={editingClass.price_in_currency}
                      onChange={(e) => setEditingClass({ ...editingClass, price_in_currency: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 99.90"
                      className="bg-background"
                    />
                  </div>
                )}
                {businessModel === 'CREDIT' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-priceCredits">Créditos</Label>
                    <Input
                      id="edit-priceCredits"
                      type="number"
                      value={editingClass.price_in_credits}
                      onChange={(e) => setEditingClass({ ...editingClass, price_in_credits: parseInt(e.target.value) || 0 })}
                      placeholder="Ex: 10"
                      className="bg-background"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="button" onClick={handleEditClass} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {t.common.save}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando {vocabulary.services.toLowerCase()}...</p>
            </div>
          ) : filteredClasses.length > 0 ? (
            filteredClasses
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((classItem) => (
                <Card key={classItem.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline">{classItem.modality}</Badge>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {classItem.level === 'beginner' ? 'Beginner' : classItem.level === 'intermediate' ? 'Medium' : 'Pro'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-card-foreground">{classItem.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(classItem.status, classItem.enrolledStudents, classItem.maxStudents, classItem.isCancelledToday)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/dashboard/aulas/${classItem.id}/chamada`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <UserCheck className="h-4 w-4 mr-2" /> {t.classes.attendance}
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => { setEditingClass(classItem); setIsEditDialogOpen(true); }}>
                            <Edit className="h-4 w-4 mr-2" /> {t.common.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className={classItem.status === 'cancelada' ? 'text-green-600' : 'text-orange-600'}
                            onClick={() => handleDeactivateClass(classItem)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" /> 
                            {classItem.status === 'cancelada' ? t.classes.activate : t.classes.cancelService.replace('{service}', vocabulary.service)}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteClass(classItem)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> 
                            {t.classes.deletePermanent}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      {classItem.teacher}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {classItem.time} - {classItem.endTime} ({classItem.duration}min)
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {classItem.room}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{t.classes.occupancy}</span>
                        <span className="text-sm font-medium text-foreground">
                          {classItem.enrolledStudents}/{classItem.maxStudents} {vocabulary.clients.toLowerCase()}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{
                            width: `${(classItem.enrolledStudents / classItem.maxStudents) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="col-span-full bg-card border-border">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.classes.noneScheduled.replace('{service}', vocabulary.service.toLowerCase()).replace('{day}', t.weekDays[selectedDay as keyof typeof t.weekDays])}</p>
                <Button
                  className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.classes.createNew.replace('{service}', vocabulary.service)}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal Nova ${vocabulary.category} */}
        <Dialog open={isModalityDialogOpen} onOpenChange={setIsModalityDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.classes.newCategory.replace('{category}', vocabulary.category)}</DialogTitle>
              <DialogDescription>
                {language === 'pt' ? `Adicione uma nova ${vocabulary.category.toLowerCase()} ao seu catálogo.` : `Add a new ${vocabulary.category.toLowerCase()} to your catalog.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="modality-name">Nome da {vocabulary.category} *</Label>
                <Input
                  id="modality-name"
                  value={newModality.name}
                  onChange={(e) => setNewModality({ ...newModality, name: e.target.value })}
                  placeholder={`Ex: ${vocabulary.category === 'Área' ? 'Direito Civil' : 'Geral'}`}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modality-desc">Descrição</Label>
                <Input
                  id="modality-desc"
                  value={newModality.description}
                  onChange={(e) => setNewModality({ ...newModality, description: e.target.value })}
                  placeholder="Opcional"
                  className="bg-background"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalityDialogOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="button" onClick={handleAddModality} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {t.classes.newCategory.replace('{category}', vocabulary.category)}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </ModuleGuard>
  )
}
