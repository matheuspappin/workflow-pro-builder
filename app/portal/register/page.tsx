"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, GraduationCap, User, ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { validateCPF } from "@/lib/validation-utils"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { OFFICIAL_LOGO } from "@/config/branding"

function PortalRegisterContent() {
  const router = useRouter()
  const { vocabulary, language, t } = useVocabulary()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const initialRole = (searchParams.get('role') as any) === 'professional' ? 'professional' : 'client'
  const [role, setRole] = useState<'client' | 'professional'>(initialRole)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    taxId: "",
    password: "",
    confirmPassword: "",
  })

  const [isEmailVerified, setIsEmailVerified] = useState(false)
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
      toast({ title: language === 'pt' ? "E-mail inválido" : "Invalid email", description: language === 'pt' ? "Preencha seu e-mail para receber o código." : "Fill in your email to receive the code.", variant: "destructive" })
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
        toast({ title: language === 'pt' ? "Código enviado ao seu e-mail!" : "Code sent to your email!" })
      } else {
        toast({ title: language === 'pt' ? "Erro ao enviar código" : "Error sending code", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: t.auth.login.connectionErrorTitle, variant: "destructive" })
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
        toast({ title: language === 'pt' ? "E-mail verificado!" : "Email verified!" })
      } else {
        toast({ title: language === 'pt' ? "Código inválido" : "Invalid code", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: t.auth.login.connectionErrorTitle, variant: "destructive" })
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isEmailVerified) {
      toast({ title: language === 'pt' ? "Verifique seu e-mail primeiro" : "Verify your email first", variant: "destructive" })
      return
    }

    if (!validateCPF(formData.taxId)) {
      toast({ title: language === 'pt' ? "CPF inválido" : "Invalid CPF", variant: "destructive" })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: language === 'pt' ? "Senhas não coincidem" : "Passwords do not match", variant: "destructive" })
      return
    }

    const strength = checkPasswordStrength(formData.password)
    if (strength.score < MIN_STRONG_PASSWORD_SCORE) {
      toast({ title: language === 'pt' ? "Senha muito fraca" : "Password too weak", variant: "destructive" })
      return
    }

    setIsLoading(true)

    try {
      // Simulação de registro - Em um fluxo real, isso enviaria para a API
      // e o usuário ficaria com status 'pending_activation'
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          role,
          portal: 'user',
          language
        })
      })

      if (response.ok) {
        setIsSuccess(true)
      } else {
        const data = await response.json()
        toast({ title: language === 'pt' ? "Erro no cadastro" : "Registration error", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: t.auth.login.connectionErrorTitle, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-border shadow-lg text-center p-8 space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-card-foreground">{language === 'pt' ? "Quase lá!" : "Almost there!"}</h2>
            <p className="text-muted-foreground">
              {language === 'pt' ? "Sua solicitação de cadastro foi recebida com sucesso." : "Your registration request has been successfully received."}
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl text-sm text-foreground font-medium">
            {language === 'pt' ? (
              <>Você receberá um <strong>link de ativação</strong> no seu e-mail assim que seu cadastro for aprovado.</>
            ) : (
              <>You will receive an <strong>activation link</strong> in your email as soon as your registration is approved.</>
            )}
          </div>
          <Link href="/portal/login" className="block">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl">
              {language === 'pt' ? "Voltar para o Login" : "Back to Login"}
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher showIcon />
      </div>
      <div className="w-full max-w-md space-y-8 my-8">
        <div className="text-center space-y-2">
          <Link href="/portal" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden">
              <Image src={OFFICIAL_LOGO} alt="AKAAI" width={24} height={24} className="w-6 h-6 object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">
              AKAAI <span className="text-primary">CORE</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">{language === 'pt' ? "Criar minha conta" : "Create my account"}</h1>
          <p className="text-sm text-muted-foreground">Portal</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="flex bg-muted p-1 rounded-xl w-full">
                <button 
                  type="button"
                  onClick={() => setRole('client')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${role === 'client' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <User className="w-3 h-3" /> {vocabulary.client}
                </button>
                <button 
                  type="button"
                  onClick={() => setRole('professional')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${role === 'professional' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <GraduationCap className="w-3 h-3" /> {vocabulary.provider}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.auth.register.fullName}</Label>
                <Input
                  id="name"
                  placeholder={t.auth.register.fullNamePlaceholder}
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-background h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">{t.auth.register.document}</Label>
                <Input
                  id="taxId"
                  placeholder="000.000.000-00"
                  value={formData.taxId || ""}
                  onChange={(e) => setFormData({ ...formData, taxId: formatCPF(e.target.value) })}
                  required
                  className="bg-background h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  {t.auth.register.emailOrPhone}
                  {isEmailVerified && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.auth.register.emailPlaceholder}
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
                    className="bg-background h-11 flex-1"
                    disabled={codeSent && !isEmailVerified}
                  />
                  {!codeSent ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendCode}
                      disabled={isSendingCode || !formData.email?.includes("@")}
                      className="h-11 shrink-0"
                    >
                      {isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      <span className="ml-1.5 hidden sm:inline">{isSendingCode ? "..." : language === 'pt' ? "Enviar código" : "Send code"}</span>
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
                        className="bg-background h-11 w-32 text-center text-lg tracking-[0.5em] font-mono"
                      />
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleVerifyCode}
                        disabled={isVerifyingCode || verificationCode.length !== 6}
                        className="h-11"
                      >
                        {isVerifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'pt' ? "Verificar" : "Verify")}
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendCode()}
                      disabled={isSendingCode}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      {isSendingCode ? "..." : (language === 'pt' ? "Reenviar código" : "Resend code")}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t.auth.register.phoneWhatsapp}</Label>
                <Input
                  id="phone"
                  placeholder={t.auth.register.phonePlaceholder}
                  value={formData.phone || ""}
                  onChange={handlePhoneChange}
                  required
                  className="bg-background h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t.auth.register.password}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="bg-background h-11 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.auth.register.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword || ""}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="bg-background h-11"
                  />
                </div>
              </div>

              <div className="mt-2">
                <PasswordStrengthMeter password={formData.password || ""} />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl mt-4"
                disabled={isLoading || !isEmailVerified}
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (language === 'pt' ? "Solicitar Cadastro" : "Request Registration")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {language === 'pt' ? "Já tem conta? " : "Already have an account? "}
                <Link href={`/portal/login?${searchParams.get('returnTo') ? `returnTo=${encodeURIComponent(searchParams.get('returnTo') as string)}` : ''}`} className="text-primary font-bold hover:underline">{t.auth.login.submit}</Link>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border text-center">
              <Link href="/portal/affiliate/register" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                {language === 'pt' ? "Quer ser um parceiro? " : "Want to be a partner? "}
                <span className="underline">{language === 'pt' ? "Cadastre-se como afiliado" : "Register as an affiliate"}</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Link href="/portal" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> {language === 'pt' ? "Voltar" : "Back"}
        </Link>
      </div>
    </div>
  )
}

export default function PortalRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <PortalRegisterContent />
    </Suspense>
  )
}
