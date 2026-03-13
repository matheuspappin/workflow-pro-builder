"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  User,
  Building,
  Bell,
  Shield,
  CreditCard,
  Palette,
  MessageSquare,
  Save,
  Loader2,
  Bot,
  Sparkles,
  TestTube,
  CheckCircle,
  XCircle,
  Lock,
  Settings,
  Link,
  Unlink,
  Phone,
  Zap,
  Database,
  RefreshCw,
  Download,
  FileText,
  Clock,
  Trophy,
  Layers,
  Plus,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { useOrganization } from "@/components/providers/organization-provider"
import { validateApiKey } from "@/lib/api-config"
import { updateStudioSetting } from "@/lib/database-utils"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { PLAN_LIMITS, normalizePlanForDisplay } from "@/lib/plan-limits"
import { supabase } from "@/lib/supabase"
import { PROFESSIONAL_TIERS } from "@/config/professional-tiers"

import { EcosystemSettings } from "@/components/dashboard/settings/ecosystem-settings"
import { GamificationSettings } from "@/components/dashboard/settings/gamification-settings"

interface StudioSettings {
  id?: string
  name: string
  email: string
  phone: string
  address: string
  cnpj: string
}

interface UserSettings {
  name: string
  email: string
  role: string
}

interface NotificationSettings {
  emailNotifications: boolean
  whatsappNotifications: boolean
  evasionAlerts: boolean
  paymentReminders: boolean
  classReminders: boolean
}

function SettingsContent() {
  const { toast } = useToast()
  const { vocabulary, language } = useVocabulary()
  const { t: globalT, enabledModules, studioId, studios, switchStudio } = useOrganization()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "perfil"
  const [activeTab, setActiveTab] = useState(initialTab)

  const TRANSLATIONS = {
    pt: {
      profile: "Perfil",
      studio: "Estúdio",
      notifications: "Notificações",
      integrations: "Integrações",
      appearance: "Aparência",
      billing: "Faturamento",
      ecosystem: "Ecossistema",
      reports: "Relatórios",
      save: "Salvar Alterações",
      saving: "Salvando...",
      personalInfo: "Informações Pessoais",
      personalInfoDesc: "Gerencie suas informações de acesso e perfil",
      name: "Nome",
      email: "E-mail",
      role: "Cargo",
      changePassword: "Alterar Senha",
      changePasswordDesc: "Mantenha sua conta segura com uma senha forte",
      currentPassword: "Senha Atual",
      newPassword: "Nova Senha",
      confirmPassword: "Confirmar Nova Senha",
      studioInfo: "Informações do Estúdio",
      studioInfoDesc: "Dados públicos e administrativos da sua empresa",
      phone: "Telefone",
      address: "Endereço",
      cnpj: "CNPJ",
      planAndUsage: "Plano e Uso",
      planAndUsageDesc: "Gerencie sua assinatura e acompanhe os limites do sistema",
      currentPlan: "Plano Atual",
      changePlan: "Alterar Plano",
      billingHistory: "Histórico de Faturamento",
      invoices: "Faturas",
      language: "Idioma",
      theme: "Tema",
      dark: "Escuro",
      light: "Claro",
      system: "Sistema",
      settings: {
        creditsSessions: "Créditos / Sessões",
        units: "Unidades",
        saveSuccess: "Configurações do {establishment} salvas com sucesso!",
        studioSettingsSaved: "Configurações do estúdio salvas.",
        studioData: "Dados do Estúdio",
        classReminders: "Lembretes de Aulas",
        classRemindersDescription: "Envie lembretes automáticos para seus alunos sobre {service}.",
        supabaseDatabase: "Banco de Dados Supabase",
        otherIntegrations: "Outras Integrações",
        otherIntegrationsDescription: "Conecte-se com outras ferramentas para expandir seu negócio.",
        upgradeToPro: "Upgrade para Pro",
        changePlan: "Alterar Plano",
        chooseNewPlan: "Escolha seu Novo Plano",
        planSelectionDescription: "Selecione o plano ideal para o seu {establishment}.",
        currentPlan: "Plano Atual",
        professionalsTier: "Faixa de {providers}",
        professionalsTierDesc: "Quantidade máxima de {providers} permitidos no seu estabelecimento.",
        tier_1_10: "1–10 {providers}",
        tier_11_20: "11–20 {providers}",
        tier_21_50: "21–50 {providers}"
      }
    },
    en: {
      profile: "Profile",
      studio: "Studio",
      notifications: "Notifications",
      integrations: "Integrations",
      appearance: "Appearance",
      billing: "Billing",
      ecosystem: "Ecosystem",
      reports: "Reports",
      save: "Save Changes",
      saving: "Saving...",
      personalInfo: "Personal Information",
      personalInfoDesc: "Manage your access and profile information",
      name: "Name",
      email: "Email",
      role: "Role",
      changePassword: "Change Password",
      changePasswordDesc: "Keep your account secure with a strong password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      studioInfo: "Studio Information",
      studioInfoDesc: "Public and administrative data of your company",
      phone: "Phone",
      address: "Address",
      cnpj: "Tax ID (CNPJ)",
      planAndUsage: "Plan and Usage",
      planAndUsageDesc: "Manage your subscription and track system limits",
      currentPlan: "Current Plan",
      changePlan: "Change Plan",
      billingHistory: "Billing History",
      invoices: "Invoices",
      language: "Language",
      theme: "Theme",
      dark: "Dark",
      light: "Light",
      system: "System",
      settings: {
        creditsSessions: "Credits / Sessions",
        units: "Units",
        saveSuccess: "{establishment} settings saved successfully!",
        studioSettingsSaved: "Studio settings saved.",
        studioData: "Studio Data",
        classReminders: "Class Reminders",
        classRemindersDescription: "Send automatic reminders to your students about {service}.",
        supabaseDatabase: "Supabase Database",
        otherIntegrations: "Other Integrations",
        otherIntegrationsDescription: "Connect with other tools to expand your business.",
        upgradeToPro: "Upgrade to Pro",
        changePlan: "Change Plan",
        chooseNewPlan: "Choose your New Plan",
        planSelectionDescription: "Select the ideal plan for your {establishment}.",
        currentPlan: "Current Plan",
        professionalsTier: "{providers} tier",
        professionalsTierDesc: "Maximum number of {providers} allowed in your establishment.",
        tier_1_10: "1–10 {providers}",
        tier_11_20: "11–20 {providers}",
        tier_21_50: "21–50 {providers}"
      }
    }
  }

  const t = { ...globalT, ...(TRANSLATIONS[language as 'pt' | 'en'] || TRANSLATIONS.pt) }

  const [isLoading, setIsLoading] = useState(false)

  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: "",
    email: "",
    role: "admin",
  })

  const [studioSettings, setStudioSettings] = useState<StudioSettings>({
    name: "",
    email: "",
    phone: "",
    address: "",
    cnpj: "",
  })

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportContentToView, setReportContentToView] = useState("")

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    whatsappNotifications: true,
    evasionAlerts: true,
    paymentReminders: true,
    classReminders: true,
  })

  const [appearance, setAppearance] = useState({
    theme: "light",
    language: "pt-BR",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [apiSettings, setApiSettings] = useState({
    openaiApiKey: "",
    geminiApiKey: "",
  })

  const [supabaseSettings, setSupabaseSettings] = useState({
    url: "",
    anonKey: "",
  })

  const [integrationSettings, setIntegrationSettings] = useState({
    whatsapp: {
      apiKey: "",
      instanceId: "",
      apiUrl: "",
    },
    payment: {
      gateway: "",
      apiKey: "",
      secretKey: "",
      webhookUrl: "",
    },
  })

  const [apiStatus, setApiStatus] = useState({
    openai: null as "testing" | "success" | "error" | null,
    gemini: null as "testing" | "success" | "error" | null,
  })

  const [supabaseStatus, setSupabaseStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected")

  const [integrationStatus, setIntegrationStatus] = useState({
    whatsapp: "disconnected" as "connected" | "connecting" | "disconnected" | "error",
    payment: "disconnected" as "connected" | "connecting" | "disconnected" | "error",
  })

  const [expandedApi, setExpandedApi] = useState<"openai" | "gemini" | null>(null)
  const [expandedIntegration, setExpandedIntegration] = useState<"whatsapp" | "payment" | "supabase" | null>(null)

  const [geminiModels, setGeminiModels] = useState<any[]>([])
  const [selectedGeminiModel, setSelectedGeminiModel] = useState<string>("gemini-2.5-pro")
  const [loadingModels, setLoadingModels] = useState(false)

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [selectedNewPlan, setSelectedNewPlan] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [systemPlans, setSystemPlans] = useState<any[]>([])
  const [loadingSystemPlans, setLoadingSystemPlans] = useState(false)

  const [usage, setUsage] = useState({
    students: 0,
    teachers: 0,
    plan: "gratuito"
  })
  const [usageLoaded, setUsageLoaded] = useState(false)

  const [professionalsTier, setProfessionalsTier] = useState<{
    tierId: string
    limit: number
    currentCount: number
    tiers: typeof PROFESSIONAL_TIERS
  } | null>(null)
  const [professionalsTierLoading, setProfessionalsTierLoading] = useState(false)
  const [professionalsTierSaving, setProfessionalsTierSaving] = useState(false)

  const [invoices, setInvoices] = useState<any[]>([])
  const [creditPackages, setCreditPackages] = useState<any[]>([])
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [integratedWhatsApp, setIntegratedWhatsApp] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  useEffect(() => {
    loadSystemPlans()
    const userData = localStorage.getItem("danceflow_user")
    if (userData) {
      const user = JSON.parse(userData)
      const sId = user.studio_id || user.studioId
      
      setUserSettings({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "admin",
      })
      setStudioSettings({
        id: sId,
        name: user.studioName || "",
        email: user.email || "",
        phone: "",
        address: "",
        cnpj: "",
      })

      // Carregar uso real
      if (sId) {
        loadUsage(sId)
        loadInvoices(sId)
        loadCreditPackages(sId)
        loadReports(sId)
        loadStudioDetails(sId)
        loadProfessionalsTier()
      } else {
        setUsageLoaded(true)
      }
    }

    // Verificar se voltou de um pagamento bem-sucedido
    const success = searchParams.get("success")
    const sessionId = searchParams.get("session_id")
    if (success === "true" && sessionId) {
      verifyPayment(sessionId)
    }

    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }

    // Load integration settings
    const loadIntegrations = async () => {
      const userData = localStorage.getItem("danceflow_user")
      if (!userData) return
      const user = JSON.parse(userData)
      const studioId = user.studio_id || user.studioId

      // Buscar chaves do WhatsApp no banco
      const { data: keys } = await supabase
        .from('studio_api_keys')
        .select('*')
        .eq('studio_id', studioId)
        .eq('service_name', 'whatsapp')
        .maybeSingle()

      if (keys) {
        setIntegrationSettings(prev => ({
          ...prev,
          whatsapp: {
            apiKey: keys.api_key || "",
            instanceId: keys.instance_id || "",
            apiUrl: keys.settings?.api_url || ""
          }
        }))
        setIntegrationStatus(prev => ({
          ...prev,
          whatsapp: keys.status === 'active' ? "connected" : "disconnected"
        }))
      }
    }

    loadIntegrations()

    // Load Supabase settings
    const supabaseData = localStorage.getItem("danceflow_supabase")
    if (supabaseData) {
      const supabase = JSON.parse(supabaseData)
      setSupabaseSettings(supabase)
      setSupabaseStatus(supabase.url && supabase.anonKey ? "connected" : "disconnected")
    }
  }, [searchParams])

  const loadReports = async (studioId: string) => {
    setLoadingReports(true)
    try {
      const { data, error } = await supabase
        .from('studio_ai_reports')
        .select('*')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) throw error
      console.log("Relatórios carregados do Supabase:", data); // <--- Adicionar esta linha
      setReports(data || [])
    } catch (e) {
      console.error('Erro ao carregar relatórios:', e)
    } finally {
      setLoadingReports(false)
    }
  }

  const loadProfessionalsTier = async () => {
    setProfessionalsTierLoading(true)
    try {
      const res = await fetch('/api/studio/professionals-tier', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setProfessionalsTier({
          tierId: data.tierId,
          limit: data.limit,
          currentCount: data.currentCount ?? 0,
          tiers: data.tiers || PROFESSIONAL_TIERS,
        })
      }
    } catch (e) {
      console.error('Erro ao carregar faixa de profissionais:', e)
    } finally {
      setProfessionalsTierLoading(false)
    }
  }

  const handleUpdateProfessionalsTier = async (tierId: string) => {
    setProfessionalsTierSaving(true)
    try {
      const res = await fetch('/api/studio/professionals-tier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tierId }),
      })
      if (res.ok) {
        const data = await res.json()
        setProfessionalsTier(prev => prev ? { ...prev, tierId: data.tierId, limit: data.limit } : null)
        toast({ title: t.common.success, description: t.settings.studioSettingsSaved })
      } else {
        const err = await res.json()
        toast({ title: t.common.error, description: err.error || 'Erro ao atualizar', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: t.common.error, description: 'Erro de conexão', variant: 'destructive' })
    } finally {
      setProfessionalsTierSaving(false)
    }
  }

  const loadStudioDetails = async (studioId: string) => {
    try {
      // 1. Buscar dados principais do estúdio
      const { data: studio } = await supabase
        .from('studios')
        .select('*')
        .eq('id', studioId)
        .single()

      if (studio) {
        setStudioSettings(prev => ({
          ...prev,
          name: studio.name || prev.name,
        }))
      }

      // 2. Buscar configurações detalhadas
      const { data: settings } = await supabase
        .from('studio_settings')
        .select('*')
        .eq('studio_id', studioId)

      if (settings) {
        const newSettings: any = {}
        settings.forEach(s => {
          if (s.setting_key === 'address' || s.setting_key === 'studio_address') newSettings.address = s.setting_value
          if (s.setting_key === 'phone' || s.setting_key === 'studio_phone') newSettings.phone = s.setting_value
          if (s.setting_key === 'cnpj' || s.setting_key === 'studio_cnpj') newSettings.cnpj = s.setting_value
          if (s.setting_key === 'email' || s.setting_key === 'studio_email') newSettings.email = s.setting_value
        })
        setStudioSettings(prev => ({ ...prev, ...newSettings }))
      }
    } catch (e) {
      console.error('Erro ao carregar detalhes do estúdio:', e)
    }
  }

  const handleSaveStudioSettings = async () => {
    setIsLoading(true)
    try {
      const userData = JSON.parse(localStorage.getItem("danceflow_user") || "{}")
      const studioId = userData.studio_id || userData.studioId

      // 1. Atualizar nome na tabela studios
      await supabase
        .from('studios')
        .update({ name: studioSettings.name })
        .eq('id', studioId)

      // 2. Atualizar configurações detalhadas (upsert individual para cada chave)
      const settingsToSave = [
        { key: 'address', value: studioSettings.address },
        { key: 'phone', value: studioSettings.phone },
        { key: 'cnpj', value: studioSettings.cnpj },
        { key: 'email', value: studioSettings.email }
      ]

      await Promise.all(settingsToSave.map(s => 
        supabase
          .from('studio_settings')
          .upsert({
            studio_id: studioId,
            setting_key: s.key,
            setting_value: s.value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'studio_id, setting_key' })
      ))

      toast({ title: t.common.success, description: t.settings.saveSuccess.replace('{establishment}', vocabulary.establishment.toLowerCase()) })
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyPayment = async (sessionId: string) => {
    setIsVerifyingPayment(true)
    try {
      const res = await fetch(`/api/admin/checkout/verify?session_id=${sessionId}`)
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Pagamento Confirmado!",
          description: data.message || "Seu plano foi atualizado com sucesso.",
        })
        // Recarregar dados do estúdio
        const userData = localStorage.getItem("danceflow_user")
        if (userData) {
          const user = JSON.parse(userData)
          await loadUsage(user.studio_id || user.studioId)
        }
        // Recarregar página para atualizar todos os dados em cache (org provider, etc)
        window.location.replace("/dashboard/configuracoes?tab=plano")
      } else {
        toast({
          title: "Erro ao sincronizar",
          description: data.error || data.message || "Não foi possível atualizar o plano. Tente clicar em 'Sincronizar Plano' novamente.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Erro ao verificar pagamento:", error)
      toast({
        title: "Erro ao sincronizar",
        description: error?.message || "Não foi possível verificar o pagamento. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  const loadSystemPlans = async () => {
    setLoadingSystemPlans(true)
    try {
      const { data, error } = await supabase
        .from('system_plans')
        .select('*')
        .eq('status', 'active')
        .order('price', { ascending: true })

      if (error) throw error
      setSystemPlans(data || [])
    } catch (e) {
      console.error('Erro ao carregar planos do sistema:', e)
    } finally {
      setLoadingSystemPlans(false)
    }
  }

  const loadUsage = async (studioId: string) => {
    setUsageLoaded(false)
    try {
      const [studentsRes, teachersRes, studioRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('studio_id', studioId),
        supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('studio_id', studioId).eq('status', 'active'),
        supabase.from('studios').select('plan').eq('id', studioId).single()
      ])

      setUsage({
        students: studentsRes.count || 0,
        teachers: teachersRes.count || 0,
        plan: studioRes.data?.plan || "gratuito"
      })
    } catch (e) {
      console.error('Erro ao carregar uso:', e)
    } finally {
      setUsageLoaded(true)
    }
  }

  const loadCreditPackages = async (studioId: string) => {
    setLoadingCredits(true)
    try {
      const { data, error } = await supabase
        .from('lesson_packages')
        .select('*')
        .eq('studio_id', studioId)
        .order('lessons_count', { ascending: true })

      if (error) throw error
      setCreditPackages(data || [])
    } catch (e) {
      console.error('Erro ao carregar pacotes de créditos:', e)
    } finally {
      setLoadingCredits(false)
    }
  }

  const handleSaveCreditPackage = async (pkg: any) => {
    try {
      const userData = localStorage.getItem("danceflow_user")
      if (!userData) return
      const user = JSON.parse(userData)
      const studioId = user.studio_id || user.studioId

      const { error } = await supabase
        .from('lesson_packages')
        .upsert({
          ...pkg,
          studio_id: studioId,
          lessons_count: parseInt(pkg.lessons_count),
          price: parseFloat(pkg.price),
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      toast({ title: "Sucesso!", description: "Pacote de créditos salvo." })
      loadCreditPackages(studioId)
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    }
  }

  const handleDeleteCreditPackage = async (id: string) => {
    if (!confirm("Excluir este pacote?")) return
    try {
      const { error } = await supabase
        .from('lesson_packages')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast({ title: "Sucesso!", description: "Pacote excluído." })
      const user = JSON.parse(localStorage.getItem("danceflow_user") || "{}")
      loadCreditPackages(user.studio_id || user.studioId)
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    }
  }

  const loadInvoices = async (studioId: string) => {
    try {
      const { data, error } = await supabase
        .from('studio_invoices')
        .select('*')
        .eq('studio_id', studioId)
        .order('due_date', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (e) {
      console.error('Erro ao carregar faturas:', e)
    }
  }

  const getCurrentPlanLimits = () => {
    // Normalizar IDs: starter/free -> gratuito, pro+ -> pro-plus
    const normalizedPlanId = ['starter', 'free'].includes(usage.plan?.toLowerCase?.())
      ? 'gratuito'
      : usage.plan === 'pro+'
        ? 'pro-plus'
        : usage.plan
    const plan = systemPlans.find(p => p.id === normalizedPlanId || p.id === usage.plan)
    return normalizePlanForDisplay(plan ?? null, normalizedPlanId)
  }

  const testIntegrationConnection = async (integration: "whatsapp" | "payment") => {
    setIntegrationStatus(prev => ({ ...prev, [integration]: "connecting" }))

    try {
      if (integration === "whatsapp") {
        const userStr = localStorage.getItem('danceflow_user')
        if (!userStr) throw new Error("Usuário não logado")
        const user = JSON.parse(userStr)
        const studioId = user.studio_id || user.studioId

        // Testar via nossa API que já usa as chaves do banco
        const res = await fetch(`/api/whatsapp/connect?studioId=${studioId}`)
        const data = await res.json()

        if (data.success && (data.data?.instance?.state === 'open' || data.data?.instance?.status === 'open')) {
          setIntegrationStatus(prev => ({ ...prev, whatsapp: "connected" }))
          toast({ title: "WhatsApp Conectado! ✅", description: "A instância está ativa e pronta." })
        } else if (data.success && data.data?.base64) {
          setIntegrationStatus(prev => ({ ...prev, whatsapp: "disconnected" }))
          toast({ title: "API Configurada ✅", description: "As chaves estão corretas, mas o WhatsApp não está pareado. Vá até a Central WhatsApp para ler o QR Code." })
        } else {
          throw new Error(data.error || "Não foi possível validar a conexão")
        }
      } else {
        if (integration === "payment" && integrationSettings.payment.gateway === 'stripe') {
           const userStr = localStorage.getItem('danceflow_user')
           if (!userStr) throw new Error("Usuário não logado")
           const user = JSON.parse(userStr)
           const studioId = user.studio_id || user.studioId

           const res = await fetch('/api/admin/integrations/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  studioId,
                  service: 'stripe',
                  apiKey: integrationSettings.payment.secretKey,
                  publicKey: integrationSettings.payment.apiKey
              })
           })
           
           if (!res.ok) {
             const err = await res.json()
             throw new Error(err.error || "Falha ao salvar chaves")
           }
        } else {
           // Simulação para outros gateways
           await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        setIntegrationStatus(prev => ({ ...prev, [integration]: "connected" }))
        toast({ title: "Conexão estabelecida! ✅", description: "Gateway de Pagamento configurado com sucesso." })
      }
    } catch (error: any) {
      setIntegrationStatus(prev => ({ ...prev, [integration]: "error" }))
      toast({
        title: "Erro na conexão ❌",
        description: error.message || `Falha ao conectar ${integration === "whatsapp" ? "WhatsApp" : "Gateway de Pagamento"}.`,
        variant: "destructive",
      })
    }
  }

  const disconnectIntegration = async (integration: "whatsapp" | "payment") => {
    if (integration === "whatsapp") {
      if (!confirm("Tem certeza que deseja desconectar o WhatsApp? Isso parará as automações.")) return
      
      setIntegrationStatus(prev => ({ ...prev, whatsapp: "connecting" }))
      try {
        const userStr = localStorage.getItem('danceflow_user')
        if (!userStr) return
        const user = JSON.parse(userStr)
        const studioId = user.studio_id || user.studioId

        const res = await fetch('/api/whatsapp/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studioId })
        })

        const data = await res.json()
        if (!data.success) throw new Error(data.error)

        setIntegrationStatus(prev => ({ ...prev, whatsapp: "disconnected" }))
        toast({ title: "WhatsApp desconectado", description: "O pareamento foi removido com sucesso." })
      } catch (error: any) {
        setIntegrationStatus(prev => ({ ...prev, whatsapp: "connected" }))
        toast({ title: "Erro ao desconectar", description: error.message, variant: "destructive" })
      }
    } else {
      setIntegrationStatus(prev => ({ ...prev, [integration]: "disconnected" }))
      toast({
        title: "Integração desconectada",
        description: `Gateway de Pagamento foi desconectado.`,
      })
    }
  }

  const testSupabaseConnection = async () => {
    setSupabaseStatus("connecting")

    try {
      // Testar conexão real com Supabase usando as credenciais configuradas
      const response = await fetch('/api/test-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: supabaseSettings.url,
          anonKey: supabaseSettings.anonKey
        })
      })

      if (!response.ok) {
        throw new Error('Falha na resposta da API')
      }

      const result = await response.json()

      if (result.success) {
        setSupabaseStatus("connected")
        toast({
          title: "Conexão estabelecida! ✅",
          description: "Banco de dados Supabase conectado com sucesso.",
        })
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (error: any) {
      console.error('Erro ao testar conexão Supabase:', error)
      setSupabaseStatus("error")
      toast({
        title: "Erro na conexão ❌",
        description: error.message || "Falha ao conectar com o Supabase. Verifique as credenciais.",
        variant: "destructive",
      })
    }
  }

  const disconnectSupabase = () => {
    setSupabaseStatus("disconnected")
    toast({
      title: "Supabase desconectado",
      description: "A conexão com o banco de dados foi desconectada.",
    })
  }

  const loadGeminiModels = async () => {
    setLoadingModels(true)
    try {
      const response = await fetch('/api/gemini/models')
      if (!response.ok) {
        throw new Error('Erro ao carregar modelos')
      }
      const data = await response.json()
      setGeminiModels(data.models || [])
      toast({
        title: "Modelos carregados!",
        description: `Encontrados ${data.total} modelos do Gemini.`,
      })
    } catch (error: any) {
      console.error('Erro ao carregar modelos:', error)
      toast({
        title: "Erro ao carregar modelos",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingModels(false)
    }
  }

  const testApiConnection = async (provider: "openai" | "gemini") => {
    setApiStatus(prev => ({ ...prev, [provider]: "testing" }))

    try {
      const apiKey = provider === "openai" ? apiSettings.openaiApiKey : apiSettings.geminiApiKey

      // Para OpenAI, validar a chave fornecida pelo usuário
      if (provider === "openai") {
        if (!validateApiKey(apiKey, provider)) {
          throw new Error("Formato da chave da API inválido")
        }
      }
      // Para Gemini, a chave vem do servidor (.env), não precisa validar

      const endpoint = provider === "openai" ? "/api/chat" : "/api/gemini"

      // Temporarily set the API key in environment for testing (apenas para OpenAI)
      const envKey = provider === "openai" ? "OPENAI_API_KEY" : "GOOGLE_AI_API_KEY"
      const originalEnv = process.env[envKey]
      if (provider === "openai") {
        process.env[envKey] = apiKey
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "Olá, teste de conexão. Por favor, responda apenas 'Teste bem-sucedido' se estiver funcionando.",
          model: provider === "gemini" ? selectedGeminiModel : undefined,
          context: {
            students: 145,
            teachers: 5,
            classes: 10,
            monthlyRevenue: 18500,
            retentionRate: 92,
          }
        }),
      })

      // Restore original environment
      if (originalEnv !== undefined) {
        process.env[envKey] = originalEnv
      } else {
        delete process.env[envKey]
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro na resposta da API")
      }

      const data = await response.json()
      if (data.response) {
        setApiStatus(prev => ({ ...prev, [provider]: "success" }))
        toast({
          title: "Teste bem-sucedido! ✅",
          description: `${provider === "openai" ? "ChatGPT" : "Gemini"} está funcionando corretamente.`,
        })
      } else {
        throw new Error("Resposta vazia da API")
      }
    } catch (error: any) {
      console.error(`Erro ao testar ${provider}:`, error)
      setApiStatus(prev => ({ ...prev, [provider]: "error" }))
      toast({
        title: "Erro no teste ❌",
        description: error.message || `Falha ao conectar com ${provider === "openai" ? "ChatGPT" : "Gemini"}. Verifique a chave da API.`,
        variant: "destructive",
      })
    }
  }

  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({ title: "Erro", description: "Preencha todos os campos de senha.", variant: "destructive" })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Erro", description: "As novas senhas não coincidem.", variant: "destructive" })
      return
    }

    const strength = checkPasswordStrength(passwordForm.newPassword)
    if (strength.score < MIN_STRONG_PASSWORD_SCORE) {
      toast({ title: "Senha Fraca", description: "A nova senha deve seguir os critérios de segurança.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    // Simular chamada de API
    await new Promise(r => setTimeout(r, 1500))
    setIsLoading(false)
    toast({ title: "Senha atualizada!", description: "Sua senha foi alterada com sucesso." })
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  const handleSave = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // Update localStorage
    const currentUser = JSON.parse(localStorage.getItem("danceflow_user") || "{}")
    localStorage.setItem("danceflow_user", JSON.stringify({
      ...currentUser,
      name: userSettings.name,
      email: userSettings.email,
      studioName: studioSettings.name,
    }))

    // Save integration settings
    localStorage.setItem("danceflow_integrations", JSON.stringify(integrationSettings))

    // Save Supabase settings
    localStorage.setItem("danceflow_supabase", JSON.stringify(supabaseSettings))

    // Salvar configurações do estúdio no banco de dados
    try {
      console.log('🔄 Tentando salvar no banco:', studioSettings)
      const userStr = localStorage.getItem("danceflow_user")
      const user = JSON.parse(userStr || "{}")
      const studioId = user.studio_id || user.studioId

      const results = await Promise.allSettled([
        updateStudioSetting('name', studioSettings.name),
        updateStudioSetting('email', studioSettings.email),
        updateStudioSetting('phone', studioSettings.phone),
        updateStudioSetting('address', studioSettings.address),
        updateStudioSetting('cnpj', studioSettings.cnpj),
        // Atualizar também na tabela studios para consistência
        supabase.from('studios').update({ name: studioSettings.name }).eq('id', studioId),
        // Salvar chaves do WhatsApp
        supabase.from('studio_api_keys').upsert({
          studio_id: studioId,
          service_name: 'whatsapp',
          api_key: integrationSettings.whatsapp.apiKey,
          instance_id: integrationSettings.whatsapp.instanceId,
          settings: { api_url: integrationSettings.whatsapp.apiUrl },
          updated_at: new Date().toISOString()
        }, { onConflict: 'studio_id, service_name' }),
        // Salvar chaves do Stripe
        supabase.from('studio_api_keys').upsert({
          studio_id: studioId,
          service_name: 'stripe',
          api_key: integrationSettings.payment.apiKey,
          api_secret: integrationSettings.payment.secretKey,
          settings: { gateway: integrationSettings.payment.gateway, webhook_url: integrationSettings.payment.webhookUrl },
          updated_at: new Date().toISOString()
        }, { onConflict: 'studio_id, service_name' })
      ])
      
      const failures = results.filter(r => r.status === 'rejected')
      if (failures.length > 0) {
        console.error('❌ Algumas configurações falharam ao salvar:', failures)
        throw new Error(`${failures.length} configurações falharam ao salvar no banco.`)
      }
      
      console.log(t.settings.studioSettingsSaved)
    } catch (dbError: any) {
      console.error('❌ Detalhes do erro de salvamento:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
        fullError: dbError
      })
      toast({
        title: "Aviso de Sincronização",
        description: "Os dados foram salvos localmente, mas não conseguimos atualizar o servidor. Verifique sua conexão.",
        variant: "default",
      })
    }

    toast({
      title: "Configuracoes salvas!",
      description: "Suas alteracoes foram salvas com sucesso.",
    })
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title={studioSettings.name ? `${t.sidebar.settings} - ${studioSettings.name}` : t.sidebar.settings} />

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="perfil" className="gap-2">
              <User className="w-4 h-4" />
              {t.profile}
            </TabsTrigger>
            <TabsTrigger value="estudio" className="gap-2">
              <Building className="w-4 h-4" />
              {t.studio}
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="w-4 h-4" />
              {t.notifications}
            </TabsTrigger>
            <TabsTrigger value="aparencia" className="gap-2">
              <Palette className="w-4 h-4" />
              {t.appearance}
            </TabsTrigger>
            <TabsTrigger value="integracao" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              {t.integrations}
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2">
              <Shield className="w-4 h-4" />
              {t.sidebar.security}
            </TabsTrigger>
            <TabsTrigger value="plano" className="gap-2">
              <CreditCard className="w-4 h-4" />
              {t.sidebar.plan}
            </TabsTrigger>
            <TabsTrigger value="creditos" className="gap-2">
              <Sparkles className="w-4 h-4" />
              {t.settings.creditsSessions}
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-2">
              <FileText className="w-4 h-4" />
              {t.reports}
            </TabsTrigger>
            {enabledModules.gamification && (
              <TabsTrigger value="gamificacao" className="gap-2">
                <Trophy className="w-4 h-4" />
                Gamificação
              </TabsTrigger>
            )}
            {enabledModules.multi_unit && (
              <TabsTrigger value="unidades" className="gap-2">
                <Layers className="w-4 h-4" />
                {t.settings.units}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Perfil Tab */}
          <TabsContent value="perfil" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">{t.personalInfo}</CardTitle>
                <CardDescription>{t.personalInfoDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                    {userSettings.name.split(" ").map(n => n[0]).slice(0, 2).join("") || "U"}
                  </div>
                  <div>
                    <Button variant="outline">{language === 'pt' ? "Alterar Foto" : "Change Photo"}</Button>
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.name}</Label>
                    <Input
                      id="name"
                      value={userSettings.name}
                      onChange={(e) => setUserSettings({ ...userSettings, name: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userSettings.email}
                      onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t.role}</Label>
                  <Select value={userSettings.role} onValueChange={(value) => setUserSettings({ ...userSettings, role: value })}>
                    <SelectTrigger className="w-full md:w-[200px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin (Global)</SelectItem>
                          <SelectItem value="owner">Proprietário (Owner)</SelectItem>
                          <SelectItem value="admin">Administrador (Admin)</SelectItem>
                          <SelectItem value="manager">Gerente (Manager)</SelectItem>
                          <SelectItem value="teacher">{vocabulary.provider} (Teacher)</SelectItem>
                          <SelectItem value="receptionist">Recepcionista</SelectItem>
                          <SelectItem value="student">{vocabulary.client} (Student)</SelectItem>
                        </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estudio Tab */}
          <TabsContent value="estudio" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">{t.settings.studioData}</CardTitle>
                <CardDescription>{t.studioInfoDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studioName">{language === 'pt' ? "Nome do Estúdio" : "Studio Name"}</Label>
                    <Input
                      id="studioName"
                      value={studioSettings.name}
                      onChange={(e) => setStudioSettings({ ...studioSettings, name: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studioCnpj">{t.cnpj}</Label>
                    <Input
                      id="studioCnpj"
                      value={studioSettings.cnpj}
                      onChange={(e) => setStudioSettings({ ...studioSettings, cnpj: e.target.value })}
                      placeholder={language === 'pt' ? "00.000.000/0001-00" : "XX.XXX.XXX/XXXX-XX"}
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studioEmail">{language === 'pt' ? "Email do Estúdio" : "Studio Email"}</Label>
                    <Input
                      id="studioEmail"
                      type="email"
                      value={studioSettings.email}
                      onChange={(e) => setStudioSettings({ ...studioSettings, email: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studioPhone">{t.phone}</Label>
                    <Input
                      id="studioPhone"
                      value={studioSettings.phone}
                      onChange={(e) => setStudioSettings({ ...studioSettings, phone: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studioAddress">{t.address}</Label>
                  <Textarea
                    id="studioAddress"
                    value={studioSettings.address}
                    onChange={(e) => setStudioSettings({ ...studioSettings, address: e.target.value })}
                    className="bg-background"
                    rows={2}
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="button" onClick={handleSaveStudioSettings} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {t.save}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  {t.settings.professionalsTier.replace('{providers}', vocabulary.providers)}
                </CardTitle>
                <CardDescription>
                  {t.settings.professionalsTierDesc.replace('{providers}', vocabulary.providers.toLowerCase())}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {professionalsTierLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'pt' ? 'Carregando...' : 'Loading...'}
                  </div>
                ) : professionalsTier ? (
                  <div className="space-y-4">
                    <p className="text-sm">
                      {language === 'pt' ? 'Atual' : 'Current'}: {professionalsTier.currentCount} / {professionalsTier.limit} {vocabulary.providers}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {professionalsTier.tiers.map((tier) => (
                        <Button
                          key={tier.id}
                          variant={professionalsTier.tierId === tier.id ? 'default' : 'outline'}
                          size="sm"
                          disabled={professionalsTierSaving || (professionalsTier.currentCount > tier.limit && professionalsTier.tierId !== tier.id)}
                          onClick={() => handleUpdateProfessionalsTier(tier.id)}
                        >
                          {(t.settings as Record<string, string>)[`tier_${tier.id.replace('-', '_')}`]?.replace?.('{providers}', vocabulary.providers) || tier.id}
                          {professionalsTier.currentCount > tier.limit && professionalsTier.tierId !== tier.id && ` (${language === 'pt' ? 'mín.' : 'min'})`}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <EcosystemSettings studioId={studioSettings.id || studioId || ""} />
          </TabsContent>

          {/* Notificacoes Tab */}
          <TabsContent value="notificacoes" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Preferencias de Notificacao</CardTitle>
                <CardDescription>Configure como deseja receber alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Notificacoes por Email</p>
                    <p className="text-sm text-muted-foreground">Receba atualizacoes importantes por email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Notificacoes por WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Receba alertas via WhatsApp</p>
                  </div>
                  <Switch
                    checked={notificationSettings.whatsappNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, whatsappNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Alertas de Evasao</p>
                    <p className="text-sm text-muted-foreground">Seja notificado sobre {vocabulary.client.toLowerCase()}s em risco</p>
                  </div>
                  <Switch
                    checked={notificationSettings.evasionAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, evasionAlerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Lembretes de Pagamento</p>
                    <p className="text-sm text-muted-foreground">Alertas sobre mensalidades pendentes</p>
                  </div>
                  <Switch
                    checked={notificationSettings.paymentReminders}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, paymentReminders: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{t.settings.classReminders}</p>
                    <p className="text-sm text-muted-foreground">{t.settings.classRemindersDescription.replace('{service}', vocabulary.service.toLowerCase())}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.classReminders}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, classReminders: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aparencia Tab */}
          <TabsContent value="aparencia" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Aparencia</CardTitle>
                <CardDescription>Personalize a interface do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select value={appearance.theme} onValueChange={(value) => setAppearance({ ...appearance, theme: value })}>
                    <SelectTrigger className="w-full md:w-[200px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={appearance.language} onValueChange={(value) => setAppearance({ ...appearance, language: value })}>
                    <SelectTrigger className="w-full md:w-[200px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Portugues (Brasil)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Espanol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integracoes Tab */}
          <TabsContent value="integracao" className="space-y-6">
            {/* APIs de IA */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">APIs de Inteligencia Artificial</CardTitle>
                <CardDescription>Configure as chaves das APIs para o Chat IA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ChatGPT API */}
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">ChatGPT (OpenAI)</p>
                        <p className="text-sm text-muted-foreground">Assistente conversacional inteligente</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apiStatus.openai && expandedApi === "openai" && (
                        <div className="flex items-center gap-2">
                          {apiStatus.openai === "testing" && (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          )}
                          {apiStatus.openai === "success" && (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                          {apiStatus.openai === "error" && (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setExpandedApi(expandedApi === "openai" ? null : "openai")}
                      >
                        Configurar
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedApi === "openai" && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      <div>
                        <Label htmlFor="openai-api-key" className="text-sm">Chave da API</Label>
                        <Input
                          id="openai-api-key"
                          type="password"
                          value={apiSettings.openaiApiKey}
                          onChange={(e) => setApiSettings({ ...apiSettings, openaiApiKey: e.target.value })}
                          placeholder="sk-..."
                          className="bg-background mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Obtenha sua chave em{" "}
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            OpenAI Platform
                          </a>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testApiConnection("openai")}
                          disabled={!apiSettings.openaiApiKey.trim() || apiStatus.openai === "testing"}
                        >
                          {apiStatus.openai === "testing" ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Testando...
                            </>
                          ) : (
                            <>
                              <TestTube className="w-3 h-3 mr-1" />
                              Testar Conexao
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gemini API */}
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Gemini (Google)</p>
                        <p className="text-sm text-muted-foreground">Modelo avançado de IA do Google</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apiStatus.gemini && expandedApi === "gemini" && (
                        <div className="flex items-center gap-2">
                          {apiStatus.gemini === "testing" && (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          )}
                          {apiStatus.gemini === "success" && (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                          {apiStatus.gemini === "error" && (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setExpandedApi(expandedApi === "gemini" ? null : "gemini")}
                      >
                        Configurar
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedApi === "gemini" && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">API configurada no servidor</span>
                      </div>
                      <div>
                        <Label htmlFor="gemini-model" className="text-sm">Modelo do Gemini</Label>
                        <Select value={selectedGeminiModel} onValueChange={setSelectedGeminiModel}>
                          <SelectTrigger className="w-full bg-background mt-1">
                            <SelectValue placeholder="Selecione um modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingModels ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Carregando modelos...
                              </div>
                            ) : geminiModels.length > 0 ? (
                              geminiModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  <div>
                                    <div className="font-medium">{model.name}</div>
                                    <div className="text-xs text-muted-foreground">{model.description}</div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="py-2 text-center text-sm text-muted-foreground">
                                Nenhum modelo encontrado
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Modelos carregados dinamicamente da API do Google
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadGeminiModels()}
                          disabled={loadingModels}
                        >
                          {loadingModels ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Carregando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Atualizar Modelos
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => testApiConnection("gemini")}
                          disabled={apiStatus.gemini === "testing"}
                        >
                          {apiStatus.gemini === "testing" ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Testando...
                            </>
                          ) : (
                            <>
                              <TestTube className="w-3 h-3 mr-1" />
                              Testar Modelo
                            </>
                          )}
                        </Button>
                      </div>
                      {selectedGeminiModel && (
                        <p className="text-xs text-muted-foreground text-center">
                          Modelo selecionado: <strong>{selectedGeminiModel}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Banco de Dados Supabase */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">{t.settings.supabaseDatabase}</CardTitle>
                <CardDescription>Configure a conexão com o banco de dados para dados reais no chat IA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Supabase */}
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Database className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Supabase</p>
                        <p className="text-sm text-muted-foreground">Banco de dados PostgreSQL para dados reais</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {supabaseStatus === "connected" && expandedIntegration === "supabase" && (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Conectado</span>
                        </div>
                      )}
                      {supabaseStatus === "connecting" && expandedIntegration === "supabase" && (
                        <div className="flex items-center gap-2 text-primary">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Conectando...</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setExpandedIntegration(expandedIntegration === "supabase" ? null : "supabase")}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedIntegration === "supabase" && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      <div>
                        <Label htmlFor="supabase-url" className="text-sm">URL do Projeto</Label>
                        <Input
                          id="supabase-url"
                          value={supabaseSettings.url}
                          onChange={(e) => setSupabaseSettings({ ...supabaseSettings, url: e.target.value })}
                          placeholder="https://your-project.supabase.co"
                          className="bg-background mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supabase-anon-key" className="text-sm">Chave Anônima</Label>
                        <Input
                          id="supabase-anon-key"
                          type="password"
                          value={supabaseSettings.anonKey}
                          onChange={(e) => setSupabaseSettings({ ...supabaseSettings, anonKey: e.target.value })}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="bg-background mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Obtenha suas credenciais em{" "}
                          <a
                            href="https://supabase.com/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Supabase Dashboard
                          </a>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {supabaseStatus === "connected" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={disconnectSupabase}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="w-3 h-3 mr-1" />
                            Desconectar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={testSupabaseConnection}
                            disabled={!supabaseSettings.url.trim() || !supabaseSettings.anonKey.trim() || supabaseStatus === "connecting"}
                          >
                            {supabaseStatus === "connecting" ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                Conectando...
                              </>
                            ) : (
                              <>
                                <Link className="w-3 h-3 mr-1" />
                                Conectar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Outras Integrações */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">{t.settings.otherIntegrations}</CardTitle>
                <CardDescription>{t.settings.otherIntegrationsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">WhatsApp Business</p>
                      <p className="text-sm text-muted-foreground">Envie mensagens automáticas para {vocabulary.client.toLowerCase()}s</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                      {integrationStatus.whatsapp === "connected" && (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Conectado</span>
                </div>
                      )}
                      {integrationStatus.whatsapp === "connecting" && (
                        <div className="flex items-center gap-2 text-primary">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Conectando...</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setExpandedIntegration(expandedIntegration === "whatsapp" ? null : "whatsapp")}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedIntegration === "whatsapp" && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp-api-url" className="text-sm">URL da API (Evolution)</Label>
                          <Input
                            id="whatsapp-api-url"
                            value={integrationSettings.whatsapp.apiUrl}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              whatsapp: { ...integrationSettings.whatsapp, apiUrl: e.target.value }
                            })}
                            placeholder="https://sua-api.com"
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp-api-key" className="text-sm">Global API Key</Label>
                          <Input
                            id="whatsapp-api-key"
                            type="password"
                            value={integrationSettings.whatsapp.apiKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              whatsapp: { ...integrationSettings.whatsapp, apiKey: e.target.value }
                            })}
                            placeholder="Sua API Key..."
                            className="bg-background"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-instance-id" className="text-sm">ID da Instância (Opcional)</Label>
                        <Input
                          id="whatsapp-instance-id"
                          value={integrationSettings.whatsapp.instanceId}
                          onChange={(e) => setIntegrationSettings({
                            ...integrationSettings,
                            whatsapp: { ...integrationSettings.whatsapp, instanceId: e.target.value }
                          })}
                          placeholder="df_meu-studio"
                          className="bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Se deixado em branco, o sistema usará o identificador padrão baseado no seu {vocabulary.establishment.toLowerCase()}.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {integrationStatus.whatsapp === "connected" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => disconnectIntegration("whatsapp")}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="w-3 h-3 mr-1" />
                            Desconectar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testIntegrationConnection("whatsapp")}
                            disabled={!integrationSettings.whatsapp.apiKey.trim() || integrationStatus.whatsapp === "connecting"}
                          >
                            {integrationStatus.whatsapp === "connecting" ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                Conectando...
                              </>
                            ) : (
                              <>
                                <Link className="w-3 h-3 mr-1" />
                                Conectar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Gateway de Pagamento</p>
                      <p className="text-sm text-muted-foreground">Receba pagamentos online</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                      {integrationStatus.payment === "connected" && (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Conectado</span>
                        </div>
                      )}
                      {integrationStatus.payment === "connecting" && (
                        <div className="flex items-center gap-2 text-primary">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Conectando...</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setExpandedIntegration(expandedIntegration === "payment" ? null : "payment")}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedIntegration === "payment" && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment-gateway" className="text-sm">Gateway de Pagamento</Label>
                        <Select
                          value={integrationSettings.payment.gateway}
                          onValueChange={(value) => setIntegrationSettings({
                            ...integrationSettings,
                            payment: { ...integrationSettings.payment, gateway: value }
                          })}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione o gateway" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mercado-pago">Mercado Pago</SelectItem>
                            <SelectItem value="pagseguro">PagSeguro</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment-api-key" className="text-sm">
                            {integrationSettings.payment.gateway === 'stripe' ? 'Public Key (pk_...)' : 'API Key'}
                          </Label>
                          <Input
                            id="payment-api-key"
                            type="password"
                            value={integrationSettings.payment.apiKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              payment: { ...integrationSettings.payment, apiKey: e.target.value }
                            })}
                            placeholder={integrationSettings.payment.gateway === 'stripe' ? "pk_live_..." : "pk_live_..."}
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment-secret-key" className="text-sm">
                            {integrationSettings.payment.gateway === 'stripe' ? 'Secret Key (sk_...)' : 'Secret Key'}
                          </Label>
                          <Input
                            id="payment-secret-key"
                            type="password"
                            value={integrationSettings.payment.secretKey}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              payment: { ...integrationSettings.payment, secretKey: e.target.value }
                            })}
                            placeholder={integrationSettings.payment.gateway === 'stripe' ? "sk_live_..." : "sk_live_..."}
                            className="bg-background"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-webhook" className="text-sm">URL do Webhook</Label>
                        <Input
                          id="payment-webhook"
                          value={integrationSettings.payment.webhookUrl}
                          onChange={(e) => setIntegrationSettings({
                            ...integrationSettings,
                            payment: { ...integrationSettings.payment, webhookUrl: e.target.value }
                          })}
                          placeholder="https://seusite.com/webhook/pagamento"
                          className="bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Configure este webhook no painel do seu gateway de pagamento para receber notificações de pagamentos.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {integrationStatus.payment === "connected" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => disconnectIntegration("payment")}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="w-3 h-3 mr-1" />
                            Desconectar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testIntegrationConnection("payment")}
                            disabled={!integrationSettings.payment.apiKey.trim() || integrationStatus.payment === "connecting"}
                          >
                            {integrationStatus.payment === "connecting" ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                Conectando...
                              </>
                            ) : (
                              <>
                                <Link className="w-3 h-3 mr-1" />
                                Conectar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Seguranca Tab */}
          <TabsContent value="seguranca" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Seguranca da Conta</CardTitle>
                <CardDescription>Gerencie a seguranca da sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    className="bg-background max-w-md" 
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      className="bg-background" 
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      className="bg-background" 
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
                
                <PasswordStrengthMeter password={passwordForm.newPassword} />
                
                <Button type="button" variant="outline" onClick={handleUpdatePassword} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Alterar Senha
                </Button>

                <div className="pt-6 border-t border-border">
                  <h4 className="font-medium text-foreground mb-4">Autenticacao em Dois Fatores</h4>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">2FA via SMS</p>
                      <p className="text-sm text-muted-foreground">Adicione uma camada extra de seguranca</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plano Tab */}
          <TabsContent value="plano" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Seu Plano</CardTitle>
                <CardDescription>Gerencie sua assinatura e acompanhe seus limites</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={cn(
                  "p-6 border-2 rounded-xl transition-colors",
                  usage.plan === 'gratuito' 
                    ? "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800/60" 
                    : "border-primary/50 bg-primary/5 dark:bg-primary/10"
                )}>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                        {!usageLoaded ? t.common.loading.replace('...', '') + '...' : getCurrentPlanLimits().name}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mt-0.5">
                        {!usageLoaded ? '—' : ['gratuito', 'starter', 'free'].includes(usage.plan?.toLowerCase?.())
                          ? 'Ideal para começar sua jornada'
                          : usage.plan === 'pro'
                            ? 'Tudo o que você precisa para crescer'
                            : ['pro-plus', 'pro+'].includes(usage.plan)
                              ? 'O melhor custo-benefício para estabelecimentos médios'
                              : 'Escalabilidade e suporte total'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {!usageLoaded ? '—' : `R$ ${Number(getCurrentPlanLimits().price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">/mês</p>
                      </div>
                      {searchParams.get("session_id") && (
                        <Button 
                          size="sm" 
                          className="h-9 px-4 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                          onClick={() => verifyPayment(searchParams.get("session_id")!)}
                          disabled={isVerifyingPayment}
                        >
                          {isVerifyingPayment ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Sincronizar Plano
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{vocabulary.client}s Ativos</span>
                        <span className="font-bold text-slate-900 dark:text-white">{usage.students} / {getCurrentPlanLimits().max_students >= 1000 ? 'Ilimitado' : getCurrentPlanLimits().max_students}</span>
                      </div>
                      <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-300 rounded-full",
                            usage.students >= (getCurrentPlanLimits().max_students || 0) 
                              ? "bg-red-500" 
                              : "bg-emerald-500 dark:bg-emerald-400"
                          )}
                          style={{ width: `${Math.min((usage.students / (getCurrentPlanLimits().max_students || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Profissionais Ativos</span>
                        <span className="font-bold text-slate-900 dark:text-white">{usage.teachers} / {getCurrentPlanLimits().max_teachers >= 1000 ? 'Ilimitado' : getCurrentPlanLimits().max_teachers}</span>
                      </div>
                      <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-300 rounded-full",
                            usage.teachers >= (getCurrentPlanLimits().max_teachers || 0) 
                              ? "bg-red-500" 
                              : "bg-emerald-500 dark:bg-emerald-400"
                          )}
                          style={{ width: `${Math.min((usage.teachers / (getCurrentPlanLimits().max_teachers || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Recursos do plano</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'whatsapp', label: 'WhatsApp', has: getCurrentPlanLimits().has_whatsapp },
                        { key: 'ai', label: 'Chat IA Full', has: getCurrentPlanLimits().has_ai },
                        { key: 'finance', label: 'Financeiro Avançado', has: getCurrentPlanLimits().has_finance },
                        { key: 'pos', label: 'PDV Local', has: getCurrentPlanLimits().hasPOS },
                        { key: 'inventory', label: 'Estoque', has: getCurrentPlanLimits().hasInventory },
                        { key: 'leads', label: 'CRM / Leads', has: getCurrentPlanLimits().hasLeads },
                        { key: 'scanner', label: 'Scanner Entrada', has: getCurrentPlanLimits().hasScanner },
                        { key: 'gamification', label: 'Gamificação', has: getCurrentPlanLimits().hasGamification },
                        { key: 'marketplace', label: 'Marketplace', has: getCurrentPlanLimits().hasMarketplace },
                        { key: 'erp', label: 'ERP Enterprise', has: getCurrentPlanLimits().hasERP },
                      ].map(({ key, label, has }) => (
                        <Badge 
                          key={key}
                          variant="secondary"
                          className={cn(
                            "gap-1.5 px-3 py-1 font-medium",
                            has 
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" 
                              : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 border-slate-300/50 dark:border-slate-600"
                          )}
                        >
                          {has ? <CheckCircle className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 opacity-70" />}
                          {label}
                        </Badge>
                      ))}
                      {getCurrentPlanLimits().has_multi_unit && (
                        <Badge className="gap-1.5 px-3 py-1 font-medium bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Multi-unidades
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md hover:shadow-lg transition-shadow" 
                    onClick={() => {
                      setSelectedNewPlan(null)
                      setIsPlanModalOpen(true)
                    }}
                  >
                    <Zap className="w-4 h-4 mr-2" /> 
                    {usage.plan === 'gratuito' ? t.settings.upgradeToPro : t.settings.changePlan}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium"
                  >
                    Cancelar Assinatura
                  </Button>
                </div>

                <div className="pt-6 border-t border-border">
                  <h4 className="font-medium text-foreground mb-4">Historico de Faturas</h4>
                  <div className="space-y-3">
                    {invoices.length > 0 ? (
                      invoices.map((invoice, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium">
                              {new Date(invoice.due_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
                            </span>
                            <span className="text-[10px] text-muted-foreground">Vencimento: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <span className="text-muted-foreground font-bold">R$ {Number(invoice.amount).toFixed(2).replace('.', ',')}</span>
                          <Badge 
                            variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                            className={invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20' : ''}
                          >
                            {invoice.status === 'paid' ? 'Pago' : invoice.status === 'pending' ? 'Pendente' : 'Falhou'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma fatura encontrada.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creditos Tab */}
          <TabsContent value="creditos" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-card-foreground">Gestão de Créditos / Sessões</CardTitle>
                  <CardDescription>Configure os pacotes que os {vocabulary.client.toLowerCase()}s podem adquirir.</CardDescription>
                </div>
                <Button 
                  onClick={() => handleSaveCreditPackage({ name: 'Novo Pacote', lessons_count: 1, price: 50, is_active: true })}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  + Novo Pacote
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingCredits ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : creditPackages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {creditPackages.map((pkg) => (
                        <Card key={pkg.id} className="border border-border p-4 space-y-3">
                          <div className="space-y-2">
                            <Label>Nome do Pacote</Label>
                            <Input 
                              value={pkg.name} 
                              onChange={(e) => {
                                const newPkgs = creditPackages.map(p => p.id === pkg.id ? { ...p, name: e.target.value } : p)
                                setCreditPackages(newPkgs)
                              }}
                              onBlur={() => handleSaveCreditPackage(pkg)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label>Créditos / Sessões</Label>
                              <Input 
                                type="number" 
                                value={pkg.lessons_count} 
                                onChange={(e) => {
                                  const newPkgs = creditPackages.map(p => p.id === pkg.id ? { ...p, lessons_count: parseInt(e.target.value) } : p)
                                  setCreditPackages(newPkgs)
                                }}
                                onBlur={() => handleSaveCreditPackage(pkg)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Preco (R$)</Label>
                              <Input 
                                type="number" 
                                value={pkg.price} 
                                onChange={(e) => {
                                  const newPkgs = creditPackages.map(p => p.id === pkg.id ? { ...p, price: parseFloat(e.target.value) } : p)
                                  setCreditPackages(newPkgs)
                                }}
                                onBlur={() => handleSaveCreditPackage(pkg)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={pkg.is_active} 
                                onCheckedChange={(checked) => handleSaveCreditPackage({ ...pkg, is_active: checked })}
                              />
                              <span className="text-xs text-muted-foreground">Pacote Ativo</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteCreditPackage(pkg.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl border-border">
                      <Sparkles className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum pacote de créditos definido.</p>
                      <Button 
                        variant="link" 
                        onClick={() => handleSaveCreditPackage({ name: 'Crédito Avulso', lessons_count: 1, price: 50, is_active: true })}
                      >
                        Criar primeiro pacote
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {enabledModules.gamification && (
            <TabsContent value="gamificacao" className="space-y-6">
              <GamificationSettings studioId={studioId || ""} />
            </TabsContent>
          )}

          {/* Relatorios Tab */}
          <TabsContent value="relatorios" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">Relatórios de Contexto IA</CardTitle>
                    <CardDescription>Gerencie os relatórios que alimentam a inteligência artificial</CardDescription>
                  </div>
                  <Button 
                    onClick={async () => {
                      setIsGeneratingReport(true)
                      try {
                        const user = JSON.parse(localStorage.getItem("danceflow_user") || "{}")
                        const res = await fetch('/api/admin/reports/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ studioId: user.studio_id || user.studioId })
                        })
                        const data = await res.json()
                        if (res.ok && data.success) {
                          toast({ title: "Relatório Gerado", description: "O contexto da IA foi atualizado com sucesso." })
                          loadReports(user.studio_id || user.studioId)
                        } else {
                          toast({ title: "Erro ao Gerar Relatório", description: data.error || "Ocorreu um erro desconhecido ao gerar o relatório.", variant: "destructive" })
                        }
                      } catch (e) {
                        toast({ title: "Erro", description: "Falha ao gerar relatório.", variant: "destructive" })
                      } finally {
                        setIsGeneratingReport(false)
                      }
                    }}
                    disabled={isGeneratingReport}
                    className="gap-2"
                  >
                    {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Atualizar Relatório Agora
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-800 dark:text-blue-300">Como funciona o Contexto IA?</p>
                    <p className="text-blue-700 dark:text-blue-400 mt-1">
                      Este relatório é gerado automaticamente a cada 2 horas com base nos dados reais do seu {vocabulary.establishment.toLowerCase()} ({vocabulary.client.toLowerCase()}s, serviços, financeiro). 
                      A IA utiliza este arquivo como "fonte da verdade" para responder perguntas com precisão e evitar invenções (alucinações).
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Status do Contexto Atual</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 border-dashed border-border">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Última Atualização</p>
                      <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        {reports.length > 0 ? new Date(reports[0].created_at).toLocaleString('pt-BR') : 'Nunca atualizado'}
                      </p>
                    </Card>
                    <Card className="p-4 border-dashed border-border">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Tamanho do Contexto</p>
                      <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        {reports.length > 0 ? `${(reports[0].content.length / 1024).toFixed(1)} KB` : '0 KB'}
                      </p>
                    </Card>
                    <Card className="p-4 border-dashed border-border">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Próxima Sincronização</p>
                      <p className="text-lg font-semibold mt-1 flex items-center gap-2 text-green-600">
                        <RefreshCw className="w-4 h-4" />
                        Automática (2h)
                      </p>
                    </Card>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h4 className="font-medium text-foreground mb-4">Arquivos de Backup de Contexto</h4>
                  <div className="space-y-2">
                    {loadingReports ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : reports.length > 0 ? (
                      reports.map((report, i) => (
                        <div key={report.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{new Date(report.created_at).toLocaleString('pt-BR')}</p>
                                <p className="text-xs text-muted-foreground">{(report.content.length / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs"
                                onClick={async () => {
                                  const userData = JSON.parse(localStorage.getItem("danceflow_user") || "{}")
                                  const studioId = userData.studio_id || userData.studioId
                                  
                                  console.log("Verificando relatorio no clique:", { reportId: report.id, studioId: studioId }); // <-- Nova linha para depuração
                                  if (!report.id || !studioId) {
                                    toast({ title: "Erro", description: "ID do relatório ou Studio ID ausente para visualização.", variant: "destructive" })
                                    return
                                  }

                                  try {
                                    const res = await fetch(`/api/admin/reports/download/${report.id}?studioId=${studioId}`)
                                    if (!res.ok) {
                                      const errorData = await res.json()
                                      throw new Error(errorData.error || "Falha ao buscar o conteúdo do relatório.")
                                    }
                                    const content = await res.text()
                                    setReportContentToView(content)
                                    setShowReportModal(true)
                                  } catch (e: any) {
                                    toast({ title: "Erro", description: e.message, variant: "destructive" })
                                  }
                                }}
                            >
                              <Download className="w-3 h-3 mr-1" />
                                Ver Arquivo
                            </Button>
                            <Badge variant={i === 0 ? "default" : "secondary"}>
                              {i === 0 ? "Ativo" : "Backup"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum relatório gerado ainda.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {enabledModules.multi_unit && (
            <>
              <TabsContent value="unidades" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-card-foreground">Gestão de Unidades</CardTitle>
                      <CardDescription>Gerencie suas filiais e alterne entre elas</CardDescription>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/admin/ecosystems/new'}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Unidade
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studios.map((studio) => (
                      <Card key={studio.id} className={cn(
                        "relative overflow-hidden transition-all hover:shadow-md",
                        studio.id === studioId ? "border-primary ring-1 ring-primary" : "border-border"
                      )}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Building className="w-5 h-5 text-muted-foreground" />
                            {studio.id === studioId && (
                              <Badge className="bg-primary text-primary-foreground">Ativa</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mt-2">{studio.name}</CardTitle>
                          <CardDescription className="text-xs truncate">{studio.slug}.workflowpro.com.br</CardDescription>
                        </CardHeader>
                        <CardFooter className="pt-2">
                          <Button 
                            variant={studio.id === studioId ? "secondary" : "default"}
                            className="w-full"
                            disabled={studio.id === studioId}
                            onClick={() => switchStudio(studio.id)}
                          >
                            {studio.id === studioId ? "Unidade Atual" : "Acessar Unidade"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </>
          )}
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alteracoes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Modal de Seleção de Plano */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">{t.settings.chooseNewPlan}</DialogTitle>
            <DialogDescription className="text-center">
              {t.settings.planSelectionDescription.replace('{establishment}', vocabulary.establishment.toLowerCase())}
              Selecione a melhor opção para o crescimento do seu negócio. 
              Você poderá revisar antes da cobrança.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-2 py-4">
            <Button
              variant={billingInterval === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingInterval("monthly")}
            >
              Mensal
            </Button>
            <Button
              variant={billingInterval === "yearly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingInterval("yearly")}
            >
              Anual (2 meses grátis)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
            {loadingSystemPlans ? (
              <div className="col-span-full py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Carregando planos...</p>
              </div>
            ) : systemPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all border-2 ${
                  selectedNewPlan === plan.id 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-border hover:border-primary/50"
                } ${usage.plan === plan.id ? "opacity-60 cursor-default" : ""}`}
                onClick={() => usage.plan !== plan.id && setSelectedNewPlan(plan.id)}
              >
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="mb-4">
                    <h4 className="font-bold text-lg uppercase">{plan.name}</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold">
                        R$ {billingInterval === "yearly" && plan.price_annual
                          ? Number(plan.price_annual).toFixed(0)
                          : Number(plan.price).toFixed(0)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {billingInterval === "yearly" ? "/ano" : "/mês"}
                      </span>
                    </div>
                    {billingInterval === "yearly" && plan.price_annual && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">Economize {plan.annual_discount_percent ?? 17}%</p>
                    )}
                  </div>

                  <ul className="space-y-2 text-xs flex-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-3 h-3 ${plan.max_students >= 100 ? "text-primary" : "text-muted-foreground"}`} />
                      Até {plan.max_students >= 1000 ? "Ilimitados" : plan.max_students} {vocabulary.client.toLowerCase()}s
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-3 h-3 ${plan.max_teachers >= 5 ? "text-primary" : "text-muted-foreground"}`} />
                      Até {plan.max_teachers >= 1000 ? "Ilimitados" : plan.max_teachers} profissionais
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.has_whatsapp ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.has_ai ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      Inteligência Artificial
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.hasFinance ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      Financeiro Avançado
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.hasPOS ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      PDV Local
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.hasInventory ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      Controle de Estoque
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.hasLeads ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      CRM / Leads
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.hasScanner ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      Scanner de Entrada
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.hasGamification ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      Gamificação
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.hasMarketplace ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      Marketplace/Loja Virtual
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.hasERP ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      ERP Enterprise
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.has_multi_unit ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      Multi-unidades
                    </li>
                  </ul>

                  {usage.plan === plan.id ? (
                    <Badge variant="secondary" className="mt-4 w-full justify-center py-1">{t.settings.currentPlan}</Badge>
                  ) : (
                    <Button 
                      variant={selectedNewPlan === plan.id ? "default" : "outline"} 
                      className="mt-4 w-full text-xs h-8"
                    >
                      {selectedNewPlan === plan.id ? "Selecionado" : "Selecionar"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsPlanModalOpen(false)}>Cancelar</Button>
            <Button 
              type="button"
              disabled={!selectedNewPlan || selectedNewPlan === usage.plan || isLoading}
              onClick={async () => {
                const plan = systemPlans.find(p => p.id === selectedNewPlan)
                toast({
                  title: "Redirecionando para Stripe",
                  description: `Preparando checkout para o plano ${plan?.name}...`,
                })
                
                try {
                  const userData = JSON.parse(localStorage.getItem("danceflow_user") || "{}");
                  const response = await fetch('/api/admin/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      planId: selectedNewPlan,
                      studioId: userData.studio_id,
                      billingInterval,
                    })
                  });

                  const data = await response.json();
                  if (data.url) {
                    window.location.href = data.url;
                  } else {
                    throw new Error(data.error || 'Erro ao criar checkout');
                  }
                } catch (error: any) {
                  toast({
                    title: "Erro no Checkout",
                    description: error.message,
                    variant: "destructive",
                  });
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Continuar para Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Relatório */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Conteúdo do Relatório de Contexto IA</DialogTitle>
            <DialogDescription className="text-center">
              Visualização do relatório que alimenta o contexto da IA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={reportContentToView}
              readOnly
              className="w-full h-[500px] font-mono text-xs bg-muted/20 border-border p-4 resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setShowReportModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando configurações...</div>}>
      <SettingsContent />
    </Suspense>
  )
}
