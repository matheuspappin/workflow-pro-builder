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
  UserPlus,
  Loader2, // Added Loader2 import which was missing in original? No, it was used in handleInviteProfessional
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { getProfessionals, saveProfessional, getClasses, deleteProfessional } from "@/lib/database-utils"
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
// import { useAuth } from "@/components/providers/auth-provider" // Removed
import { useSession } from "@/hooks/use-session" // Added

interface Professional {
  id: number
  uuid?: string
  name: string
  email: string
  phone: string
  specialties: string[]
  perClassRate: number
  bonusPerStudent?: number | string
  bio?: string
  status: "ativo" | "inativo"
  classesThisMonth: number
  rating: number
  hireDate: string
  professional_type: "technician" | "engineer" | "architect" | "other"
}

function ProfessionalsContent() {
  const { vocabulary, t, language } = useVocabulary()
  const { user } = useSession() // Changed from useAuth
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const [isInviteProfessionalDialogOpen, setIsInviteProfessionalDialogOpen] = useState(false)

  const [newProfessional, setNewProfessional] = useState<any>({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    perClassRate: "",
    bonusPerStudent: "0",
    professional_type: "technician",
    bio: ""
  })

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteProfessionalType, setInviteProfessionalType] = useState<"technician" | "engineer" | "architect" | "other">("technician")
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [agendaModalOpen, setAgendaModalOpen] = useState(false)
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [professionalToDelete, setProfessionalToDelete] = useState<Professional | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [professionalsLimit, setProfessionalsLimit] = useState<number>(10)
  const [modalities, setModalities] = useState<any[]>([])
  
  const [professionalFinances, setProfessionalFinances] = useState({
    classesThisMonth: 0,
    totalDue: 0,
    paymentHistory: [] as any[]
  })
  const [loadingFinances, setLoadingFinances] = useState(false)

  useEffect(() => {
    if (!dataLoaded) {
      loadProfessionals()
      loadClasses()
      loadProfessionalsLimit()
      loadModalities()
    }
  }, [dataLoaded])

  const loadModalities = async () => {
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) return
      const storedUser = JSON.parse(userStr)
      const studioId = storedUser.studio_id || storedUser.studioId

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

  const loadProfessionalsLimit = async () => {
    try {
      const res = await fetch('/api/studio/professionals-tier', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setProfessionalsLimit(data.limit ?? 10)
      }
    } catch (e) {
      console.error('Erro ao carregar limite de profissionais:', e)
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

  const loadProfessionals = async (forceReload = false) => {
    try {
      const cacheKey = 'danceflow_professionals_cache'
      const cachedData = localStorage.getItem(cacheKey)

      if (cachedData && !forceReload) {
        const { data, timestamp } = JSON.parse(cachedData)
        const cacheAge = Date.now() - timestamp

        if (cacheAge < 5 * 60 * 1000) {
          console.log('📦 Usando dados em cache dos profissionais')
          setProfessionals(data)
          setDataLoaded(true)
          setLoading(false)
          return
        }
      }

      setLoading(true)
      const result = await getProfessionals({
        status: statusFilter !== "all" ? statusFilter : undefined
      })

      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: allSessions } = await supabase
        .from('sessions')
        .select('actual_professional_id')
        .gte('scheduled_date', firstDayOfMonth)
        .lte('scheduled_date', lastDayOfMonth)
        .eq('status', 'completed')

      const sessionCounts: Record<string, number> = {}
      allSessions?.forEach(s => {
        if (s.actual_professional_id) {
          sessionCounts[s.actual_professional_id] = (sessionCounts[s.actual_professional_id] || 0) + 1
        }
      })

      const mappedProfessionals: Professional[] = result.map((professional: any, index: number) => {
        const classesCount = sessionCounts[professional.id] || 0
        return {
          id: index + 1,
          uuid: professional.id,
          name: professional.name,
          email: professional.email,
          phone: professional.phone || "",
          specialties: professional.specialties || [],
          perClassRate: professional.hourly_rate || 0,
          bonusPerStudent: professional.bonus_per_student || 0,
          status: professional.status === 'active' ? 'ativo' : 'inativo',
          hireDate: professional.hire_date || new Date().toISOString().split('T')[0],
          classesThisMonth: classesCount,
          rating: 4.5, // Placeholder
          professional_type: professional.professional_type || "technician"
        }
      })

      setProfessionals(mappedProfessionals)
      setDataLoaded(true)

      localStorage.setItem(cacheKey, JSON.stringify({
        data: mappedProfessionals,
        timestamp: Date.now()
      }))

      console.log('💾 Dados dos profissionais salvos no cache')

    } catch (error) {
      console.error('Erro ao carregar profissionais:', error)
      toast({
        title: t.common.error,
        description: t.providers.errorLoading.replace('{providers}', vocabulary.providers.toLowerCase()),
        variant: "destructive",
      })
      setProfessionals([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProfessionals = professionals.filter((professional) => {
    const matchesSearch = professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || professional.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleInviteProfessional = async () => {
    if (!inviteProfessionalType) {
      toast({
        title: t.common.error,
        description: "O tipo de profissional é obrigatório para o convite.",
        variant: "destructive",
      })
      return
    }

    if (!user?.id) {
      toast({
        title: t.common.error,
        description: "Você precisa estar logado para enviar convites.",
        variant: "destructive",
      })
      return
    }

    setIsSendingInvite(true)
    try {
      const userStr = localStorage.getItem('danceflow_user')
      if (!userStr) {
        throw new Error("Dados do usuário não encontrados no localStorage.")
      }
      const storedUser = JSON.parse(userStr)
      const studioId = storedUser.studio_id || storedUser.studioId

      if (!studioId) {
        throw new Error("ID do estúdio não encontrado. Não é possível enviar convite.")
      }

      const response = await fetch('/api/invites/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail || null, // Email opcional para link público
          studioId: studioId,
          professionalType: inviteProfessionalType,
          createdByUserId: user.id,
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({ title: "Sucesso", description: `Link de convite ${inviteEmail ? 'nominal' : 'público'} gerado! Link: ${data.inviteLink}` })
        setInviteEmail("")
        setInviteProfessionalType("technician")
        setIsInviteProfessionalDialogOpen(false)
      } else {
        toast({ title: "Erro", description: data.error || "Erro ao enviar convite", variant: "destructive" })
      }
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error)
      toast({
        title: t.common.error,
        description: error.message || "Falha ao enviar convite. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSendingInvite(false)
    }
  }

  const totalActiveProfessionals = professionals.filter(p => p.status === "ativo").length
  const totalClassesThisMonth = professionals.reduce((acc, p) => acc + (p.classesThisMonth || 0), 0)
  const totalPayment = professionals.reduce((acc, p) => acc + ((p.classesThisMonth || 0) * p.perClassRate), 0)

  const handleEditProfessional = (professional: Professional) => {
    setSelectedProfessional({ ...professional })
    setEditModalOpen(true)
  }

  const handleViewAgenda = (professional: Professional) => {
    setSelectedProfessional(professional)
    setAgendaModalOpen(true)
  }

  const handleViewPayments = (professional: Professional) => {
    setSelectedProfessional(professional)
    setPaymentsModalOpen(true)
    loadProfessionalFinances(professional)
  }

  const loadProfessionalFinances = async (professional: Professional) => {
    if (!professional.uuid) return
    setLoadingFinances(true)
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact' })
        .eq('actual_professional_id', professional.uuid)
        .gte('scheduled_date', firstDayOfMonth)
        .lte('scheduled_date', lastDayOfMonth)
        .eq('status', 'completed')

      const { data: payments, error: paymentsError } = await supabase
        .from('professional_finances')
        .select('*')
        .eq('professional_id', professional.uuid)
        .order('payment_date', { ascending: false })

      const classesCount = sessions?.length || 0
      
      setProfessionalFinances({
        classesThisMonth: classesCount,
        totalDue: classesCount * professional.perClassRate,
        paymentHistory: payments || []
      })
    } catch (e) {
      console.error('Erro ao carregar finanças do profissional:', e)
    } finally {
      setLoadingFinances(false)
    }
  }

  const handleDeactivateProfessional = async (professional: Professional) => {
    try {
      const newStatus = professional.status === "ativo" ? "inactive" : "active"
      const statusLabel = newStatus === "inactive" ? t.providers.deactivate : t.providers.reactivate
      
      await saveProfessional({
        id: professional.uuid,
        status: newStatus
      })

      localStorage.removeItem('danceflow_professionals_cache')
      await loadProfessionals(true)

      toast({
        title: t.providers.statusUpdated.replace('{status}', statusLabel),
        description: t.providers.statusUpdatedDesc
          .replace('{name}', professional.name)
          .replace('{status}', statusLabel.toLowerCase()),
      })
    } catch (error: any) {
      console.error('Erro ao mudar status do profissional:', error)
      toast({
        title: t.common.error,
        description: error.message || t.providers.errorSavingDesc.replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase()),
        variant: "destructive",
      })
    }
  }

  const handleDeleteProfessional = async () => {
    if (!professionalToDelete || !professionalToDelete.uuid) return

    try {
      await deleteProfessional(professionalToDelete.uuid)
      
      localStorage.removeItem('danceflow_professionals_cache')
      await loadProfessionals(true)

      setDeleteConfirmOpen(false)
      setProfessionalToDelete(null)
      toast({
        title: t.providers.deletedSuccess.replace('{provider}', vocabulary.provider),
        description: t.providers.deletedSuccessDesc.replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase()),
      })
    } catch (error: any) {
      console.error('Erro ao excluir profissional:', error)
      toast({
        title: t.providers.errorDeleting,
        description: error.message || t.providers.errorDeletingDesc.replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase()),
        variant: "destructive",
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedProfessional || !selectedProfessional.uuid) return

    try {
      await saveProfessional({
        id: selectedProfessional.uuid,
        name: selectedProfessional.name,
        email: selectedProfessional.email,
        phone: selectedProfessional.phone,
        hourly_rate: selectedProfessional.perClassRate,
        bonus_per_student: selectedProfessional.bonusPerStudent,
        bio: selectedProfessional.bio,
        professional_type: selectedProfessional.professional_type
      })

      localStorage.removeItem('danceflow_professionals_cache')
      await loadProfessionals(true)

      setEditModalOpen(false)
      setSelectedProfessional(null)
      toast({
        title: t.providers.updatedSuccess.replace('{provider}', vocabulary.provider),
        description: t.providers.updatedSuccessDesc.replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase()),
      })
    } catch (error: any) {
      console.error('Erro ao atualizar profissional:', error)
      toast({
        title: t.common.error,
        description: error.message || t.providers.errorSavingDesc.replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase()),
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
                  <p className="text-sm text-muted-foreground">{t.providers.active.replace('{providers}', vocabulary.providers)}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-2xl font-bold ${totalActiveProfessionals >= professionalsLimit ? 'text-destructive' : 'text-card-foreground'}`}>
                      {totalActiveProfessionals}
                    </p>
                    <span className="text-sm text-muted-foreground font-normal">
                      / {professionalsLimit} {vocabulary.providers}
                    </span>
                  </div>
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
                  <p className="text-sm text-muted-foreground">{t.providers.servicesThisMonth.replace('{services}', vocabulary.services)}</p>
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
                  <p className="text-sm text-muted-foreground">{t.providers.totalToPay}</p>
                  <p className="text-2xl font-bold text-card-foreground">{language === 'en' ? '$' : 'R$'} {totalPayment.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}</p>
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
                  <p className="text-sm text-muted-foreground">{t.providers.avgRating}</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {totalActiveProfessionals > 0 
                      ? (professionals.filter(p => p.status === "ativo").reduce((acc, p) => acc + p.rating, 0) / totalActiveProfessionals).toFixed(1)
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
                    placeholder={t.providers.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadProfessionals(true)}
                  disabled={loading}
                  className="whitespace-nowrap"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {loading ? t.providers.updating : t.providers.update}
                </Button>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-background">
                    <SelectValue placeholder={t.common.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.common.all}</SelectItem>
                    <SelectItem value="ativo">{t.common.active}</SelectItem>
                    <SelectItem value="inativo">{t.common.inactive}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isInviteProfessionalDialogOpen} onOpenChange={setIsInviteProfessionalDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    disabled={totalActiveProfessionals >= professionalsLimit}
                  >
                    <UserPlus className="w-4 h-4" />
                    {t.providers.inviteProfessional.replace('{provider}', vocabulary.provider)}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t.providers.inviteProfessionalTitle}</DialogTitle>
                    <DialogDescription>
                      Insira o e-mail para um convite individual ou deixe em branco para gerar um link público (copy and paste).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">{t.providers.email} (Opcional para link público)</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-professional-type">{t.providers.professionalType}</Label>
                      <Select
                        value={inviteProfessionalType}
                        onValueChange={(value: "technician" | "engineer" | "architect" | "other") => setInviteProfessionalType(value)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder={t.common.select} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technician">{t.common.technician}</SelectItem>
                          <SelectItem value="engineer">{t.common.engineer}</SelectItem>
                          <SelectItem value="architect">{t.common.architect}</SelectItem>
                          <SelectItem value="other">{t.common.other}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                    <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsInviteProfessionalDialogOpen(false)}>
                      {t.common.cancel}
                    </Button>
                    <Button type="button" onClick={handleInviteProfessional} disabled={isSendingInvite} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      {isSendingInvite ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (inviteEmail ? t.providers.sendInvite : 'Gerar Link Público')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Professionals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.map((professional) => (
            <Card key={professional.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                      {professional.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-card-foreground">{professional.name}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="text-sm text-muted-foreground">{professional.rating}</span>
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
                      <DropdownMenuItem onClick={() => handleEditProfessional(professional)}>{t.common.edit}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewAgenda(professional)}>{t.providers.viewAgenda}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewPayments(professional)}>{t.providers.paymentHistory}</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-warning"
                        onClick={() => handleDeactivateProfessional(professional)}
                      >
                        {professional.status === "ativo" ? t.providers.deactivate : t.providers.reactivate}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive font-bold" 
                        onClick={() => {
                          setProfessionalToDelete(professional);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t.providers.deletePermanent}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {professional.specialties.map((spec) => (
                    <Badge key={spec} variant="secondary" className="bg-primary/10 text-primary">
                      {spec}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs font-medium text-blue-600 border-blue-200 bg-blue-50">
                    {professional.professional_type === 'engineer' ? t.common.engineer : t.common.technician}
                  </Badge>
                  <Badge variant={professional.status === "ativo" ? "default" : "secondary"} className={professional.status === "ativo" ? "bg-success/20 text-success-foreground" : ""}>
                    {professional.status === "ativo" ? t.common.active : t.common.inactive}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {professional.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {professional.phone}
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{professional.classesThisMonth}</p>
                      <p className="text-xs text-muted-foreground">{vocabulary.services} {t.common.month.toLowerCase()}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{language === 'en' ? '$' : 'R$'} {(professional.classesThisMonth * professional.perClassRate).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">{t.providers.toReceive}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {t.providers.configuration}: <span className="font-medium text-foreground">{language === 'en' ? '$' : 'R$'} {professional.perClassRate} {t.providers.base} + {language === 'en' ? '$' : 'R$'} {professional.bonusPerStudent}/{vocabulary.client.toLowerCase()}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfessionals.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t.providers.noProviderFound.replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase())}</p>
            </CardContent>
          </Card>
        )}

        {/* Modal de Edição */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.providers.editProvider.replace('{provider}', vocabulary.provider)}</DialogTitle>
              <DialogDescription>
                {t.providers.editProviderDesc.replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase())}
              </DialogDescription>
            </DialogHeader>
            {selectedProfessional && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t.common.fullName}</Label>
                  <Input
                    id="edit-name"
                    value={selectedProfessional.name}
                    onChange={(e) => setSelectedProfessional({ ...selectedProfessional, name: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">{t.providers.email}</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedProfessional.email}
                    onChange={(e) => setSelectedProfessional({ ...selectedProfessional, email: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">{t.providers.phone}</Label>
                  <Input
                    id="edit-phone"
                    value={selectedProfessional.phone}
                    onChange={(e) => setSelectedProfessional({ ...selectedProfessional, phone: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-rate">{t.providers.baseRate}</Label>
                    <Input
                      id="edit-rate"
                      type="number"
                      value={selectedProfessional.perClassRate}
                      onChange={(e) => setSelectedProfessional({ ...selectedProfessional, perClassRate: Number(e.target.value) })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bonus">{t.providers.bonusPerStudent}</Label>
                    <Input
                      id="edit-bonus"
                      type="number"
                      value={selectedProfessional.bonusPerStudent}
                      onChange={(e) => setSelectedProfessional({ ...selectedProfessional, bonusPerStudent: Number(e.target.value) })}
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-professional-type">{t.providers.professionalType}</Label>
                  <Select
                    value={selectedProfessional.professional_type}
                    onValueChange={(value: "technician" | "engineer" | "architect" | "other") => setSelectedProfessional({ ...selectedProfessional, professional_type: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder={t.common.select} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technician">{t.common.technician}</SelectItem>
                      <SelectItem value="engineer">{t.common.engineer}</SelectItem>
                      <SelectItem value="architect">{t.common.architect}</SelectItem>
                      <SelectItem value="other">{t.common.other}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="button" onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {t.common.save}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Agenda */}
        <Dialog open={agendaModalOpen} onOpenChange={setAgendaModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.providers.agendaTitle.replace('{name}', selectedProfessional?.name || '')}</DialogTitle>
              <DialogDescription>
                {t.providers.agendaDesc
                  .replace('{services.toLowerCase()}', vocabulary.services.toLowerCase())
                  .replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase())}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedProfessional && (
                <div className="space-y-3">
                  {availableClasses.filter(c => c.professional_id === selectedProfessional.uuid).length > 0 ? (
                    availableClasses
                      .filter(c => c.professional_id === selectedProfessional.uuid)
                      .map((c, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-sm text-gray-600">
                                {c.schedule?.[0]?.day_of_week === 1 ? t.weekDays.monday : 
                                 c.schedule?.[0]?.day_of_week === 2 ? t.weekDays.tuesday :
                                 c.schedule?.[0]?.day_of_week === 3 ? t.weekDays.wednesday :
                                 c.schedule?.[0]?.day_of_week === 4 ? t.weekDays.thursday :
                                 c.schedule?.[0]?.day_of_week === 5 ? t.weekDays.friday : t.weekDays.saturday} - {c.schedule?.[0]?.start_time}
                              </p>
                            </div>
                            <Badge className={c.status === 'active' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {c.status === 'active' ? t.common.active : t.common.inactive}
                            </Badge>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">{t.providers.noClassesFound.replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase())}</p>
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
              <DialogTitle>{t.providers.paymentsTitle.replace('{name}', selectedProfessional?.name || '')}</DialogTitle>
              <DialogDescription>
                {t.providers.paymentsDesc}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedProfessional && (
                <div className="space-y-3">
                  {/* Resumo */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-700">
                        {loadingFinances ? "..." : professionalFinances.classesThisMonth}
                      </p>
                      <p className="text-sm text-blue-600">{vocabulary.services} {t.common.month.toLowerCase()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700">
                        {language === 'en' ? '$' : 'R$'} {loadingFinances ? "..." : professionalFinances.totalDue.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-green-600">{t.providers.dueValue}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-700">
                        {language === 'en' ? '$' : 'R$'} {selectedProfessional.perClassRate.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-purple-600">{t.providers.ratePerService.replace('{service.toLowerCase()}', vocabulary.service.toLowerCase())}</p>
                    </div>
                  </div>

                  {/* Histórico de Pagamentos */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">{t.providers.lastPayments}</h4>
                    {loadingFinances ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        {t.common.loading}
                      </div>
                    ) : professionalFinances.paymentHistory.length > 0 ? (
                      professionalFinances.paymentHistory.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{payment.reference_month}</p>
                            <p className="text-sm text-gray-600">
                              {payment.payment_date ? `${t.common.paid} em ${new Date(payment.payment_date).toLocaleDateString('pt-BR')}` : t.common.pending}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{language === 'en' ? '$' : 'R$'} {Number(payment.amount).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}</p>
                            <Badge className={payment.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                              {payment.status === 'paid' ? t.common.paid : t.common.pending}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{t.providers.noPaymentsRegistered}</p>
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
              <AlertDialogTitle>{t.providers.deleteConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.providers.deleteConfirmDesc
                  .replace('{provider.toLowerCase()}', vocabulary.provider.toLowerCase())
                  .replace('{name}', professionalToDelete?.name || '')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProfessionalToDelete(null)}>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProfessional} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t.providers.confirmDelete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </div>
    </ModuleGuard>
  )
}

export default function ProfessionalsPage() {
  const { vocabulary, t } = useVocabulary()
  // Ensure we don't crash if vocabulary is loading
  if (!vocabulary || !t) return <div className="p-6">Carregando...</div>
  
  return (
    <Suspense fallback={<div className="p-6">{t.common.loading.replace('...', '')} {vocabulary.providers.toLowerCase()}...</div>}>
      <ProfessionalsContent />
    </Suspense>
  )
}
