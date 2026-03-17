"use client"

import React, { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FireExtinguisher, Shield, Eye, EyeOff, Loader2, Check, ArrowLeft, Package, Minus, Plus, Building2, User, GraduationCap, PencilRuler, DollarSign, Mail, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { validateCPF, validateCNPJ } from "@/lib/validation-utils"
import { supabase } from "@/lib/supabase"
import { getSystemModules } from "@/lib/actions/modules"
import { Switch } from "@/components/ui/switch"
import logger from "@/lib/logger"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { nicheDictionary, NicheType } from "@/config/niche-dictionary"
import { getDefaultModulesForNiche } from "@/config/niche-modules"
import { LanguageSwitcher } from "@/components/common/language-switcher"

const NICHE_ID: NicheType = 'fire_protection'

const benefits = [
  "14 dias de teste grátis (Dono)",
  "Gestão de Selos INMETRO",
  "App para Técnicos de Campo",
  "Portal do Condomínio/Cliente",
  "Relatórios de Validade Automáticos",
]

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const initialStudioId = searchParams.get('studioId') || undefined
  const initialRoleFromUrl = searchParams.get('role') as 'admin' | 'student' | 'teacher' | 'engineer' | 'finance' | null
  const [role, setRole] = useState<'admin' | 'student' | 'teacher' | 'engineer' | 'finance'>(
    (initialStudioId && initialRoleFromUrl === 'finance') ? 'finance' : (initialRoleFromUrl || 'admin')
  )
  const [plan] = useState('custom')
  const [loadingPlans, setLoadingPlans] = useState(true)
  
  const [systemModules, setSystemModules] = useState<any[]>([])
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({})
  const [multiUnitQuantity, setMultiUnitQuantity] = useState(1)
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
    async function loadData() {
      try {
        const [modulesData] = await Promise.all([
          getSystemModules()
        ])

        setSystemModules(modulesData || [])

        // Default modules for Fire Protection
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
          const price = Number(mod.price)
          if (mod.id === 'multi_unit') return acc + (price * multiUnitQuantity)
          return acc + price
        }
        return acc
      }, 0)
      setCustomTotal(total)
    }
  }, [selectedModules, plan, systemModules, multiUnitQuantity])

  const formatTaxId = (value: string, type: 'cpf' | 'cnpj') => {
    const digits = value.replace(/\D/g, "")
    if (type === 'cpf') {
      return digits.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    } else {
      return digits.slice(0, 14).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$3").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    }
  }

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const docType = (role === 'admin') ? taxIdType : 'cpf'
    setFormData({ ...formData, taxId: formatTaxId(e.target.value, docType) })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "")
    let formatted = digits
    if (digits.length <= 11) {
      formatted = digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
    }
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
      toast({ title: "Documento inválido", description: `Por favor, insira um ${role === 'admin' ? taxIdType.toUpperCase() : 'CPF'} válido.`, variant: "destructive" })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Senhas não coincidem", description: "Os campos de senha e confirmação devem ser iguais.", variant: "destructive" })
      return
    }

    const strength = checkPasswordStrength(formData.password)
    if (strength.score < MIN_STRONG_PASSWORD_SCORE) {
      toast({ title: "Senha muito fraca", description: "Por favor, siga os requisitos para criar uma senha segura.", variant: "destructive" })
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
          businessModel: 'MONETARY',
          plan: role === 'admin' ? plan : undefined,
          taxId: formData.taxId,
          taxIdType: (role === 'admin') ? taxIdType : 'cpf',
          modules: (role === 'admin' && plan === 'custom') ? Object.keys(selectedModules).filter(k => selectedModules[k]) : undefined,
          multiUnitQuantity: (role === 'admin' && plan === 'custom' && selectedModules['multi_unit']) ? multiUnitQuantity : 1,
          language: 'pt'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo ao FireControl! Seu teste grátis começou.",
        })
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        if (data.session) {
          await supabase.auth.setSession(data.session)
        }
        await new Promise(resolve => setTimeout(resolve, 400))
        if (role === 'student') router.push("/solutions/fire-protection/client")
        else if (role === 'teacher') router.push("/solutions/fire-protection/technician")
        else if (role === 'engineer') router.push("/solutions/fire-protection/engineer")
        else if (role === 'finance') router.push("/solutions/fire-protection/dashboard")
        else router.push("/solutions/fire-protection/dashboard")
      } else {
        toast({ title: "Erro no cadastro", description: data.error || "Não foi possível criar sua conta agora.", variant: "destructive" })
      }
    } catch (error) {
      console.error('Erro ao registrar:', error)
      toast({ title: "Erro de conexão", description: "Verifique sua internet e tente novamente.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex relative font-sans">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <Link href="/solutions/fire-protection" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-700 via-red-600 to-orange-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
           <motion.div 
             animate={{ 
               scale: [1, 1.2, 1],
               rotate: [0, 90, 0],
               opacity: [0.1, 0.2, 0.1] 
             }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute -top-1/4 -left-1/4 w-full h-full border-[100px] border-white/10 rounded-full blur-3xl" 
           />
           <motion.div 
             animate={{ 
               scale: [1, 1.5, 1],
               x: [0, 50, 0],
               y: [0, -50, 0],
               opacity: [0.05, 0.15, 0.05] 
             }}
             transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
             className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-white/10 rounded-full blur-[120px]" 
           />
           
           {/* Floating Icons Particles */}
           {[...Array(6)].map((_, i) => (
             <motion.div
               key={i}
               initial={{ 
                 x: Math.random() * 800, 
                 y: Math.random() * 1000, 
                 opacity: 0,
                 scale: 0.5 
               }}
               animate={{ 
                 y: [null, -100],
                 opacity: [0, 0.3, 0],
                 scale: [0.5, 1, 0.5],
                 rotate: [0, 180]
               }}
               transition={{ 
                 duration: 10 + Math.random() * 10, 
                 repeat: Infinity, 
                 delay: Math.random() * 5 
               }}
               className="absolute text-white/20"
             >
               {i % 2 === 0 ? <FireExtinguisher className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
             </motion.div>
           ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link href="/solutions/fire-protection" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-2xl group-hover:shadow-white/20 transition-all"
            >
              <FireExtinguisher className="w-6 h-6 text-red-600" />
            </motion.div>
            <span className="text-2xl font-black text-white tracking-tighter">
              Fire<span className="text-red-200">Control</span>
            </span>
          </Link>
        </motion.div>

        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl font-black text-white mb-10 leading-[0.9] tracking-tighter"
          >
            Pronto para <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-white animate-gradient-x">
              Modernizar
            </span> <br />
            sua empresa?
          </motion.h1>
          
          <ul className="space-y-6">
            {benefits.map((benefit, index) => (
              <motion.li 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ x: 10, transition: { duration: 0.2 } }}
                className="flex items-center gap-4 text-white/90 group cursor-default"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg group-hover:bg-white group-hover:text-red-600 transition-all duration-300">
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight group-hover:text-white transition-colors">{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="bg-black/20 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 relative group overflow-hidden"
        >
           {/* Box Glow */}
           <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-white/5 to-red-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
           
           <div className="flex items-center gap-4 mb-6">
              <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                   <motion.div 
                     key={i} 
                     whileHover={{ y: -5, zIndex: 10 }}
                     className="w-10 h-10 rounded-full bg-slate-800 border-2 border-red-500 flex items-center justify-center text-xs font-black shadow-xl"
                   >
                     U{i}
                   </motion.div>
                 ))}
              </div>
              <div className="h-px flex-1 bg-white/10" />
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Líder no mercado</p>
           </div>
           
           <div className="relative">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1.5 }}
               className="absolute -top-4 -left-4 text-white/20"
             >
               <span className="text-6xl font-serif">"</span>
             </motion.div>
             <p className="text-sm text-white/80 leading-relaxed font-medium pl-2">
               O <span className="text-white font-bold">FireControl</span> reduziu nosso tempo de vistoria em 40% e eliminou completamente os erros humanos na gestão de validade de carga.
             </p>
           </div>
           
           <div className="mt-4 flex items-center gap-2">
             <div className="flex gap-0.5">
               {[1,2,3,4,5].map(i => <span key={i} className="text-xs">⭐</span>)}
             </div>
             <span className="text-[10px] font-bold text-white/40 uppercase">Avaliação 4.9/5</span>
           </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto bg-slate-950">
        <div className="w-full max-w-xl my-8 md:my-12">
          <Card className="text-card-foreground flex flex-col gap-6 rounded-2xl border border-white/10 py-6 px-6 md:px-8 bg-slate-900 shadow-2xl shadow-black/50">
            <CardHeader className="text-center pb-0 px-0">
              <CardTitle className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Criar Nova Conta
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium text-sm mt-1">
                Escolha seu perfil e comece agora mesmo
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              {/* Profile selector - grid layout */}
              {(initialStudioId && role === 'finance') ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-600/10 border border-red-500/20 mb-6">
                  <DollarSign className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-300">
                    Financeiro — cadastro via convite da empresa
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                  {[
                    { id: 'admin', label: 'Empresa', icon: Building2, desc: 'Dono/Negócio' },
                    { id: 'teacher', label: 'Técnico', icon: GraduationCap, desc: 'Campo' },
                    { id: 'engineer', label: 'Engenheiro', icon: PencilRuler, desc: 'Projetos' },
                    { id: 'finance', label: 'Financeiro', icon: DollarSign, desc: 'Contas' },
                    { id: 'student', label: 'Cliente', icon: User, desc: 'Condomínio' }
                  ].map((r) => (
                    <motion.button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as any)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 min-h-[88px]",
                        role === r.id 
                          ? "border-red-600 bg-red-600/15 shadow-lg shadow-red-600/20 text-white" 
                          : "border-white/5 bg-slate-800/50 text-slate-500 hover:border-white/15 hover:text-slate-300 hover:bg-slate-800"
                      )}
                    >
                      <r.icon className={cn("w-5 h-5", role === r.id ? "text-red-500" : "text-slate-500")} />
                      <span className="text-xs font-bold uppercase tracking-wider">{r.label}</span>
                      <span className={cn("text-[10px] opacity-70 hidden sm:block", role === r.id ? "text-red-400/80" : "text-slate-500")}>{r.desc}</span>
                    </motion.button>
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
                      className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-red-500/50"
                    />
                  </div>

                  <div className="space-y-2 col-span-full">
                    <Label className="flex justify-between text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                      <span>{role === 'admin' ? 'Documento (CPF/CNPJ)' : 'CPF'}</span>
                      {role === 'admin' && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setTaxIdType('cpf')} className={cn("px-2 py-0.5 rounded text-[9px] font-black", taxIdType === 'cpf' ? "bg-red-600 text-white" : "bg-slate-800 text-slate-500")}>CPF</button>
                          <button type="button" onClick={() => setTaxIdType('cnpj')} className={cn("px-2 py-0.5 rounded text-[9px] font-black", taxIdType === 'cnpj' ? "bg-red-600 text-white" : "bg-slate-800 text-slate-500")}>CNPJ</button>
                        </div>
                      )}
                    </Label>
                    <Input
                      placeholder={role === 'admin' ? (taxIdType === 'cnpj' ? "00.000.000/0001-00" : "000.000.000-00") : "000.000.000-00"}
                      value={formData.taxId}
                      onChange={handleTaxIdChange}
                      required
                      className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-red-500/50"
                    />
                  </div>

                  <div className="space-y-2 col-span-full sm:col-span-1">
                    <Label className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                      E-mail Corporativo
                      {isEmailVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="exemplo@suaempresa.com"
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
                        className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-red-500/50 flex-1"
                        disabled={codeSent && !isEmailVerified}
                      />
                      {!codeSent ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSendCode}
                          disabled={isSendingCode || !formData.email?.includes("@")}
                          className="h-12 shrink-0 border-white/10 text-white hover:bg-red-600/20"
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
                            className="h-12 bg-red-600 hover:bg-red-700"
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
                      className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-red-500/50"
                    />
                  </div>

                  {role === 'admin' && (
                    <div className="space-y-2 col-span-full">
                      <Label className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Nome da Empresa de Extintores</Label>
                      <Input
                        placeholder="Ex: FireControl Soluções"
                        value={formData.studioName}
                        onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                        required
                        className="bg-slate-800/50 border-white/5 text-white h-12 rounded-xl focus:border-red-500/50"
                      />
                    </div>
                  )}

                  {role === 'admin' && (
                    <div className="space-y-4 col-span-full pt-2">
                      {loadingPlans ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                        </div>
                      ) : (
                        <Card className="border-dashed border-2 border-red-500/30 bg-red-500/5">
                          <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {systemModules.map(mod => (
                                <div key={mod.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                   <div className="flex flex-col">
                                      <span className="text-xs font-bold text-white uppercase tracking-tighter">{mod.label}</span>
                                      <span className="text-[9px] text-slate-500">
                                         {Number(mod.price) === 0 ? "Grátis" : `+ R$ ${Number(mod.price)}`}
                                      </span>
                                   </div>
                                   <Switch 
                                     checked={selectedModules[mod.id] || false}
                                     onCheckedChange={(c) => setSelectedModules(prev => ({...prev, [mod.id]: c}))}
                                     disabled={Number(mod.price) === 0 && mod.active}
                                   />
                                </div>
                              ))}
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                               <span className="text-xs font-black text-white uppercase tracking-widest">Total Estimado</span>
                               <span className="text-2xl font-black text-red-500">R$ {customTotal}</span>
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-16 rounded-2xl text-lg shadow-xl shadow-red-600/20 hover:shadow-red-600/40 hover:scale-[1.02] transition-all"
                  disabled={isLoading || !isEmailVerified}
                >
                  {isLoading ? (
                    <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> PROCESSANDO...</>
                  ) : (
                    "FINALIZAR MEU CADASTRO"
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  Já tem uma conta?{" "}
                  <Link href="/solutions/fire-protection/login" className="text-red-500 hover:text-red-400 font-bold underline underline-offset-4">
                    Acesse o Login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-center text-[10px] text-slate-500 mt-8 px-8 leading-relaxed uppercase tracking-widest">
            Ao clicar em finalizar, você concorda com nossos <Link href="#" className="text-slate-300 underline">Termos de Uso</Link> e <Link href="#" className="text-slate-300 underline">Políticas de Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}
