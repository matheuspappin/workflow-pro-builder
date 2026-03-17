"use client"

import React, { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Shield, Eye, EyeOff, Loader2, Check, ArrowLeft, Building2, User, GraduationCap, DollarSign, Mail, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { validateCPF, validateCNPJ } from "@/lib/validation-utils"
import { supabase } from "@/lib/supabase"
import { getSystemModules } from "@/lib/actions/modules"
import { Switch } from "@/components/ui/switch"
import logger from "@/lib/logger"
import { cn } from "@/lib/utils"
import { nicheDictionary, NicheType } from "@/config/niche-dictionary"
import { getDefaultModulesForNiche } from "@/config/niche-modules"
import { getSessionKey } from "@/lib/constants/storage-keys"

const NICHE_ID: NicheType = 'dance'
const VERTICALIZATION_SLUG = 'estudio-de-danca'
const DANCE_SESSION_KEY = getSessionKey('estudio-de-danca')

const benefits = [
  "14 dias de teste grátis (Estúdio)",
  "Chamada digital e frequência automática",
  "Portal do Responsável / Aluno",
  "Cobranças e mensalidades automáticas",
  "WhatsApp e comunicados automáticos",
]

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const initialStudioId = searchParams.get('studioId') || undefined
  const inviteCode = searchParams.get('code') || undefined
  const initialRoleFromUrl = searchParams.get('role') as 'admin' | 'student' | 'teacher' | 'finance' | null
  const [role, setRole] = useState<'admin' | 'student' | 'teacher' | 'finance'>(
    inviteCode
      ? (initialRoleFromUrl === 'teacher' ? 'teacher' : 'student')
      : ((initialStudioId && initialRoleFromUrl === 'finance') ? 'finance' : (initialRoleFromUrl || 'admin'))
  )
  const [inviteStudioName, setInviteStudioName] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(!!inviteCode)
  const [plan] = useState('custom')
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [systemModules, setSystemModules] = useState<any[]>([])
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({})
  const [customTotal, setCustomTotal] = useState(0)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    taxId: "",
    studioName: "",
    password: "",
    confirmPassword: "",
  })
  const [taxIdType, setTaxIdType] = useState<'cpf' | 'cnpj'>('cnpj')
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
    if (!inviteCode) return
    async function resolveInvite() {
      try {
        const roleParam = initialRoleFromUrl === 'teacher' ? 'teacher' : 'student'
        const res = await fetch(`/api/dance-studio/matricula?code=${inviteCode}&role=${roleParam}`)
        if (res.ok) {
          const data = await res.json()
          setInviteStudioName(data.studio_name || null)
        }
      } catch { /* silencioso */ } finally {
        setInviteLoading(false)
      }
    }
    resolveInvite()
  }, [inviteCode, initialRoleFromUrl])

  useEffect(() => {
    async function loadData() {
      try {
        const [modulesData] = await Promise.all([
          getSystemModules()
        ])

        setSystemModules(modulesData || [])

        const suggestedModules = getDefaultModulesForNiche(NICHE_ID)
        const initialSelected: Record<string, boolean> = {}
        modulesData?.forEach((m: any) => {
          if (m.id in suggestedModules) {
            initialSelected[m.id] = (suggestedModules as any)[m.id]
          } else if (m.active && Number(m.price) === 0) {
            initialSelected[m.id] = true
          }
        })
        setSelectedModules(initialSelected)
      } catch (err) {
        logger.error('Error loading plans/modules:', err)
      } finally {
        setLoadingPlans(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (plan === 'custom') {
      const total = systemModules.reduce((acc, mod) => {
        if (selectedModules[mod.id]) {
          return acc + Number(mod.price)
        }
        return acc
      }, 0)
      setCustomTotal(total)
    }
  }, [selectedModules, plan, systemModules])

  const formatTaxId = (value: string, type: 'cpf' | 'cnpj') => {
    const digits = value.replace(/\D/g, "")
    if (type === 'cpf') {
      return digits.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    }
    return digits.slice(0, 14).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$3").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2")
  }

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const docType = (role === 'admin') ? taxIdType : 'cpf'
    setFormData({ ...formData, taxId: formatTaxId(e.target.value, docType) })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "")
    const formatted = digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
    setFormData({ ...formData, phone: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmailVerified) {
      toast({ title: "E-mail não verificado", description: "Verifique seu e-mail antes de continuar.", variant: "destructive" })
      return
    }
    const isValidTaxId = role === 'admin'
      ? (taxIdType === 'cpf' ? validateCPF(formData.taxId) : validateCNPJ(formData.taxId))
      : validateCPF(formData.taxId)

    if (!isValidTaxId) {
      toast({ title: "Documento inválido", description: `Insira um ${role === 'admin' ? taxIdType.toUpperCase() : 'CPF'} válido.`, variant: "destructive" })
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Senhas não coincidem", variant: "destructive" })
      return
    }
    const strength = checkPasswordStrength(formData.password)
    if (strength.score < MIN_STRONG_PASSWORD_SCORE) {
      toast({ title: "Senha muito fraca", description: "Siga os requisitos de senha segura.", variant: "destructive" })
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
          studioId: (role === 'finance' || role === 'student') ? initialStudioId : undefined,
          niche: NICHE_ID,
          businessModel: 'CREDIT',
          plan: role === 'admin' ? plan : undefined,
          taxId: formData.taxId,
          taxIdType: (role === 'admin') ? taxIdType : 'cpf',
          modules: (role === 'admin' && plan === 'custom') ? Object.keys(selectedModules).filter(k => selectedModules[k]) : undefined,
          language: 'pt',
          verticalizationSlug: role === 'admin' ? VERTICALIZATION_SLUG : undefined
        })
      })
      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem(DANCE_SESSION_KEY, JSON.stringify(data.user))
        if (data.session) await supabase.auth.setSession(data.session)

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbdb915b-b580-4e5e-9b0e-147b06a71f4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d99f83'},body:JSON.stringify({sessionId:'d99f83',runId:'pre-fix-1',hypothesisId:'H1',location:'app/solutions/estudio-de-danca/register/page.tsx:handleSubmit',message:'After register, before auto-link to studio',data:{inviteCode:inviteCode ?? null,role,hasSession:!!data.session,userId:data.user?.id ?? null},timestamp:Date.now()})}).catch(()=>{})
        // #endregion

        // Auto-vincular ao estúdio se veio de link de convite (aluno ou professor)
        if (inviteCode && (role === 'student' || role === 'teacher') && data.session?.access_token) {
          try {
            const vincularRes = await fetch('/api/dance-studio/vincular', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`,
              },
              body: JSON.stringify({ invite_code: inviteCode }),
            })
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/fbdb915b-b580-4e5e-9b0e-147b06a71f4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d99f83'},body:JSON.stringify({sessionId:'d99f83',runId:'pre-fix-1',hypothesisId:'H2',location:'app/solutions/estudio-de-danca/register/page.tsx:handleSubmit',message:'Result of POST /api/dance-studio/vincular after register',data:{status:vincularRes.status,ok:vincularRes.ok,inviteCode:inviteCode ?? null},timestamp:Date.now()})}).catch(()=>{})
            // #endregion
            if (!vincularRes.ok) {
              const vincularErr = await vincularRes.json().catch(() => ({}))
              logger.warn('Vincular retornou erro:', vincularErr)
            }
          } catch (err) {
            logger.warn('Falha ao vincular ao estúdio:', err)
          }
        }

        toast({ title: "Conta criada com sucesso!", description: inviteStudioName ? `Bem-vindo ao ${inviteStudioName}!` : "Bem-vindo ao DanceFlow!" })
        await new Promise(resolve => setTimeout(resolve, 400))
        if (role === 'student') router.push("/solutions/estudio-de-danca/student")
        else if (role === 'teacher') router.push("/solutions/estudio-de-danca/teacher")
        else router.push("/solutions/estudio-de-danca/dashboard")
      } else {
        toast({ title: "Erro no cadastro", description: data.error || "Não foi possível criar sua conta.", variant: "destructive" })
      }
    } catch (error) {
      console.error('Erro ao registrar:', error)
      toast({ title: "Erro de conexão", description: "Verifique sua internet.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex relative font-sans">
      <Link href="/solutions/estudio-de-danca" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-800 via-violet-700 to-pink-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-full h-full border-[100px] border-white/10 rounded-full blur-3xl"
          />
        </div>

        <Link href="/solutions/estudio-de-danca" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-2xl">
            <Music className="w-6 h-6 text-violet-600" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">
            Dance<span className="text-violet-200">Flow</span>
          </span>
        </Link>

        <div>
          <h1 className="text-6xl font-black text-white mb-10 leading-[0.9] tracking-tighter">
            Pronto para <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-white">
              Modernizar
            </span> <br />
            seu Estúdio?
          </h1>
          <ul className="space-y-6">
            {benefits.map((benefit, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-4 text-white/90"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="bg-black/20 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-violet-500 flex items-center justify-center text-xs font-black text-white">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">+500 Estúdios</p>
          </div>
          <p className="text-sm text-white/80 leading-relaxed font-medium">
            O <span className="text-white font-bold">DanceFlow</span> transformou minha gestão. Antes eu passava horas com planilhas, agora tudo é automático.
          </p>
          <div className="mt-3 flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-xs">⭐</span>)}
          </div>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto bg-slate-950">
        <div className="w-full max-w-xl my-8 md:my-12">
          <Card className="rounded-2xl border border-white/10 py-6 px-6 md:px-8 bg-slate-900 shadow-2xl shadow-black/50">
            <CardHeader className="text-center pb-0 px-0">
              <CardTitle className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Criar Nova Conta
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium text-sm mt-1">
                Escolha seu perfil e comece agora mesmo
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-4">
              {inviteCode ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 mb-6">
                  <Music className="w-5 h-5 text-violet-500 shrink-0" />
                  <div>
                    {inviteLoading ? (
                      <span className="text-sm font-medium text-slate-300">Verificando convite...</span>
                    ) : inviteStudioName ? (
                      <>
                        <p className="text-sm font-bold text-white">Convite de {inviteStudioName}</p>
                        <p className="text-xs text-slate-400">Ao criar sua conta, você será vinculado automaticamente.</p>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-slate-300">Cadastro via link de convite</span>
                    )}
                  </div>
                </div>
              ) : (initialStudioId && role === 'finance') ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 mb-6">
                  <DollarSign className="w-5 h-5 text-violet-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-300">
                    Financeiro — cadastro via convite do estúdio
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {[
                    { id: 'admin', label: 'Estúdio', icon: Building2, desc: 'Dono' },
                    { id: 'teacher', label: 'Professor', icon: GraduationCap, desc: 'Docente' },
                    { id: 'finance', label: 'Financeiro', icon: DollarSign, desc: 'Contas' },
                    { id: 'student', label: 'Aluno', icon: User, desc: 'Responsável' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as any)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 min-h-[88px]",
                        role === r.id
                          ? "border-violet-600 bg-violet-600/15 shadow-lg shadow-violet-600/20 text-white"
                          : "border-white/5 bg-slate-800/50 text-slate-500 hover:border-white/15 hover:text-slate-300"
                      )}
                    >
                      <r.icon className={cn("w-5 h-5", role === r.id ? "text-violet-500" : "text-slate-500")} />
                      <span className="text-xs font-bold uppercase tracking-wider">{r.label}</span>
                      <span className={cn("text-[10px] opacity-70", role === r.id ? "text-violet-400/80" : "text-slate-500")}>{r.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-full">
                    <Label className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Nome Completo</Label>
                    <Input
                      placeholder="Nome do Responsável"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-violet-500/50"
                    />
                  </div>

                  <div className="space-y-2 col-span-full">
                    <Label className="flex justify-between text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                      <span>{role === 'admin' ? 'Documento (CPF/CNPJ)' : 'CPF'}</span>
                      {role === 'admin' && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setTaxIdType('cpf')} className={cn("px-2 py-0.5 rounded text-[9px] font-black", taxIdType === 'cpf' ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-500")}>CPF</button>
                          <button type="button" onClick={() => setTaxIdType('cnpj')} className={cn("px-2 py-0.5 rounded text-[9px] font-black", taxIdType === 'cnpj' ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-500")}>CNPJ</button>
                        </div>
                      )}
                    </Label>
                    <Input
                      placeholder={role === 'admin' ? (taxIdType === 'cnpj' ? "00.000.000/0001-00" : "000.000.000-00") : "000.000.000-00"}
                      value={formData.taxId}
                      onChange={handleTaxIdChange}
                      required
                      className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-violet-500/50"
                    />
                  </div>

                  <div className="space-y-2 col-span-full sm:col-span-1">
                    <Label className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                      E-mail
                      {isEmailVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value })
                          if (e.target.value !== formData.email) {
                            setIsEmailVerified(false)
                            setCodeSent(false)
                            setVerificationCode("")
                          }
                        }}
                        required
                        className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-violet-500/50 flex-1"
                        disabled={codeSent && !isEmailVerified}
                      />
                      {!codeSent ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSendCode}
                          disabled={isSendingCode || !formData.email?.includes("@")}
                          className="h-12 shrink-0 border-white/10 text-white hover:bg-violet-600/20"
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
                            className="bg-slate-800/50 border-white/5 text-white h-12 w-32 text-center text-lg tracking-[0.5em] font-mono rounded-xl"
                          />
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={handleVerifyCode}
                            disabled={isVerifyingCode || verificationCode.length !== 6}
                            className="h-12 bg-violet-600 hover:bg-violet-700"
                          >
                            {isVerifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
                          </Button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendCode()}
                          disabled={isSendingCode}
                          className="text-xs text-slate-500 hover:text-slate-300 underline"
                        >
                          {isSendingCode ? "Enviando..." : "Reenviar código"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 col-span-full sm:col-span-1">
                    <Label className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">WhatsApp</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                      className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-violet-500/50"
                    />
                  </div>

                  {role === 'admin' && (
                    <div className="space-y-2 col-span-full">
                      <Label className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Nome do Estúdio</Label>
                      <Input
                        placeholder="Ex: Studio Ballet Clássico"
                        value={formData.studioName}
                        onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                        required
                        className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-violet-500/50"
                      />
                    </div>
                  )}

                  {role === 'admin' && (
                    <div className="space-y-4 col-span-full pt-2">
                      {loadingPlans ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                        </div>
                      ) : (
                        <Card className="border-dashed border-2 border-violet-500/30 bg-violet-500/5">
                          <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {systemModules.map(mod => (
                                <div key={mod.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white uppercase tracking-tighter">{mod.label}</span>
                                    <span className="text-[9px] text-slate-500">{Number(mod.price) === 0 ? "Grátis" : `+ R$ ${Number(mod.price)}`}</span>
                                  </div>
                                  <Switch
                                    checked={selectedModules[mod.id] || false}
                                    onCheckedChange={(c) => setSelectedModules(prev => ({ ...prev, [mod.id]: c }))}
                                    disabled={Number(mod.price) === 0 && mod.active}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                              <span className="text-xs font-black text-white uppercase tracking-widest">Total Estimado</span>
                              <span className="text-2xl font-black text-violet-500">R$ {customTotal}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 col-span-full sm:col-span-1">
                    <Label className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Criar Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="bg-slate-800/50 border-white/5 text-white h-12 pr-12 rounded-xl"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 col-span-full sm:col-span-1">
                    <Label className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Confirmar Senha</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Repita sua senha"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <PasswordStrengthMeter password={formData.password} />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black h-16 rounded-2xl text-lg shadow-xl shadow-violet-600/20 hover:scale-[1.02] transition-all"
                  disabled={isLoading || !isEmailVerified}
                >
                  {isLoading ? (
                    <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> PROCESSANDO...</>
                  ) : (
                    "CRIAR MINHA CONTA GRÁTIS"
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  Já tem uma conta?{" "}
                  <Link href="/solutions/estudio-de-danca/login" className="text-violet-500 hover:text-violet-400 font-bold underline underline-offset-4">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-[10px] text-slate-500 mt-8 px-8 leading-relaxed uppercase tracking-widest">
            Ao criar sua conta, você concorda com nossos <Link href="#" className="text-slate-300 underline">Termos</Link> e <Link href="#" className="text-slate-300 underline">Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
