
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LayoutDashboard as LayoutDashboardIcon, Calendar as CalendarIcon, CreditCard as CreditCardIcon, User as UserIcon, ArrowLeft, Camera, Edit2, Phone, Calendar, MapPin, Shield, Settings, LogOut, ChevronRight, Loader2, FileText } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useVocabulary } from "@/hooks/use-vocabulary"
import { useOrganization } from "@/components/providers/organization-provider"

export default function StudentProfile() {
  const { toast } = useToast()
  const { vocabulary } = useVocabulary()
  const { businessModel, niche } = useOrganization()
  
  // Nichos que usam Ordens de Serviço (OS)
  const isServiceOrderBased = ['auto_detail', 'mechanic', 'tech_repair', 'plumbing', 'electrician', 
    'construction', 'landscaping', 'tailoring', 'cleaning', 'car_wash', 
    'party_venue', 'logistics', 'dentist', 'clinic', 'beauty', 'aesthetics', 
    'spa', 'physio', 'nutrition', 'podiatry', 'tanning', 'vet', 'clinic_vet', 
    'psychology', 'law', 'consulting', 'marketing_agency', 'dev_studio', 
    'interior_design', 'real_estate', 'insurance', 'travel_agency', 'coworking', 
    'tattoo', 'photographer', 'event_planning'].includes(niche)

  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para edição
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [newAddress, setNewAddress] = useState("")
  
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [step, setStep] = useState<'input' | 'verify'>('input')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          window.location.href = "/login"
          return
        }

        // Tentar pegar do localStorage primeiro para velocidade
        const userData = localStorage.getItem("danceflow_user")
        if (userData) {
          setStudent(JSON.parse(userData))
        }

        // Buscar dados atualizados do banco
        const { data: profile, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profile) {
          setStudent(profile)
          // Atualizar localStorage com os dados mais recentes
          localStorage.setItem("danceflow_user", JSON.stringify({
            ...JSON.parse(userData || '{}'),
            ...profile
          }))
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStudentProfile()
  }, [])

  const handleUpdateAddress = async () => {
    if (!newAddress) return
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('students')
        .update({ address: newAddress })
        .eq('id', student.id)
      
      if (error) throw error

      setStudent({ ...student, address: newAddress })
      toast({ title: "Sucesso", description: "Endereço atualizado com sucesso!" })
      setIsEditingAddress(false)
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendPhoneCode = async () => {
    const cleanPhone = newPhone.replace(/\D/g, "")
    if (cleanPhone.length < 10) {
      toast({ title: "Telefone inválido", description: "Insira um número válido com DDD.", variant: "destructive" })
      return
    }

    setIsSendingCode(true)
    try {
      const response = await fetch('/api/auth/verify-phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone, email: student.email })
      })
      
      if (!response.ok) throw new Error("Falha ao enviar código")

      setStep('verify')
      toast({ title: "Código enviado", description: "Verifique seu E-mail." })
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyPhoneCode = async () => {
    if (verificationCode.length !== 6) return
    setIsVerifying(true)
    try {
      const response = await fetch('/api/auth/verify-phone/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone, code: verificationCode })
      })

      if (!response.ok) throw new Error("Código inválido ou expirado")

      // Se verificado, atualizar no banco
      const cleanPhone = newPhone.replace(/\D/g, "")
      const { error } = await supabase
        .from('students')
        .update({ phone: cleanPhone })
        .eq('id', student.id)

      if (error) throw error

      setStudent({ ...student, phone: cleanPhone })
      toast({ title: "Sucesso", description: "Telefone atualizado com sucesso!" })
      setIsEditingPhone(false)
      setStep('input')
      setNewPhone("")
      setVerificationCode("")
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {}
    localStorage.removeItem("danceflow_user")
    window.location.href = "/login"
  }

  if (isLoading) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-50 border-b">
        <div className="container flex h-16 items-center px-4 gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => window.location.href='/student'}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Meu Perfil ({vocabulary.client})</h1>
        </div>
      </div>
      
      <main className="container p-4 space-y-6 max-w-md mx-auto">
        {/* Avatar e Infos Básicas */}
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-white shadow-xl">
              <AvatarImage src={student?.avatar} />
              <AvatarFallback className="text-3xl font-bold bg-indigo-100 text-indigo-600">
                {student?.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button size="icon" className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-md">
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{student?.name}</h2>
            <p className="text-sm text-muted-foreground">{student?.email}</p>
          </div>
        </div>

        {/* Informações Pessoais */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 group">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground uppercase">Telefone</Label>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-6 h-6 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setNewPhone(student?.phone || "")
                    setStep('input')
                    setIsEditingPhone(true)
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{student?.phone || "Não informado"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">Data de Nascimento</Label>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{student?.birth_date ? new Date(student.birth_date).toLocaleDateString('pt-BR') : "Não informada"}</span>
              </div>
            </div>
            <div className="space-y-1 group">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground uppercase">Endereço</Label>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-6 h-6 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setNewAddress(student?.address || "")
                    setIsEditingAddress(true)
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="line-clamp-2">{student?.address || "Não informado"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Segurança e Configurações */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Configurações</h3>
          <Button variant="ghost" className="w-full justify-between bg-white dark:bg-slate-900 h-14 px-4 hover:bg-slate-50 border-none shadow-sm">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-bold">Privacidade e Segurança</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Button>
          <Button variant="ghost" className="w-full justify-between bg-white dark:bg-slate-900 h-14 px-4 hover:bg-slate-50 border-none shadow-sm">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-bold">Preferências do App</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-between bg-white dark:bg-slate-900 h-14 px-4 hover:bg-red-50 text-red-600 border-none shadow-sm"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-bold">Sair da Conta</span>
            </div>
          </Button>
        </div>
      </main>

      {/* Tab Bar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t flex items-center justify-around h-16 px-4 z-50">
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student'}>
          <LayoutDashboardIcon className="w-5 h-5" />
          <span className="text-[10px]">Início</span>
        </Button>
        
        {isServiceOrderBased ? (
          <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/os'}>
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">Minhas OS</span>
          </Button>
        ) : (
          <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/classes'}>
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[10px]">{vocabulary.service}s</span>
          </Button>
        )}

        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/payments'}>
          <CreditCardIcon className="w-5 h-5" />
          <span className="text-[10px]">Pagar</span>
        </Button>
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-primary" onClick={() => window.location.href='/student/profile'}>
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px]">Perfil</span>
        </Button>
      </nav>

      {/* Modal Editar Endereço */}
      <Dialog open={isEditingAddress} onOpenChange={setIsEditingAddress}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Editar Endereço</DialogTitle>
            <DialogDescription>Atualize seu endereço de residência.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="address" className="text-xs font-bold uppercase text-muted-foreground">Endereço Completo</Label>
            <Input 
              id="address"
              placeholder="Rua, número, bairro, cidade - UF"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="mt-2 h-12 bg-slate-50 border-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsEditingAddress(false)} disabled={isUpdating}>Cancelar</Button>
            <Button 
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold" 
              onClick={handleUpdateAddress}
              disabled={isUpdating || !newAddress}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Endereço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Alterar Telefone (2FA) */}
        <Dialog open={isEditingPhone} onOpenChange={(open) => {
        if (!isVerifying && !isSendingCode) {
          setIsEditingPhone(open)
          if (!open) {
            setStep('input')
            setVerificationCode("")
          }
        }
      }}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {step === 'input' ? `Alterar WhatsApp (${vocabulary.client})` : "Verificar Alteração"}
            </DialogTitle>
            <DialogDescription>
              {step === 'input' 
                ? "Informe o novo número. Enviaremos um código de segurança via E-mail." 
                : "Digite o código de 6 dígitos enviado para seu e-mail."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {step === 'input' ? (
              <div className="space-y-2">
                <Label htmlFor="newPhone" className="text-xs font-bold uppercase text-muted-foreground">Novo Número</Label>
                <Input 
                  id="newPhone"
                  placeholder="(00) 00000-0000"
                  value={newPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "")
                    let formatted = digits
                    if (digits.length <= 11) {
                      formatted = digits
                        .replace(/^(\d{2})(\d)/, "($1) $2")
                        .replace(/(\d{5})(\d)/, "$1-$2")
                    }
                    setNewPhone(formatted)
                  }}
                  className="h-12 bg-slate-50 border-none"
                />
              </div>
            ) : (
              <div className="space-y-4 flex flex-col items-center">
                <p className="text-sm font-bold text-indigo-600">{newPhone}</p>
                <Input 
                  id="code"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="h-16 text-center text-2xl tracking-[0.5em] font-black bg-slate-50 border-none w-full max-w-[200px]"
                />
                <Button 
                  variant="link" 
                  className="text-xs text-muted-foreground"
                  onClick={() => setStep('input')}
                  disabled={isVerifying}
                >
                  Número incorreto? Voltar
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsEditingPhone(false)} 
              disabled={isSendingCode || isVerifying}
            >
              Cancelar
            </Button>
            {step === 'input' ? (
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold"
                onClick={handleSendPhoneCode}
                disabled={isSendingCode || newPhone.replace(/\D/g, "").length < 10}
              >
                {isSendingCode ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Enviar Código"}
              </Button>
            ) : (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 font-bold text-white"
                onClick={handleVerifyPhoneCode}
                disabled={isVerifying || verificationCode.length !== 6}
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirmar e Alterar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
