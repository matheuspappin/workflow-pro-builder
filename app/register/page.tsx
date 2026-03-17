"use client"

import React, { Suspense, useEffect } from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Eye, EyeOff, Loader2, Check, GraduationCap, User, Building2, Package, Minus, Plus, Mail, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { validateCPF, validateCNPJ } from "@/lib/validation-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { getDefaultModulesForNiche, monetaryBasedNiches } from "@/config/niche-modules"
import { PROFESSIONAL_TIERS, getTierById } from "@/config/professional-tiers"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { pluralize } from "@/lib/pluralize"
import { OFFICIAL_LOGO } from "@/config/branding"

const benefits = [
  "Teste grátis para começar (Dono)",
  "Portal exclusivo do {client}/{provider}",
  "Suporte em português",
  "Gestão com IA",
]

function RegisterContent() {
  const { t, language } = useVocabulary()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inviteCode = searchParams.get('code') || undefined
  const initialRoleFromUrl = (searchParams.get('role') as any) || 'admin'
  const initialStudioId = searchParams.get('studioId') || undefined
  const [role, setRole] = useState<'admin' | 'student' | 'teacher' | 'finance' | 'seller' | 'receptionist'>(
    inviteCode ? (initialRoleFromUrl === 'teacher' ? 'teacher' : 'student') : initialRoleFromUrl
  )
  const [inviteStudioName, setInviteStudioName] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(!!inviteCode)
  const [niche, setNiche] = useState<NicheType>('dance')
  
  const currentVocabulary = nicheDictionary[language as 'pt' | 'en'][niche] || nicheDictionary[language as 'pt' | 'en'].dance;

  const v = (text: string) => {
    if (!text) return text;
    return text
      .replace(/{clients}/g, pluralize(currentVocabulary.client))
      .replace(/{client}/g, currentVocabulary.client)
      .replace(/{providers}/g, pluralize(currentVocabulary.provider))
      .replace(/{provider}/g, currentVocabulary.provider)
      .replace(/{establishments}/g, pluralize(currentVocabulary.establishment))
      .replace(/{establishment}/g, currentVocabulary.establishment)
      .replace(/{services}/g, pluralize(currentVocabulary.service))
      .replace(/{service}/g, currentVocabulary.service)
      .replace(/{categories}/g, pluralize(currentVocabulary.category))
      .replace(/{category}/g, currentVocabulary.category);
  }
    const [businessModel, setBusinessModel] = useState<'CREDIT' | 'MONETARY'>('CREDIT')

    useEffect(() => {
        // Sugerir modelo de negócio baseado no nicho
        if (niche && (monetaryBasedNiches as string[]).includes(niche)) {
            setBusinessModel('MONETARY')
        } else {
            setBusinessModel('CREDIT')
        }
    }, [niche])
  const [plan] = useState('custom')
  const [loadingPlans, setLoadingPlans] = useState(true)
  
  // Custom Modules State
  const [systemModules, setSystemModules] = useState<any[]>([])
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({})
  const [multiUnitQuantity, setMultiUnitQuantity] = useState(1)
  const [customTotal, setCustomTotal] = useState(0)
  const [professionalsTier, setProfessionalsTier] = useState<string>('1-10')

  useEffect(() => {
    if (!inviteCode) return
    async function resolveInvite() {
      try {
        const roleParam = initialRoleFromUrl === 'teacher' ? 'teacher' : 'student'
        const res = await fetch(`/api/studio/resolve-invite?code=${encodeURIComponent(inviteCode!)}&role=${roleParam}`)
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

        // Apenas plano Personalizado - sem planos genéricos de nicho
        setSystemModules(modulesData || [])

        // Initialize with default niche modules if any, or current selection
        // Use logic from getDefaultModulesForNiche for initial setup based on default niche ('dance')
        // But better to wait for user to select niche or use the default state one.
        const defaultNicheModules = getDefaultModulesForNiche(niche);
        
        // Convert ModuleConfig to Record<string, boolean>
        const initialSelected: Record<string, boolean> = {};
        
        // Merge system modules list with default config
        modulesData?.forEach((m: any) => {
           // If module is recommended by niche, select it.
           // If it's free/base, also select it (dashboard etc).
           // But here we want to follow the niche-modules logic.
           
           if (m.id in defaultNicheModules) {
             initialSelected[m.id] = (defaultNicheModules as any)[m.id];
           } else if (m.active && Number(m.price) === 0) {
             // Free modules default to true if not specified in niche config
             initialSelected[m.id] = true;
           }
        })
        setSelectedModules(initialSelected)

      } catch (err) {
        logger.error('Error loading plans/modules:', err)
        // Keep default plans on error
      } finally {
        setLoadingPlans(false)
      }
    }
    
    loadData()
  }, [t])

  // Effect to update suggested modules when niche changes
  useEffect(() => {
    if (role === 'admin' && niche && systemModules.length > 0) { // Adicionado check para systemModules
      const suggestedModules = getDefaultModulesForNiche(niche);
      
      const nextSelected: Record<string, boolean> = {};

      systemModules.forEach(m => {
        // Se o módulo for ativado por padrão para o nicho, ativá-lo
        if ((suggestedModules as any)[m.id] === true) {
          nextSelected[m.id] = true;
        } else if (Number(m.price) === 0 && m.active) {
          // Módulos gratuitos e ativos devem ser selecionados por padrão, a menos que o nicho os desabilite explicitamente
          // (a lógica getDefaultModulesForNiche já lida com hiddenModules, então se não está em suggestedModules, é falso)
          if (!(m.id in suggestedModules) || (suggestedModules as any)[m.id] !== false) {
             nextSelected[m.id] = true;
          }
        }
      });
      
      setSelectedModules(nextSelected); // Substituir completamente, não mesclar
    }
  }, [niche, role, systemModules]);

  useEffect(() => {
    if (plan === 'custom') {
      const modulesTotal = systemModules.reduce((acc, mod) => {
        if (selectedModules[mod.id]) {
          const price = Number(mod.price)
          if (mod.id === 'multi_unit') {
            return acc + (price * multiUnitQuantity)
          }
          return acc + price
        }
        return acc
      }, 0)
      const tier = getTierById(professionalsTier)
      const tierPrice = role === 'admin' && tier ? tier.price : 0
      setCustomTotal(modulesTotal + tierPrice)
    }
  }, [selectedModules, plan, systemModules, multiUnitQuantity, professionalsTier, role])

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
          studioId: (role === 'finance' || role === 'seller' || role === 'receptionist') ? initialStudioId : undefined,
          niche: role === 'admin' ? niche : undefined,
          businessModel: role === 'admin' ? businessModel : undefined,
          plan: role === 'admin' ? plan : undefined,
          taxId: formData.taxId,
          taxIdType: role === 'admin' ? taxIdType : 'cpf',
          modules: (role === 'admin' && plan === 'custom') ? Object.keys(selectedModules).filter(k => selectedModules[k]) : undefined,
          multiUnitQuantity: (role === 'admin' && plan === 'custom' && selectedModules['multi_unit']) ? multiUnitQuantity : 1,
          professionalsTier: role === 'admin' ? professionalsTier : undefined,
          language
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Vincular ao estabelecimento via código de convite (padrão DanceFlow)
        if (inviteCode && (role === 'student' || role === 'teacher')) {
          try {
            const vincularRes = await fetch('/api/studio/vincular', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ invite_code: inviteCode }),
            })
            if (!vincularRes.ok) {
              const vincularErr = await vincularRes.json().catch(() => ({}))
              logger.warn('Vincular retornou erro:', vincularErr)
            }
          } catch (err) {
            logger.warn('Falha ao vincular ao estabelecimento:', err)
          }
        }

        toast({
          title: "Conta criada com sucesso!",
          description: inviteStudioName ? `Bem-vindo ao ${inviteStudioName}!` : (role === 'admin' ? "Bem-vindo ao Workflow AI! Seu teste grátis de 14 dias começou." : `Bem-vindo, ${formData.name}!`),
        })
        
        // Store user data in localStorage
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        
        // Redirect based on role
        const returnTo = searchParams.get('returnTo')
        const studioSlug = data.user?.studioSlug || data.user?.studio_slug
        if (returnTo) {
          router.push(returnTo)
        } else if (role === 'student') router.push("/student")
        else if (role === 'teacher') router.push("/technician")
        else if (role === 'admin' && studioSlug) router.push(`/s/${studioSlug}`)
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
      {/* Botão de Idioma */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-accent p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden">
            <Image src={OFFICIAL_LOGO} alt="AKAAI" width={24} height={24} className="w-6 h-6 object-contain" />
          </div>
          <span className="text-xl font-bold text-white">
            AKAAI CORE
          </span>
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {v(t.auth.register.brandingTitle)}
          </h1>
          <p className="text-white/80 text-lg mb-8">
            {v(t.auth.register.brandingSubtitle)}
          </p>
          
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3 text-white/90">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                {v(benefit)}
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
            {t.auth.register.activeCompanies}
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl my-8">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden">
                <Image src={OFFICIAL_LOGO} alt="AKAAI" width={24} height={24} className="w-6 h-6 object-contain" />
              </div>
              <span className="text-xl font-bold text-foreground">
                AKAAI <span className="text-primary">CORE</span>
              </span>
            </Link>
          </div>

          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-card-foreground">{v(t.auth.register.title)}</CardTitle>
              <CardDescription>
                {v(t.auth.register.subtitle)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
              {inviteCode ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <Building2 className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    {inviteLoading ? (
                      <span className="text-sm font-medium text-muted-foreground">Verificando convite...</span>
                    ) : inviteStudioName ? (
                      <>
                        <p className="text-sm font-bold text-foreground">Convite de {inviteStudioName}</p>
                        <p className="text-xs text-muted-foreground">Ao criar sua conta, você será vinculado automaticamente.</p>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">Cadastro via código de convite</span>
                    )}
                  </div>
                </div>
              ) : (initialStudioId && (role === 'finance' || role === 'seller' || role === 'receptionist')) ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {role === 'finance' ? 'Financeiro' : role === 'seller' ? 'Vendedor' : 'Recepcionista'} — cadastro via convite
                  </span>
                </div>
              ) : (
                <Select value={role} onValueChange={(value: "admin" | "student" | "teacher") => setRole(value)}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder={t.auth.register.selectProfile} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> {v(t.auth.register.businessOwner)}
                      </div>
                    </SelectItem>
                    <SelectItem value="student">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" /> {v(t.auth.register.clientStudent)}
                      </div>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> {v(t.auth.register.professional)}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="name">{v(t.auth.register.fullName)}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={v(t.auth.register.fullNamePlaceholder)}
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
                          <span>{v(t.auth.register.document)}</span>
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
                    <Label htmlFor="email" className="flex items-center gap-2">
                      {v(t.auth.register.emailOrPhone)}
                      {isEmailVerified && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder={v(t.auth.register.emailPlaceholder)}
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

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">{v(t.auth.register.birthDate)}</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate || ""}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="address">{v(t.auth.register.fullAddress)}</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder={v(t.auth.register.addressPlaceholder)}
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="phone">{v(t.auth.register.phoneWhatsapp)}</Label>
                    <Input
                      id="phone"
                      type="text"
                      placeholder={v(t.auth.register.phonePlaceholder)}
                      value={formData.phone || ""}
                      onChange={handlePhoneChange}
                      required
                      className="bg-background h-11"
                    />
                  </div>

                  {role === 'admin' && (
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label htmlFor="niche">{v(t.auth.register.niche)}</Label>
                      <Select value={niche} onValueChange={(value: NicheType) => setNiche(value)}>
                        <SelectTrigger className="w-full h-11 bg-background">
                          <SelectValue placeholder={v(t.auth.register.nichePlaceholder)} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {Object.entries(nicheDictionary[language as 'pt' | 'en'] || nicheDictionary.pt).map(([key, value]) => (
                            <SelectItem key={key} value={key as NicheType}>
                              {value.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {role === 'admin' && (
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label htmlFor="businessModel">{v(t.auth.register.businessModel)}</Label>
                      <Select value={businessModel} onValueChange={(value: 'CREDIT' | 'MONETARY') => setBusinessModel(value)}>
                        <SelectTrigger className="w-full h-11 bg-background">
                          <SelectValue placeholder={v(t.auth.register.businessModelPlaceholder)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREDIT">
                            <div className="flex flex-col">
                              <span className="font-bold">{v(t.auth.register.businessModelCredit)}</span>
                              <span className="text-[10px] text-muted-foreground">{v(t.auth.register.businessModelCreditDesc)}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="MONETARY">
                            <div className="flex flex-col">
                              <span className="font-bold">{v(t.auth.register.businessModelMonetary)}</span>
                              <span className="text-[10px] text-muted-foreground">{v(t.auth.register.businessModelMonetaryDesc)}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {role === 'admin' && (
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label>{v(t.auth.register.professionalsTier)}</Label>
                      <p className="text-sm text-muted-foreground">{v(t.auth.register.professionalsTierDesc)}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {PROFESSIONAL_TIERS.map((tier) => (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => setProfessionalsTier(tier.id)}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-sm transition-all",
                              professionalsTier === tier.id
                                ? "border-primary bg-primary/10 text-primary-foreground"
                                : "border-border bg-background hover:border-primary/50"
                            )}
                          >
                            <span className="font-medium">{v((t.auth.register as Record<string, string>)[tier.labelKey] || tier.id)}</span>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              R$ {tier.price.toLocaleString('pt-BR')}/mês
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {role === 'admin' && (
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label htmlFor="studioName">{v(t.auth.register.companyName)}</Label>
                      <Input
                        id="studioName"
                        type="text"
                        placeholder={v(t.auth.register.companyNamePlaceholder)}
                        value={formData.studioName || ""}
                        onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                        required={role === 'admin'}
                        className="bg-background h-11"
                      />
                    </div>
                  )}

                  {role === 'admin' && (
                    <div className="space-y-3 col-span-1 md:col-span-2 pt-2">
                      {loadingPlans ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.auth.register.loadingPlans}
                        </div>
                      ) : (
                        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Package className="w-4 h-4 text-primary" />
                                  {t.auth.register.additionalModules}
                                </CardTitle>
                                <CardDescription>{t.auth.register.additionalModulesDesc}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {systemModules.map(mod => {
                                    // Check if this module is recommended for the current niche
                                    const isRecommended = role === 'admin' && niche && (getDefaultModulesForNiche(niche) as any)[mod.id];
                                    
                                    return (
                                    <div key={mod.id} className={cn(
                                      "flex flex-col gap-2 p-3 rounded-lg border bg-background text-sm transition-all",
                                      selectedModules[mod.id] ? "border-primary/50 bg-primary/5" : ""
                                    )}>
                                      <div className="flex items-center justify-between">
                                        <Label htmlFor={mod.id} className="flex-1 cursor-pointer flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{mod.label}</span>
                                            {isRecommended && (
                                              <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                                                RECOMENDADO
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-muted-foreground">
                                            {Number(mod.price) === 0 ? "Grátis" : `+ R$ ${Number(mod.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                          </span>
                                        </Label>
                                        <Switch 
                                          id={mod.id}
                                          checked={selectedModules[mod.id] || false}
                                          onCheckedChange={(checked) => {
                                            if (!checked && isRecommended) {
                                              if (!confirm(`O módulo "${mod.label}" é altamente recomendado para o nicho de ${nicheDictionary.pt[niche]?.name || niche}. Deseja realmente remover?`)) {
                                                return;
                                              }
                                            }
                                            setSelectedModules(prev => ({ ...prev, [mod.id]: checked }))
                                          }}
                                          disabled={Number(mod.price) === 0 && mod.active}
                                        />
                                      </div>
                                      
                                      {mod.id === 'multi_unit' && selectedModules[mod.id] && (
                                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-dashed">
                                          <span className="text-[10px] font-medium text-muted-foreground">{t.auth.register.multiUnitQuantity}</span>
                                          <div className="flex items-center gap-2">
                                            <Button 
                                              type="button" 
                                              variant="outline" 
                                              size="icon" 
                                              className="h-6 w-6 rounded-md"
                                              onClick={() => setMultiUnitQuantity(prev => Math.max(1, prev - 1))}
                                            >
                                              <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-xs font-bold w-4 text-center">{multiUnitQuantity}</span>
                                            <Button 
                                              type="button" 
                                              variant="outline" 
                                              size="icon" 
                                              className="h-6 w-6 rounded-md"
                                              onClick={() => setMultiUnitQuantity(prev => prev + 1)}
                                            >
                                              <Plus className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )})}
                                </div>
                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                  <span className="font-bold text-sm">{t.auth.register.totalMonthly}</span>
                                  <span className="font-bold text-xl text-primary">
                                    R$ {customTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">{t.auth.register.password}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t.auth.register.passwordPlaceholder}
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
                    <Label htmlFor="confirmPassword">{t.auth.register.confirmPassword}</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder={t.auth.register.confirmPasswordPlaceholder}
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
                      {v(t.auth.register.processing)}
                    </>
                  ) : (
                    role === 'admin' 
                      ? v(t.auth.register.submitAdmin)
                      : v(t.auth.register.submitStudent)
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t.auth.register.alreadyHaveAccount}{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    {t.auth.register.login}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6 px-4">
            {t.auth.register.agreeTo
              .split('{terms}')
              .map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part.split('{privacy}').map((subPart, j, subArr) => (
                    <React.Fragment key={j}>
                      {subPart}
                      {j < subArr.length - 1 && (
                        <Link href="#" className="underline hover:text-foreground">
                          {t.auth.register.privacy}
                        </Link>
                      )}
                    </React.Fragment>
                  ))}
                  {i < arr.length - 1 && (
                    <Link href="#" className="underline hover:text-foreground">
                      {t.auth.register.terms}
                    </Link>
                  )}
                </React.Fragment>
              ))}
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
