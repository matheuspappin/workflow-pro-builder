"use client"

import React, { Suspense } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Zap, Eye, EyeOff, Loader2, Check, GraduationCap, User, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { validateCPF, validateCNPJ } from "@/lib/validation-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const benefits = [
  "14 dias de teste grátis (Dono)",
  "Portal exclusivo do Aluno/Professor",
  "Suporte em português",
  "Gestão com IA",
]

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const initialRole = (searchParams.get('role') as any) || 'admin'
  const [role, setRole] = useState<'admin' | 'student' | 'teacher'>(initialRole)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    taxId: "",
    studioName: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    address: "",
  })
  const [taxIdType, setTaxIdType] = useState<'cpf' | 'cnpj'>('cpf')
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)

  const formatTaxId = (value: string, type: 'cpf' | 'cnpj') => {
    const digits = value.replace(/\D/g, "")
    if (type === 'cpf') {
      return digits
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    } else {
      return digits
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$3")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    }
  }

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTaxId(e.target.value, role === 'admin' ? taxIdType : 'cpf')
    setFormData({ ...formData, taxId: formatted })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "")
    let formatted = digits
    if (digits.length <= 11) {
      formatted = digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
    }
    setFormData({ ...formData, phone: formatted })
  }

  const handleSendCode = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, preencha seu e-mail corretamente.",
        variant: "destructive",
      })
      return
    }

    setIsSendingCode(true)
    try {
      const response = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })
      const data = await response.json()

      if (response.ok) {
        setCodeSent(true)
        toast({
          title: "Código enviado!",
          description: "Verifique seu e-mail para ver o código de confirmação.",
        })
      } else {
        toast({
          title: "Erro ao enviar",
          description: data.error || "Não foi possível enviar o código agora.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet.",
        variant: "destructive",
      })
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos.",
        variant: "destructive",
      })
      return
    }

    setIsVerifyingCode(true)
    try {
      const response = await fetch('/api/auth/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode })
      })
      const data = await response.json()

      if (response.ok) {
        setIsEmailVerified(true)
        toast({
          title: "E-mail verificado!",
          description: "Agora você pode concluir seu cadastro.",
        })
      } else {
        toast({
          title: "Código incorreto",
          description: data.error || "Código inválido ou expirado.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet.",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar e-mail verificado
    if (!isEmailVerified) {
      toast({
        title: "E-mail não verificado",
        description: "Por favor, verifique seu e-mail antes de continuar.",
        variant: "destructive",
      })
      return
    }

    // Validar CPF/CNPJ
    const isValidTaxId = role === 'admin' 
      ? (taxIdType === 'cpf' ? validateCPF(formData.taxId) : validateCNPJ(formData.taxId))
      : validateCPF(formData.taxId)

    if (!isValidTaxId) {
      toast({
        title: "Documento inválido",
        description: `Por favor, insira um ${role === 'admin' ? taxIdType.toUpperCase() : 'CPF'} válido.`,
        variant: "destructive",
      })
      return
    }

    // Validar senhas coincidentes
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Os campos de senha e confirmação de senha devem ser iguais.",
        variant: "destructive",
      })
      return
    }

    // Validar força da senha antes de enviar
    const strength = checkPasswordStrength(formData.password)
    if (strength.score < MIN_STRONG_PASSWORD_SCORE) {
      toast({
        title: "Senha muito fraca",
        description: "Por favor, siga os requisitos para criar uma senha segura.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          role,
          taxId: formData.taxId,
          taxIdType: role === 'admin' ? taxIdType : 'cpf'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Conta criada com sucesso!",
          description: role === 'admin' 
            ? `Bem-vindo ao Workflow AI!` 
            : `Bem-vindo, ${formData.name}!`,
        })
        
        // Store user data in localStorage
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        
        // Redirect based on role
        if (role === 'student') router.push("/student")
        else if (role === 'teacher') router.push("/teacher")
        else router.push("/dashboard")
      } else {
        toast({
          title: "Erro no cadastro",
          description: data.error || "Não foi possível criar sua conta agora.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao registrar:', error)
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-accent p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Workflow AI
          </span>
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Seu software, suas regras.
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Crie sua conta e monte o sistema ideal para seu negócio em minutos.
          </p>
          
          <ul className="space-y-3">
            {[
              "14 dias de teste grátis",
              "Feature Builder Exclusivo",
              "Suporte especializado",
              "Tecnologia White-label",
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-3 text-white/90">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-medium"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-white/80 text-sm">
            +500 empresas ativas
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl my-8">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Workflow <span className="text-primary">AI</span>
              </span>
            </Link>
          </div>

          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-card-foreground">Criar Conta</CardTitle>
              <CardDescription>
                Escolha seu perfil e preencha os dados abaixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
              <Select value={role} onValueChange={(value: "admin" | "student" | "teacher") => setRole(value)}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Selecione seu perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Dono de Negócio / Gestor
                    </div>
                  </SelectItem>
                  <SelectItem value="student">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Cliente / Aluno / Paciente
                    </div>
                  </SelectItem>
                  <SelectItem value="teacher">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Profissional / Professor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ex: João Silva Santos"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="taxId" className="flex justify-between">
                      {role === 'admin' ? (
                        <>
                          <span>Documento (CPF ou CNPJ)</span>
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => {
                                setTaxIdType('cpf')
                                setFormData({ ...formData, taxId: "" })
                              }}
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${taxIdType === 'cpf' ? 'bg-primary text-white' : 'bg-muted'}`}
                            >
                              CPF
                            </button>
                            <button 
                              type="button" 
                              onClick={() => {
                                setTaxIdType('cnpj')
                                setFormData({ ...formData, taxId: "" })
                              }}
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${taxIdType === 'cnpj' ? 'bg-primary text-white' : 'bg-muted'}`}
                            >
                              CNPJ
                            </button>
                          </div>
                        </>
                      ) : (
                        <span>CPF</span>
                      )}
                    </Label>
                    <Input
                      id="taxId"
                      type="text"
                      placeholder={role === 'admin' ? (taxIdType === 'cpf' ? "000.000.000-00" : "000.000.000/0000-00") : "000.000.000-00"}
                      value={formData.taxId || ""}
                      onChange={handleTaxIdChange}
                      required
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email || ""}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={isEmailVerified}
                          className="bg-background h-11 pr-10"
                        />
                        {isEmailVerified && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      {!isEmailVerified && (
                        <Button 
                          type="button" 
                          onClick={handleSendCode} 
                          disabled={isSendingCode || !formData.email || !formData.email.includes('@')}
                          variant="outline"
                          className="h-11 border-primary text-primary hover:bg-primary/5"
                        >
                          {isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : (codeSent ? "Reenviar" : "Validar")}
                        </Button>
                      )}
                    </div>
                  </div>

                  {codeSent && !isEmailVerified && (
                    <div className="space-y-2 col-span-1 md:col-span-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="code">Código de Verificação (E-mail)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="code"
                          type="text"
                          placeholder="Digite os 6 dígitos"
                          maxLength={6}
                          value={verificationCode || ""}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                          className="bg-background h-11 flex-1 text-center text-lg tracking-[0.5em] font-bold"
                        />
                        <Button 
                          type="button" 
                          onClick={handleVerifyCode} 
                          disabled={isVerifyingCode || (verificationCode?.length !== 6)}
                          className="h-11 bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isVerifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate || ""}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Rua, número, bairro, cidade - UF"
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input
                      id="phone"
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={formData.phone || ""}
                      onChange={handlePhoneChange}
                      required
                      className="bg-background h-11"
                    />
                  </div>

                  {role === 'admin' && (
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label htmlFor="studioName">Nome da Empresa</Label>
                      <Input
                        id="studioName"
                        type="text"
                        placeholder="Ex: Minha Empresa Ltda"
                        value={formData.studioName || ""}
                        onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                        required={role === 'admin'}
                        className="bg-background h-11"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={formData.password || ""}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={8}
                        className="bg-background pr-10 h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Repita sua senha"
                        value={formData.confirmPassword || ""}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                        className="bg-background pr-10 h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <PasswordStrengthMeter password={formData.password || ""} />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 mt-4 shadow-lg shadow-primary/20 transition-all active:scale-95"
                  disabled={isLoading || !isEmailVerified}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    role === 'admin' ? "Começar Teste Grátis" : "Criar Minha Conta"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Entrar
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6 px-4">
            Ao criar uma conta, você concorda com nossos{" "}
            <Link href="#" className="underline hover:text-foreground">Termos de Serviço</Link>
            {" "}e{" "}
            <Link href="#" className="underline hover:text-foreground">Política de Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
