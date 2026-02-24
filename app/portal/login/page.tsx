"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft, User, GraduationCap, FireExtinguisher, Shield, ClipboardCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { useOrganization } from "@/components/providers/organization-provider"
import logger from "@/lib/logger"
import { LanguageSwitcher } from "@/components/common/language-switcher"

function PortalLoginContent() {
  const router = useRouter()
  const { vocabulary, t, niche } = useVocabulary()
  const { language } = useOrganization()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const isFireProtection = niche === 'fire_protection' || searchParams.get('niche') === 'fire_protection'
  const themeColor = isFireProtection ? "red-600" : "indigo-600"
  const themeGradient = isFireProtection ? "from-red-600 to-orange-600" : "from-indigo-600 to-violet-600"
  const themeShadow = isFireProtection ? "shadow-red-200" : "shadow-indigo-200"
  const MainIcon = isFireProtection ? FireExtinguisher : Sparkles
  const UserIcon = isFireProtection ? Shield : User
  const ProIcon = isFireProtection ? ClipboardCheck : GraduationCap

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Perfil sugerido via query param
  const suggestedRole = searchParams.get("role") || "client"
  const [activeRole, setActiveRole] = useState(suggestedRole)
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Usamos portal: 'client' ou 'professional'
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, portal: activeRole, language, niche: isFireProtection ? 'fire_protection' : niche })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: language === 'pt' ? "Bem-vindo ao Portal!" : "Welcome to the Portal!",
          description: (language === 'pt' ? "Olá, " : "Hello, ") + data.user.name + "!",
        })
        
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        
        if (data.session) {
          await supabase.auth.setSession(data.session)
        }
        
        // Redirecionamento automático baseado no returnTo ou role
        const returnTo = searchParams.get('returnTo')
        // Super Admin SEMPRE vai para /admin — nunca respeita returnTo
        if (data.user.role === 'super_admin') {
          router.push("/admin")
        } else if (returnTo) {
          router.push(decodeURIComponent(returnTo))
        } else if (data.user.role === 'client' || data.user.role === 'student') {
          router.push("/student")
        } else if (data.user.role === 'professional' || data.user.role === 'teacher') {
          router.push("/teacher")
        } else if (data.user.role === 'engineer' || data.user.role === 'architect') {
          router.push("/solutions/fire-protection/engineer")
        } else if (data.user.role === 'partner' || data.user.role === 'affiliate') {
          router.push("/portal/affiliate/dashboard")
        } else {
          // Se um admin logar por aqui, manda pro dashboard normal
          router.push("/dashboard")
        }
      } else {
        toast({
          title: t.auth.login.errorTitle,
          description: data.error || t.auth.login.errorDesc,
          variant: "destructive",
        })
      }
    } catch (error) {
      logger.error('Erro ao entrar:', error)
      toast({
        title: t.auth.login.connectionErrorTitle,
        description: t.auth.login.connectionErrorDesc,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher showIcon />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href={isFireProtection ? "/portal?niche=fire_protection" : "/portal"} className="inline-flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${themeGradient} flex items-center justify-center shadow-lg ${themeShadow}`}>
              <MainIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              Portal
            </span>
          </Link>
          <p className="text-slate-500 font-medium">
            {isFireProtection 
              ? (language === 'pt' ? "Acesse seus laudos, certificados e vistorias." : "Access your reports, certificates and inspections.")
              : (language === 'pt' ? "Acesse sua conta, agenda e muito mais." : "Access your account, schedule and more.")
            }
          </p>
        </div>

        <Card className="w-full shadow-xl shadow-slate-200/50 border-slate-200/80">
          <CardHeader>
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <Button 
                  onClick={() => setActiveRole("client")}
                  variant={activeRole === "client" ? "default" : "ghost"}
                  className={`w-full rounded-lg px-6 font-bold ${activeRole === "client" ? `bg-${themeColor} text-white shadow` : "text-slate-500"}`}
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  {vocabulary.client}
                </Button>
                <Button 
                  onClick={() => setActiveRole("professional")}
                  variant={activeRole === "professional" ? "default" : "ghost"}
                  className={`w-full rounded-lg px-6 font-bold ${activeRole === "professional" ? `bg-${themeColor} text-white shadow` : "text-slate-500"}`}
                >
                  <ProIcon className="w-4 h-4 mr-2" />
                  {isFireProtection ? "Técnico" : vocabulary.provider}
                </Button>
              </div>
            </div>
            <CardTitle className="text-2xl font-black tracking-tighter text-slate-800">
              {activeRole === "client" 
                ? (language === 'pt' ? `Acessar como ${vocabulary.client}` : `Access as ${vocabulary.client}`)
                : (language === 'pt' ? `Acessar como ${isFireProtection ? "Técnico" : vocabulary.provider}` : `Access as ${isFireProtection ? "Technician" : vocabulary.provider}`)
              }
            </CardTitle>
            <CardDescription>
              {activeRole === "client" 
                ? (language === 'pt' ? (isFireProtection ? "Entre para ver seus equipamentos e laudos." : "Entre com seu e-mail e senha para ver sua agenda.") : (isFireProtection ? "Log in to see your equipment and reports." : "Log in with your email and password to see your schedule."))
                : (language === 'pt' ? (isFireProtection ? "Acesse para registrar vistorias e manutenções." : `Acesse seu painel para gerenciar seus ${vocabulary.client.toLowerCase()}s.`) : (isFireProtection ? "Access to record inspections and maintenance." : `Access your dashboard to manage your ${vocabulary.client.toLowerCase()}s.`))
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">{t.auth.login.emailOrPhone}</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={t.auth.login.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={`bg-slate-50 dark:bg-slate-900 h-12 border-slate-200 focus:border-${themeColor}`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t.auth.login.password}</Label>
                  <Link href="/forgot-password" passHref>
                    <span className={`text-sm font-medium text-${themeColor} hover:underline`}>
                      {t.auth.login.forgotPassword}
                    </span>
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className={`bg-slate-50 dark:bg-slate-900 h-12 border-slate-200 focus:border-${themeColor} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-${themeColor}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className={`w-full h-12 text-lg font-bold bg-${themeColor} hover:bg-${themeColor.replace('600', '700')} text-white rounded-xl`} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : t.auth.login.submit}
              </Button>
            </form>
            <p className="text-center text-sm text-slate-500">
              {t.auth.login.noAccount}{" "}
              <Link href={`/portal/register?role=${activeRole}${isFireProtection ? '&niche=fire_protection' : ''}${searchParams.get('returnTo') ? `&returnTo=${encodeURIComponent(searchParams.get('returnTo') as string)}` : ''}`} passHref>
                <span className={`font-bold text-${themeColor} hover:underline`}>
                  {t.auth.login.registerNow}
                </span>
              </Link>
            </p>
            
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link href="/portal/affiliate/login" className={`text-xs font-medium text-slate-500 hover:text-${themeColor} transition-colors`}>
                {language === 'pt' ? "Você é um parceiro/afiliado? " : "Are you a partner/affiliate? "}
                <span className="underline">{language === 'pt' ? "Acesse seu portal aqui" : "Access your portal here"}</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Link href={isFireProtection ? "/portal?niche=fire_protection" : "/portal"} className={`flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-${themeColor} transition-colors`}>
          <ArrowLeft className="w-4 h-4" /> {language === 'pt' ? "Voltar para a página inicial do portal" : "Back to portal home page"}
        </Link>
      </div>
    </div>
  )
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <PortalLoginContent />
    </Suspense>
  )
}
