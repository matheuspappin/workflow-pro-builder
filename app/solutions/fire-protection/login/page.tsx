"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FireExtinguisher, Shield, Eye, EyeOff, Loader2, ArrowLeft, Building2, User, GraduationCap, Ruler, PencilRuler, DollarSign, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useOrganization } from "@/components/providers/organization-provider"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { cn } from "@/lib/utils"

function LoginContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, language } = useOrganization()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'super_admin' | 'admin' | 'student' | 'teacher' | 'engineer' | 'architect' | 'finance'>('admin')
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const profiles = [
    { id: 'super_admin' as const, label: 'Administrador do Sistema', icon: Shield, description: 'Super Admin / Painel akaaicore' },
    { id: 'admin' as const, label: 'Empresa', icon: Building2 },
    { id: 'finance' as const, label: 'Financeiro', icon: DollarSign },
    { id: 'teacher' as const, label: 'Técnico', icon: GraduationCap },
    { id: 'engineer' as const, label: 'Engenheiro', icon: PencilRuler },
    { id: 'architect' as const, label: 'Arquiteto', icon: Ruler },
    { id: 'student' as const, label: 'Cliente', icon: User },
  ]
  const currentProfile = profiles.find((p) => p.id === role) ?? profiles[0]
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Verificar sessão existente
  React.useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const user = session.user
        const storedUser = localStorage.getItem("danceflow_user")
        const parsedUser = storedUser ? JSON.parse(storedUser) : null
        
        const userRole = parsedUser?.role || user.user_metadata?.role || 'admin'
        
        if (userRole === 'engineer') router.push("/solutions/fire-protection/engineer")
        else if (userRole === 'architect') router.push("/solutions/fire-protection/architect")
        else if (userRole === 'technician' || userRole === 'teacher') router.push("/solutions/fire-protection/technician")
        else if (userRole === 'student') router.push("/solutions/fire-protection/client")
        else if (userRole === 'super_admin') router.push("/admin")
        else if (userRole === 'finance') router.push("/solutions/fire-protection/dashboard/financeiro")
        else router.push("/solutions/fire-protection/dashboard")
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Determina o portal com base no role selecionado
      let portal = 'admin'
      if (role === 'student') portal = 'client'
      if (role === 'teacher') portal = 'professional'
      if (role === 'engineer') portal = 'engineer'
      if (role === 'architect') portal = 'architect'
      if (role === 'finance' || role === 'super_admin') portal = 'admin'

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, portal, language })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const roleLabels: Record<string, string> = {
          super_admin: 'Super Admin', admin: 'Empresa', finance: 'Financeiro', teacher: 'Técnico',
          engineer: 'Engenheiro', architect: 'Arquiteto', student: 'Cliente',
        }
        toast({
          title: "Bem-vindo de volta!",
          description: `Acessando o painel como ${roleLabels[role] ?? 'Usuário'}`,
        })
        
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        
        if (data.session) {
          const { error } = await supabase.auth.setSession(data.session)
          if (error) console.error("Erro ao setar sessão:", error)
        }
        
        await new Promise(resolve => setTimeout(resolve, 500))

        if (data.user.role === 'super_admin') router.push("/admin")
        else if (data.user.role === 'student') router.push("/solutions/fire-protection/client")
        else if (data.user.role === 'teacher' || data.user.role === 'technician') router.push("/solutions/fire-protection/technician")
        else if (data.user.role === 'engineer') router.push("/solutions/fire-protection/engineer")
        else if (data.user.role === 'architect') router.push("/solutions/fire-protection/architect")
        else if (data.user.role === 'seller') router.push("/seller")
        else if (data.user.role === 'finance') router.push("/solutions/fire-protection/dashboard/financeiro")
        else router.push("/solutions/fire-protection/dashboard")
      } else {
        toast({
          title: "Erro ao entrar",
          description: data.error || "E-mail ou senha incorretos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao entrar:', error)
      toast({
        title: "Erro de conexão",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLanding = () => {
    router.push("/solutions/fire-protection")
  }

  return (
    <div className="min-h-screen bg-slate-950 flex relative font-sans">
      {/* Botão de Idioma */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <button 
        type="button"
        onClick={handleBackToLanding}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para o Site
      </button>

      {/* Left Side - Fire Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-800 via-red-700 to-orange-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.06%22/%3E%3C/svg%3E')] opacity-80 pointer-events-none" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-amber-400/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-900/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        </div>

        <Link href="/solutions/fire-protection" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-2xl">
            <FireExtinguisher className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">
            Fire<span className="text-red-200">Control</span>
          </span>
        </Link>

        <div>
          <h1 className="text-5xl font-black text-white mb-6 leading-tight tracking-tighter">
            A central de comando da sua <br />
            <span className="text-red-200">Segurança Contra Incêndio</span>
          </h1>
          <p className="text-red-50/80 text-xl max-w-lg font-medium leading-relaxed">
            Gerencie vistorias, rotas de técnicos, validades de extintores e faturamento em uma única plataforma profissional.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full bg-red-800/50 border-2 border-red-400/30 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-red-100/70 text-sm font-bold uppercase tracking-widest">
            +500 Empresas Protegidas
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
        {/* Background - gradient mesh atmosférico */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.15),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(249,115,22,0.08),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_20%_60%,rgba(239,68,68,0.06),transparent)] pointer-events-none" />
        {/* Grid + noise texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_20%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.04%22/%3E%3C/svg%3E')] opacity-40 pointer-events-none" />
        {/* Linhas decorativas sutis */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-red-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-orange-500/8 to-transparent pointer-events-none" />
        <div className="relative w-full max-w-md">
          <div className="lg:hidden mb-12 text-center">
            <Link href="/solutions/fire-protection" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
                <FireExtinguisher className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">
                Fire<span className="text-red-500">Control</span>
              </span>
            </Link>
          </div>

          <Card className="relative overflow-hidden bg-slate-900/90 backdrop-blur-2xl border border-white/[0.06] shadow-2xl shadow-black/60 ring-1 ring-white/[0.04]">
            {/* Glow accent superior */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            {/* Brilho sutil nas bordas */}
            <div className="absolute -inset-px bg-gradient-to-b from-red-500/5 via-transparent to-transparent rounded-[inherit] [mask-image:linear-gradient(black,transparent_70%)] pointer-events-none" />
            <CardHeader className="text-center space-y-1 pt-8">
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Acessar sistema</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Selecione seu perfil e faça login
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              {/* Seletor de Perfil - Dropdown minimalista */}
              <div className="mb-6">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-2">Perfil de acesso</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-slate-800/50 transition-all duration-200",
                      profileDropdownOpen
                        ? "border-red-500/40 ring-2 ring-red-500/20"
                        : "border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        role === 'super_admin' && "bg-amber-600/30 text-amber-300",
                        role === 'admin' && "bg-amber-500/20 text-amber-400",
                        role === 'finance' && "bg-emerald-500/20 text-emerald-400",
                        role === 'teacher' && "bg-blue-500/20 text-blue-400",
                        role === 'engineer' && "bg-violet-500/20 text-violet-400",
                        role === 'architect' && "bg-cyan-500/20 text-cyan-400",
                        role === 'student' && "bg-slate-500/20 text-slate-400"
                      )}>
                        <currentProfile.icon className="w-4 h-4" />
                      </div>
                      <span className="text-white font-medium">{currentProfile.label}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", profileDropdownOpen && "rotate-180")} />
                  </button>
                  {profileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} aria-hidden />
                      <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-black/50 z-50 overflow-hidden">
                        {profiles.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setRole(p.id); setProfileDropdownOpen(false) }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                              role === p.id ? "bg-red-500/10 text-red-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <p.icon className="w-4 h-4 shrink-0 opacity-70" />
                            <div className="flex flex-col items-start">
                              <span className="font-medium text-sm">{p.label}</span>
                              {'description' in p && (p as { description?: string }).description && (
                                <span className="text-[10px] text-slate-500 mt-0.5">{(p as { description?: string }).description}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">E-mail</Label>
                  <Input
                    id="identifier"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-slate-800/50 border-white/5 text-white h-11 rounded-xl placeholder:text-slate-500 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Senha</Label>
                    <Link href="/forgot-password?returnTo=/solutions/fire-protection/login" title="Esqueceu?" className="text-xs text-red-500/80 hover:text-red-400 transition-colors">
                      Esqueceu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="bg-slate-800/50 border-white/5 text-white h-11 pr-12 rounded-xl placeholder:text-slate-500 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      AUTENTICANDO...
                    </>
                  ) : (
                    "ENTRAR NO SISTEMA"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
                <p className="text-center text-sm text-slate-500">
                  Não possui conta?{" "}
                  <Link href="/solutions/fire-protection/register" className="text-red-500 hover:text-red-400 font-medium transition-colors">
                    Criar conta grátis
                  </Link>
                </p>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Super Admin? Acessar painel akaaicore
                </Link>
                <Link
                  href="/solutions/fire-protection"
                  className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar ao site
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 flex items-center justify-center gap-4 text-slate-600">
            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-emerald-500/70" />
              <span>Seguro</span>
            </div>
            <span className="text-slate-600">•</span>
            <span className="text-xs">SSL 256-bit</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
