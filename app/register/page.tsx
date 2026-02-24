"use client"

import React, { Suspense, useEffect } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Zap, Eye, EyeOff, Loader2, Check, GraduationCap, User, Building2, Package, Minus, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { validateCPF, validateCNPJ } from "@/lib/validation-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { getDefaultModulesForNiche, monetaryBasedNiches } from "@/config/niche-modules"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { pluralize } from "@/lib/pluralize"

const defaultPlans = [
  { 
    id: 'gratuito', 
    name: 'Gratuito', 
    price: 'R$ 0', 
    description: 'Para testar e começar', 
    features: ['Até 10 {clients}', '1 {provider}'] 
  },
  { 
    id: 'pro', 
    name: 'Pro', 
    price: 'R$ 297', 
    description: 'Para crescer seu negócio', 
    features: ['Até 100 {clients}', 'WhatsApp Business'] 
  },
  { 
    id: 'pro-plus', 
    name: 'Pro+', 
    price: 'R$ 197', 
    description: 'Melhor custo-benefício', 
    features: ['Ilimitado', 'IA + WhatsApp'] 
  },
  { 
    id: 'enterprise', 
    name: 'Enterprise', 
    price: 'Sob Consulta', 
    description: 'Para grandes redes', 
    features: ['Tudo Ilimitado', 'Multi-unidades'] 
  },
]

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
  const initialRole = (searchParams.get('role') as any) || 'admin'
  const initialStudioId = searchParams.get('studioId') || undefined
  const [role, setRole] = useState<'admin' | 'student' | 'teacher' | 'finance' | 'seller' | 'receptionist'>(initialRole)
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
  const [plan, setPlan] = useState('gratuito')
  const [plans, setPlans] = useState<any[]>(defaultPlans)
  const [loadingPlans, setLoadingPlans] = useState(true)
  
  // Custom Modules State
  const [systemModules, setSystemModules] = useState<any[]>([])
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({})
  const [multiUnitQuantity, setMultiUnitQuantity] = useState(1)
  const [customTotal, setCustomTotal] = useState(0)

  useEffect(() => {
    async function loadData() {
      try {
        const [plansData, modulesData] = await Promise.all([
          supabase
            .from('system_plans')
            .select('*')
            .eq('status', 'active')
            .order('price', { ascending: true }),
          getSystemModules()
        ])
        
        const { data, error } = plansData
        if (error) throw error
        
        let mappedPlans = []
        if (data && data.length > 0) {
          mappedPlans = data.map(p => ({
            id: p.id,
            name: p.name,
            price: p.id === 'enterprise' ? 'Sob Consulta' : `R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
            description: p.description,
            features: p.features || [],
            isPopular: p.is_popular
          }))
        } else {
          mappedPlans = [...defaultPlans]
        }

        // Add Custom Plan Option
        mappedPlans.push({
          id: 'custom',
          name: t.auth.register.customPlanName,
          price: t.auth.register.customPlanPrice,
          description: t.auth.register.customPlanDesc,
          features: [t.auth.register.customPlanFeature1, t.auth.register.customPlanFeature2],
          isPopular: false
        })

        setPlans(mappedPlans)
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
      const total = systemModules.reduce((acc, mod) => {
        if (selectedModules[mod.id]) {
          const price = Number(mod.price)
          if (mod.id === 'multi_unit') {
            return acc + (price * multiUnitQuantity)
          }
          return acc + price
        }
        return acc
      }, 0)
      setCustomTotal(total)
    }
  }, [selectedModules, plan, systemModules, multiUnitQuantity])

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
  const [isEmailVerified, setIsEmailVerified] = useState(true)
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
    
    // Validar e-mail verificado (Desativado para testes)
    /*
    if (!isEmailVerified) {
      toast({
        title: "E-mail não verificado",
        description: "Por favor, verifique seu e-mail antes de continuar.",
        variant: "destructive",
      })
      return
    }
    */

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
          modules: (role === 'admin' && plan === 'custom') ? selectedModules : undefined,
          multiUnitQuantity: (role === 'admin' && plan === 'custom' && selectedModules['multi_unit']) ? multiUnitQuantity : 1,
          language
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Conta criada com sucesso!",
          description: role === 'admin' 
            ? (plan === 'gratuito' ? "Bem-vindo ao Workflow AI!" : "Bem-vindo ao Workflow AI! Seu teste grátis de 14 dias começou.") 
            : `Bem-vindo, ${formData.name}!`,
        })
        
        // Store user data in localStorage
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        
        // Redirect based on role
        const returnTo = searchParams.get('returnTo')
        if (returnTo) {
          router.push(returnTo)
        } else if (role === 'student') router.push("/student")
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
      {/* Botão de Idioma */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

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
              <CardTitle className="text-2xl font-bold text-card-foreground">{v(t.auth.register.title)}</CardTitle>
              <CardDescription>
                {v(t.auth.register.subtitle)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
              {(initialStudioId && (role === 'finance' || role === 'seller' || role === 'receptionist')) ? (
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
                    <Label htmlFor="email">{v(t.auth.register.emailOrPhone)}</Label>
                    <Input
                      id="email"
                      type="text"
                      placeholder={v(t.auth.register.emailPlaceholder)}
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-background h-11"
                    />
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
                      <Label>{v(t.auth.register.choosePlan)}</Label>
                      {loadingPlans ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.auth.register.loadingPlans}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {plans.map((p) => (
                              <div
                                key={p.id}
                                className={cn(
                                  "cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 relative overflow-hidden group",
                                  plan === p.id ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-card hover:bg-accent/5"
                                )}
                                onClick={() => setPlan(p.id)}
                              >
                                {plan === p.id && (
                                  <div className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-bl-lg flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-white" />
                                  </div>
                                )}
                                {p.isPopular && (
                                  <div className="absolute top-0 left-0 bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-br-lg">
                                    POPULAR
                                  </div>
                                )}
                                <div className="flex justify-between items-start mb-2 mt-2">
                                  <span className={cn("font-bold text-sm", plan === p.id ? "text-primary" : "text-foreground")}>{v(p.name)}</span>
                                  <span className="text-[10px] font-bold bg-background px-2 py-1 rounded-full border shadow-sm">{p.price}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mb-3 font-medium leading-tight">{v(p.description)}</p>
                                <ul className="space-y-1">
                                  {p.features.slice(0, 3).map((f: string, i: number) => (
                                    <li key={i} className="text-[10px] flex items-center gap-1.5 text-muted-foreground">
                                      <div className="w-1 h-1 rounded-full bg-primary/50" /> {v(f)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>

                          {plan === 'custom' && (
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
                      ? (plan === 'gratuito' ? v(t.auth.register.submitAdminFree) : v(t.auth.register.submitAdmin))
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
