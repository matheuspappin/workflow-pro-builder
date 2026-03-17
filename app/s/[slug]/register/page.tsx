"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft, Check, ShieldCheck, FireExtinguisher, Mail, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { isLimitReached, PLAN_LIMITS } from "@/lib/plan-limits"

import { cn } from "@/lib/utils"
import { nicheDictionary } from "@/config/niche-dictionary"

import { getPublicStudioBySlug } from "@/lib/actions/studios"

export default function StudioStudentRegister() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') || 'client'
  const router = useRouter()
  const { toast } = useToast()
  const [studio, setStudio] = useState<any>(null)
  const [vocabulary, setVocabulary] = useState<any>(nicheDictionary.pt.dance) // Default fallback
  const [niche, setNiche] = useState<string>('dance')
  const isFire = niche === 'fire_protection' || niche === 'fire-protection'
  const [isLoadingStudio, setIsLoadingStudio] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    taxId: "",
    birthDate: "",
    address: ""
  })
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)

  const handleSendCode = async () => {
    if (!formData.email || !formData.email.includes("@")) {
      toast({ title: "E-mail inválido", description: "Preencha seu e-mail para receber o código.", variant: "destructive" })
      return
    }
    setIsSendingCode(true)
    try {
      const response = await fetch("/api/auth/verify-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })
      const data = await response.json()
      if (response.ok) {
        setCodeSent(true)
        toast({ title: "Código enviado!", description: "Verifique seu e-mail." })
      } else {
        toast({ title: "Erro ao enviar código", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" })
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({ title: "Código inválido", description: "O código deve ter 6 dígitos.", variant: "destructive" })
      return
    }
    setIsVerifyingCode(true)
    try {
      const response = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      })
      const data = await response.json()
      if (response.ok) {
        setIsEmailVerified(true)
        toast({ title: "E-mail verificado!" })
      } else {
        toast({ title: "Código incorreto", description: data.error || "Código inválido ou expirado.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" })
    } finally {
      setIsVerifyingCode(false)
    }
  }

  useEffect(() => {
    async function loadStudio() {
      const { data, error } = await getPublicStudioBySlug(slug as string)

      if (error || !data) {
        toast({ title: "Estabelecimento não encontrado", variant: "destructive" })
        router.push("/login")
        return
      }
      setStudio(data)
      const settings = data.organization_settings?.[0] || data.organization_settings
      if (settings?.vocabulary) {
          setVocabulary(settings.vocabulary)
      }
      if (settings?.niche) {
          setNiche(settings.niche)
      }
      setIsLoadingStudio(false)
    }
    loadStudio()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmailVerified) {
      toast({ title: "E-mail não verificado", description: "Verifique seu e-mail antes de continuar.", variant: "destructive" })
      return
    }

    // Validar força da senha
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
      // 0. Verificar limite do plano do estúdio (Opcional, a API também pode fazer)
      
      // 1. Criar a conta via API de Registro
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          taxId: formData.taxId || '000.000.000-00', // CPF genérico se não fornecido, ou ajustar formulário
          role: roleParam === 'professional' ? 'teacher' : 'student',
          studioName: studio.name, // Necessário para a API se role for admin, mas aqui passamos para contexto
          studioId: studio.id,
          birthDate: formData.birthDate,
          address: formData.address
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro no registro")
      }

      const { user: userData, session } = data

      if (session) {
        // 3. Montar os dados do usuário para o localStorage
        localStorage.setItem("danceflow_user", JSON.stringify(userData))
        
        // Sincronizar sessão no client-side
        await supabase.auth.setSession(session)
        
        toast({
          title: "Conta criada e logada!",
          description: `Bem-vindo ao ${studio.name}!`,
        })
        
        // Pequeno delay apenas para garantir que o Supabase processou a sessão no navegador
        setTimeout(() => {
          router.push(roleParam === 'professional' ? '/teacher' : '/student')
        }, 500)
        return
      }

      // Fallback caso não consiga logar automaticamente (ex: confirmação de email pendente)
      toast({
        title: "Conta criada com sucesso!",
        description: `Bem-vindo ao ${studio.name}. Já pode fazer seu login!`,
      })
      
      router.push(`/s/${studio.slug}/login`)
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível criar sua conta.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingStudio) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className={cn("w-8 h-8 animate-spin", isFire ? "text-red-600" : "text-indigo-600")} />
    </div>
  )

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500", 
      isFire ? "bg-slate-950" : "bg-slate-50 dark:bg-slate-950"
    )}>
      {isFire && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600 rounded-full blur-[128px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600 rounded-full blur-[128px]" />
        </div>
      )}
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          {isFire ? (
            <Link href="/solutions/fire-protection" className="flex items-center justify-center gap-2.5 font-bold text-2xl tracking-tight text-white hover:opacity-80 transition-opacity mb-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg">
                  <FireExtinguisher className="w-5 h-5 fill-current" />
                </div>
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Fire<span className="text-red-500 font-black">Control</span>
              </span>
            </Link>
          ) : (
            <div className={cn(
              "mx-auto w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110",
              "bg-indigo-600 shadow-indigo-200"
            )}>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          )}
          <h1 className={cn("text-2xl font-black tracking-tight", isFire ? "text-white" : "text-slate-900 dark:text-white")}>
            Criar Conta de {
              roleParam === 'professional' ? (isFire ? 'Técnico PPCI' : vocabulary.provider) : 
              roleParam === 'engineer' ? (isFire ? 'Engenheiro PPCI' : 'Engenheiro') :
              roleParam === 'architect' ? (isFire ? 'Arquiteto PPCI' : 'Arquiteto') :
              vocabulary.client
            }
          </h1>
          <p className={cn("text-sm font-bold uppercase tracking-widest", isFire ? "text-red-600" : "text-indigo-600")}>
            {studio.name}
          </p>
        </div>

        <Card className={cn(
          "border-none shadow-xl",
          isFire ? "bg-slate-900/80 backdrop-blur-xl text-white border border-white/5" : "bg-white dark:bg-slate-900"
        )}>
          <CardHeader>
            <CardTitle className={isFire ? "text-white" : ""}>Cadastro</CardTitle>
            <CardDescription className={isFire ? "text-slate-400" : ""}>Junte-se ao nosso {vocabulary.establishment.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={isFire ? "text-slate-300" : ""}>Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={isFire ? "bg-slate-800 border-white/10 text-white focus:border-red-600" : ""}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email" className={cn("flex items-center gap-2", isFire ? "text-slate-300" : "")}>
                  Email
                  {isEmailVerified && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (e.target.value !== formData.email) {
                        setIsEmailVerified(false)
                        setCodeSent(false)
                        setVerificationCode("")
                      }
                    }}
                    required
                    className={cn("flex-1", isFire ? "bg-slate-800 border-white/10 text-white focus:border-red-600" : "")}
                    disabled={codeSent && !isEmailVerified}
                  />
                  {!codeSent ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendCode}
                      disabled={isSendingCode || !formData.email?.includes("@")}
                      className={cn("shrink-0", isFire ? "border-white/10 text-white hover:bg-red-600/20" : "")}
                    >
                      {isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      <span className="ml-1.5 hidden sm:inline">{isSendingCode ? "..." : "Enviar código"}</span>
                    </Button>
                  ) : null}
                </div>
                {codeSent && !isEmailVerified && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="000000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className={cn("w-32 text-center text-lg tracking-[0.5em] font-mono", isFire ? "bg-slate-800 border-white/10 text-white" : "")}
                      />
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleVerifyCode}
                        disabled={isVerifyingCode || verificationCode.length !== 6}
                        className={isFire ? "bg-red-600 hover:bg-red-700" : ""}
                      >
                        {isVerifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendCode()}
                      disabled={isSendingCode}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      {isSendingCode ? "Enviando..." : "Reenviar código"}
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className={isFire ? "text-slate-300" : ""}>Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate || ""}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    required
                    className={isFire ? "bg-slate-800 border-white/10 text-white focus:border-red-600" : ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className={isFire ? "text-slate-300" : ""}>WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className={isFire ? "bg-slate-800 border-white/10 text-white focus:border-red-600" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId" className={isFire ? "text-slate-300" : ""}>CPF</Label>
                  <Input
                    id="taxId"
                    placeholder="000.000.000-00"
                    value={formData.taxId || ""}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    required
                    className={isFire ? "bg-slate-800 border-white/10 text-white focus:border-red-600" : ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className={isFire ? "text-slate-300" : ""}>Endereço Completo</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className={isFire ? "bg-slate-800 border-white/10 text-white focus:border-red-600" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className={isFire ? "text-slate-300" : ""}>Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password || ""}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className={isFire ? "bg-slate-800 border-white/10 text-white focus:border-red-600" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={formData.password || ""} />
              </div>
              <Button 
                className={cn(
                  "w-full h-12 font-bold",
                  isFire ? "bg-red-600 hover:bg-red-700 text-white" : "bg-indigo-600 hover:bg-indigo-700"
                )} 
                disabled={isLoading || !isEmailVerified}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Criar Minha Conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className={cn("text-sm", isFire ? "text-slate-400" : "text-slate-500")}>
                Já tem cadastro?{" "}
                <Link 
                  href={`/s/${studio.slug}/login`} 
                  className={cn("font-bold hover:underline", isFire ? "text-red-600" : "text-indigo-600")}
                >
                  Fazer Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <button 
          onClick={() => router.push(isFire ? "/solutions/fire-protection/login" : "/login")}
          className={cn(
            "w-full text-center text-xs flex items-center justify-center gap-1 transition-colors",
            isFire ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <ArrowLeft className="w-3 h-3" /> {isFire ? "Voltar para FireControl" : "Voltar para login geral"}
        </button>
      </div>
    </div>
  )
}
