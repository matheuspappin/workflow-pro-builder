"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Eye, EyeOff, Loader2, Check, ArrowLeft, Mail, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useOrganization } from "@/components/providers/organization-provider"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { validateCPF } from "@/lib/validation-utils"
import { LanguageSwitcher } from "@/components/common/language-switcher"

function AffiliateRegisterContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { language } = useOrganization()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    taxId: "",
    password: "",
    confirmPassword: "",
  })

  const [isEmailVerified, setIsEmailVerified] = useState(true)
  const [codeSent, setCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
    let formatted = digits
    if (digits.length >= 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}${digits.length > 7 ? '-' + digits.slice(7) : ''}`
    }
    setFormData({ ...formData, phone: formatted })
  }

  const handleSendCode = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast({ title: "E-mail inválido", description: "Preencha seu e-mail para receber o código.", variant: "destructive" })
      return
    }
    setIsSendingCode(true)
    try {
      const response = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })
      if (response.ok) {
        setCodeSent(true)
        toast({ title: "Código enviado ao seu e-mail!" })
      } else {
        toast({ title: "Erro ao enviar código", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Erro de conexão", variant: "destructive" })
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return
    setIsVerifyingCode(true)
    try {
      const response = await fetch('/api/auth/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode })
      })
      if (response.ok) {
        setIsEmailVerified(true)
        toast({ title: "E-mail verificado!" })
      } else {
        toast({ title: "Código inválido", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Erro de conexão", variant: "destructive" })
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar e-mail verificado (Desativado para testes)
    /*
    if (!isEmailVerified) {
      toast({ title: "Verifique seu e-mail primeiro", variant: "destructive" })
      return
    }
    */

    if (!validateCPF(formData.taxId)) {
      toast({ title: "CPF inválido", variant: "destructive" })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Senhas não coincidem", variant: "destructive" })
      return
    }

    const strength = checkPasswordStrength(formData.password)
    if (strength.score < MIN_STRONG_PASSWORD_SCORE) {
      toast({ title: "Senha muito fraca", variant: "destructive" })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          role: 'partner', // Role fixo para afiliados
          portal: 'affiliate',
          language
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Bem-vindo ao Portal de Afiliados!",
        })

        // Salvar dados no localStorage para consistência
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        
        // Se a API retornou uma sessão (auto-login), ativa ela no cliente
        if (data.session) {
          const { supabase } = await import("@/lib/supabase")
          await supabase.auth.setSession(data.session)
          
          // Redireciona diretamente para o dashboard
          router.push("/portal/affiliate/dashboard")
        } else {
          // Fallback se o auto-login falhar: manda para o login com mensagem
          toast({
            title: "Conta criada!",
            description: "Agora você pode entrar com seu e-mail e senha.",
          })
          router.push("/portal/affiliate/login")
        }
      } else {
        const data = await response.json()
        toast({ title: "Erro no cadastro", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Erro de conexão", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md space-y-8 my-8">
        <div className="text-center space-y-2">
          <Link href="/portal/affiliate/login" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter">
              <span className="text-indigo-600">Portal Afiliado</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold">Cadastro de Parceiro</h1>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader className="pb-4">
             <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold">
                    <Briefcase className="w-4 h-4" /> Cadastro de Afiliado
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome ou nome da empresa"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">CPF / CNPJ</Label>
                <Input
                  id="taxId"
                  placeholder="000.000.000-00"
                  value={formData.taxId || ""}
                  onChange={(e) => setFormData({ ...formData, taxId: formatCPF(e.target.value) })}
                  required
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail ou Telefone Profissional</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="seu@email.com"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-slate-50 dark:bg-slate-900 h-12"
                />
              </div>

                {/* Código de verificação removido para testes */}

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone || ""}
                  onChange={handlePhoneChange}
                  required
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="bg-slate-50 dark:bg-slate-900 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword || ""}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="mt-2">
                <PasswordStrengthMeter password={formData.password || ""} />
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 rounded-xl mt-4"
                disabled={isLoading || !isEmailVerified}
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Criar Conta de Afiliado"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Já é afiliado? <Link href="/portal/affiliate/login" className="text-indigo-600 font-bold hover:underline">Acessar Painel</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <Link href="/portal/login" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Ir para Portal de Clientes/Profissionais
        </Link>
      </div>
    </div>
  )
}

export default function AffiliateRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <AffiliateRegisterContent />
    </Suspense>
  )
}
