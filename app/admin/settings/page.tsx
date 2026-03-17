"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Settings,
  Shield,
  Zap,
  Cpu,
  Save,
  Lock,
  Globe,
  Bell,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Database,
  Key,
  CreditCard,
  QrCode,
  CheckCircle2,
  XCircle,
  Loader2,
  User
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { getAffiliatePayoutSettings, saveAffiliatePayoutSettings } from "@/lib/actions/affiliate";

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [isSaving, setIsLoading] = useState(false)
  const [isLoading, setIsLoadingData] = useState(true)
  const [showKeys, setShowKeys] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState({
    name: '',
    email: ''
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  
  // Novos estados para configurações de afiliado
  const [affiliatePayoutsEnabled, setAffiliatePayoutsEnabled] = useState(false);
  const [minPayoutAmount, setMinPayoutAmount] = useState(1000); // Em centavos, ex: R$10.00
  const [isAffiliateSettingsSaving, setIsAffiliateSettingsSaving] = useState(false);

  const [envConfig, setEnvConfig] = useState({
    OPENAI_API_KEY: '',
    GOOGLE_AI_API_KEY: '',
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    DATABASE_URL: '',
    STRIPE_SECRET_KEY: '',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    RESEND_API_KEY: '',
    EMAIL_SENDER_ADDRESS: '',
    EMAIL_SENDER_NAME: '',
    EMAIL_SENDER_PASSWORD: '',
    EMAIL_SMTP_HOST: '',
    EMAIL_SMTP_PORT: '',
    EMAIL_SECURE: '',
    EMAIL_SMTP_USER: '',
    // Novas chaves para configuração de pagamentos de afiliados
    AFFILIATE_PAYOUT_ENABLED: 'false', // String para .env
    AFFILIATE_MIN_PAYOUT_AMOUNT: '1000' // String para .env
  })

  useEffect(() => {
    fetchEnvConfig()
    fetchUserData()
    fetchAffiliatePayoutSettings()
  }, [])

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      setUserData({
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || ''
      })
    }
  }

  const fetchAffiliatePayoutSettings = async () => {
    try {
      const enabled = envConfig.AFFILIATE_PAYOUT_ENABLED === 'true';
      const minAmount = parseInt(envConfig.AFFILIATE_MIN_PAYOUT_AMOUNT || '1000');
      setAffiliatePayoutsEnabled(enabled);
      setMinPayoutAmount(minAmount);
    } catch (error) {
      console.error("Erro ao buscar configurações de pagamento de afiliado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de pagamento de afiliado.",
        variant: "destructive"
      });
    }
  };

  const handleSaveAffiliateSettings = async () => {
    setIsAffiliateSettingsSaving(true);
    try {
      toast({
        title: "Configurações de Afiliado salvas",
        description: "As configurações de pagamento de afiliado foram atualizadas.",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações de afiliado:", error);
      toast({
        title: "Erro",
        description: "Houve um problema ao salvar as configurações de afiliado.",
        variant: "destructive"
      });
    } finally {
      setIsAffiliateSettingsSaving(false);
    }
  };

  const fetchEnvConfig = async () => {
    setIsLoadingData(true)
    try {
      const res = await fetch('/api/admin/env')
      if (res.ok) {
        const data = await res.json()
        setEnvConfig(data)
      } else {
        throw new Error('Falha ao carregar .env')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível ler o arquivo .env",
        variant: "destructive"
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleProfileUpdate = async () => {
    if (!user) return
  
    setIsProfileSaving(true)
    let hasError = false
    let changesMade = false
  
    // Update email if changed
    if (userData.email && userData.email !== user.email) {
      changesMade = true
      const { error: emailError } = await supabase.auth.updateUser({ email: userData.email })
      if (emailError) {
        toast({
          title: "Erro ao atualizar e-mail",
          description: emailError.message,
          variant: "destructive"
        })
        hasError = true
      } else {
        toast({
          title: "Confirmação necessária",
          description: "Enviamos um link de confirmação para o seu novo e para o seu antigo e-mail.",
        })
      }
    }
  
    // Update name if changed
    const currentName = user.user_metadata?.full_name || user.user_metadata?.name
    if (userData.name && userData.name !== currentName) {
      changesMade = true
      const { error: nameError } = await supabase.auth.updateUser({
        data: { full_name: userData.name }
      })
      if (nameError) {
        toast({
          title: "Erro ao atualizar nome",
          description: nameError.message,
          variant: "destructive"
        })
        hasError = true
      }
    }
    
    // Update password if new password is provided
    if (passwordData.newPassword) {
      changesMade = true
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: "Erro de senha",
          description: "As novas senhas não coincidem.",
          variant: "destructive"
        })
        hasError = true
      } else {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: passwordData.newPassword
        })
  
        if (passwordError) {
          toast({
            title: "Erro ao alterar senha",
            description: passwordError.message,
            variant: "destructive"
          })
          hasError = true
        } else {
          toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." })
          setPasswordData({ newPassword: '', confirmPassword: '' })
        }
      }
    }
  
    if (!hasError && changesMade) {
      toast({ title: "Perfil salvo", description: "Suas informações foram atualizadas." })
      fetchUserData();
    } else if (!changesMade) {
      toast({
        title: "Nenhuma alteração",
        description: "Você não modificou nenhum campo.",
        variant: 'default'
      })
    }
  
    setIsProfileSaving(false)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envConfig)
      })

      if (res.ok) {
        toast({ title: "Configurações salvas", description: "O arquivo .env foi atualizado com sucesso." })
      } else {
        throw new Error('Falha ao salvar .env')
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Houve um problema ao atualizar o arquivo .env",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setEnvConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleUserInputChange = (key: string, value: string) => {
    setUserData(prev => ({ ...prev, [key]: value }))
  }
  
  const handlePasswordInputChange = (key: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <AdminHeader title="Configurações Globais" />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="animate-spin text-indigo-600 w-10 h-10" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <AdminHeader title="Configurações Globais" />
      
      <div className="p-8 space-y-8 max-w-5xl mx-auto w-full">
        {/* Banner informativo */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              Edição Direta do Arquivo .env
              <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px] uppercase font-bold tracking-tighter bg-transparent">Cuidado</Badge>
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
              As alterações feitas aqui modificam o arquivo <code>.env</code> na raiz do projeto. Isso afeta as chaves de API globais e a conexão com o banco de dados. Tenha certeza dos dados antes de salvar.
            </p>
          </div>
        </div>

        {/* User Profile */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <CardTitle>Meu Perfil de Administrador</CardTitle>
            </div>
            <CardDescription>Gerencie suas informações de acesso e e-mail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Nome Completo</Label>
                <Input 
                    value={userData.name}
                    onChange={(e) => handleUserInputChange('name', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                    placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">E-mail de Acesso</Label>
                <Input 
                    type="email"
                    value={userData.email}
                    onChange={(e) => handleUserInputChange('email', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                    placeholder="seu@email.com"
                />
              </div>
            </div>
            
            <Separator className="bg-slate-100 dark:bg-slate-800" />
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-4 h-4" /> Alterar Senha
              </h4>
              <p className="text-xs text-slate-500">
                  Preencha os campos abaixo apenas se desejar alterar sua senha.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Nova Senha</Label>
                    <Input 
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                      placeholder="••••••••"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Confirmar Nova Senha</Label>
                    <Input 
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                      placeholder="••••••••"
                    />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleProfileUpdate} disabled={isProfileSaving} className="ml-auto gap-2 bg-indigo-600 hover:bg-indigo-700">
                {isProfileSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isProfileSaving ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </CardFooter>
        </Card>

        {/* API & Intelligence */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <CardTitle>Inteligência Artificial & APIs</CardTitle>
            </div>
            <CardDescription>Gerencie as chaves de acesso e modelos globais da plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  OpenAI API Key
                  <Button variant="ghost" size="sm" className="h-6 px-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setShowKeys(!showKeys)}>
                    {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    type={showKeys ? "text" : "password"} 
                    value={envConfig.OPENAI_API_KEY}
                    onChange={(e) => handleInputChange('OPENAI_API_KEY', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none pl-10 focus-visible:ring-indigo-500"
                    placeholder="sk-..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  Google Gemini API Key
                  <Button variant="ghost" size="sm" className="h-6 px-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setShowKeys(!showKeys)}>
                    {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </Label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    type={showKeys ? "text" : "password"} 
                    value={envConfig.GOOGLE_AI_API_KEY}
                    onChange={(e) => handleInputChange('GOOGLE_AI_API_KEY', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none pl-10 focus-visible:ring-indigo-500"
                    placeholder="AIza..."
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100 dark:bg-slate-800" />

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-4 h-4" /> Configurações de E-mail
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Resend API Key (recomendado)</Label>
                  <Input 
                    type={showKeys ? "text" : "password"}
                    value={envConfig.RESEND_API_KEY}
                    onChange={(e) => handleInputChange('RESEND_API_KEY', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                    placeholder="re_..."
                  />
                  <p className="text-xs text-slate-500">Domínio verificado no Resend. Se preenchido, usa Resend em vez de SMTP.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">E-mail do Remetente</Label>
                  <Input 
                    value={envConfig.EMAIL_SENDER_ADDRESS}
                    onChange={(e) => handleInputChange('EMAIL_SENDER_ADDRESS', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                    placeholder="exemplo@dominio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Nome do Remetente</Label>
                  <Input 
                    value={envConfig.EMAIL_SENDER_NAME}
                    onChange={(e) => handleInputChange('EMAIL_SENDER_NAME', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                    placeholder="Nome do Seu Estúdio"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Usuário SMTP</Label>
                    <Input 
                      value={envConfig.EMAIL_SMTP_USER}
                      onChange={(e) => handleInputChange('EMAIL_SMTP_USER', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                      placeholder="resend"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Senha do E-mail</Label>
                    <Input 
                      type={showKeys ? "text" : "password"}
                      value={envConfig.EMAIL_SENDER_PASSWORD}
                      onChange={(e) => handleInputChange('EMAIL_SENDER_PASSWORD', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                      placeholder="SuaSenhaSuperSecreta"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Host SMTP</Label>
                    <Input 
                      value={envConfig.EMAIL_SMTP_HOST}
                      onChange={(e) => handleInputChange('EMAIL_SMTP_HOST', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Porta SMTP</Label>
                    <Input 
                      value={envConfig.EMAIL_SMTP_PORT}
                      onChange={(e) => handleInputChange('EMAIL_SMTP_PORT', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                      placeholder="587"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stripe & Payments */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <CardTitle>Pagamentos & Stripe</CardTitle>
            </div>
            <CardDescription>Configure as chaves globais para processamento de pagamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  Stripe Secret Key (sk_...)
                  <Button variant="ghost" size="sm" className="h-6 px-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setShowKeys(!showKeys)}>
                    {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    type={showKeys ? "text" : "password"} 
                    value={envConfig.STRIPE_SECRET_KEY}
                    onChange={(e) => handleInputChange('STRIPE_SECRET_KEY', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none pl-10 focus-visible:ring-indigo-500"
                    placeholder="sk_live_..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Stripe Publishable Key (pk_...)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    value={envConfig.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
                    onChange={(e) => handleInputChange('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none pl-10 focus-visible:ring-indigo-500"
                    placeholder="pk_live_..."
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                Stripe Webhook Secret (whsec_...)
                <Button variant="ghost" size="sm" className="h-6 px-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setShowKeys(!showKeys)}>
                  {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </Label>
                <div className="relative">
                  <Zap className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    type={showKeys ? "text" : "password"} 
                    value={envConfig.STRIPE_WEBHOOK_SECRET}
                    onChange={(e) => handleInputChange('STRIPE_WEBHOOK_SECRET', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none pl-10 focus-visible:ring-indigo-500"
                    placeholder="whsec_..."
                  />
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> Necessário para confirmação automática de pagamentos via Webhook.
                </p>
              </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <CardTitle>Configurações de Pagamento de Afiliados</CardTitle>
            </div>
            <CardDescription>Gerencie as configurações globais para pagamentos de afiliados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Habilitar Pagamentos de Afiliados</Label>
                <p className="text-sm text-slate-500">Ativar ou desativar o sistema de pagamentos para afiliados.</p>
              </div>
              <Switch
                checked={affiliatePayoutsEnabled}
                onCheckedChange={setAffiliatePayoutsEnabled}
                disabled={isAffiliateSettingsSaving}
              />
            </div>
            <Separator className="bg-slate-100 dark:bg-slate-800" />
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Valor Mínimo de Pagamento (R$)</Label>
              <Input
                type="number"
                value={minPayoutAmount / 100}
                onChange={(e) => setMinPayoutAmount(parseInt(e.target.value) * 100)}
                className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500"
                placeholder="10.00"
                disabled={isAffiliateSettingsSaving}
              />
              <p className="text-xs text-slate-500">O valor mínimo (em Reais) que um afiliado deve acumular para receber um pagamento.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveAffiliateSettings} disabled={isAffiliateSettingsSaving} className="ml-auto gap-2 bg-indigo-600 hover:bg-indigo-700">
              {isAffiliateSettingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isAffiliateSettingsSaving ? "Salvando..." : "Salvar Configurações de Afiliado"}
            </Button>
          </CardFooter>
        </Card>

        {/* Security & Access */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              <CardTitle>Segurança & Acesso</CardTitle>
            </div>
            <CardDescription>Políticas de registro e segurança global</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Auto-Registro de Estúdios</Label>
                <p className="text-sm text-slate-500">Permitir que qualquer pessoa crie uma conta via /register</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-slate-100 dark:border-slate-800" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Modo de Manutenção</Label>
                <p className="text-sm text-slate-500 text-red-500">Bloqueia o acesso de todos os estúdios para manutenção programada</p>
              </div>
              <Switch />
            </div>
            <Separator className="bg-slate-100 dark:border-slate-800" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Aprovação Manual de Novos Estúdios
                </Label>
                <p className="text-sm text-slate-500">Novos estúdios precisam de aprovação admin para começar a usar</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-6 bg-slate-900 rounded-2xl border border-slate-800">
          <div>
            <p className="text-white font-bold">Salvar Alterações</p>
            <p className="text-xs text-slate-400">As mudanças afetam todos os estúdios instantaneamente.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="text-slate-400 hover:text-white">Cancelar</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 px-8" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Salvando..." : "Aplicar Configurações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
