"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, ArrowLeft, User, GraduationCap, FireExtinguisher, Shield, ClipboardCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { useOrganization } from "@/components/providers/organization-provider"
import logger from "@/lib/logger"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { OFFICIAL_LOGO } from "@/config/branding"

function PortalLoginContent() {
  const router = useRouter()
  const { vocabulary, t, niche } = useVocabulary()
  const { language } = useOrganization()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const isFireProtection = niche === 'fire_protection' || searchParams.get('niche') === 'fire_protection'
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher showIcon />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href={isFireProtection ? "/portal?niche=fire_protection" : "/portal"} className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden">
              <Image src={OFFICIAL_LOGO} alt="AKAAI" width={24} height={24} className="w-6 h-6 object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">
              AKAAI <span className="text-primary">CORE</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            {isFireProtection 
              ? (language === 'pt' ? "Acesse seus laudos, certificados e vistorias." : "Access your reports, certificates and inspections.")
              : (language === 'pt' ? "Acesse sua conta, agenda e muito mais." : "Access your account, schedule and more.")
            }
          </p>
        </div>

        <Card className="w-full border-border shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-1 p-1.5 bg-muted rounded-xl w-full">
                <Button 
                  onClick={() => setActiveRole("client")}
                  variant={activeRole === "client" ? "default" : "ghost"}
                  className={`flex-1 rounded-lg px-6 font-bold ${activeRole === "client" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  {vocabulary.client}
                </Button>
                <Button 
                  onClick={() => setActiveRole("professional")}
                  variant={activeRole === "professional" ? "default" : "ghost"}
                  className={`flex-1 rounded-lg px-6 font-bold ${activeRole === "professional" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ProIcon className="w-4 h-4 mr-2" />
                  {isFireProtection ? "Técnico" : vocabulary.provider}
                </Button>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-card-foreground">
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
                  className="bg-background h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t.auth.login.password}</Label>
                  <Link href="/forgot-password?returnTo=/portal/login" className="text-sm font-medium text-primary hover:underline">
                    {t.auth.login.forgotPassword}
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
                    className="bg-background h-11 pr-10"
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

              <Button type="submit" className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : t.auth.login.submit}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              {t.auth.login.noAccount}{" "}
              <Link href={`/portal/register?role=${activeRole}${isFireProtection ? '&niche=fire_protection' : ''}${searchParams.get('returnTo') ? `&returnTo=${encodeURIComponent(searchParams.get('returnTo') as string)}` : ''}`} className="font-bold text-primary hover:underline">
                {t.auth.login.registerNow}
              </Link>
            </p>
            
            <div className="mt-6 pt-4 border-t border-border text-center">
              <Link href="/portal/affiliate/login" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                {language === 'pt' ? "Você é um parceiro/afiliado? " : "Are you a partner/affiliate? "}
                <span className="underline">{language === 'pt' ? "Acesse seu portal aqui" : "Access your portal here"}</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Link href={isFireProtection ? "/portal?niche=fire_protection" : "/portal"} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> {language === 'pt' ? "Voltar para a página inicial do portal" : "Back to portal home page"}
        </Link>
      </div>
    </div>
  )
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PortalLoginContent />
    </Suspense>
  )
}
