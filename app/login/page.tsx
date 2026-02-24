"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Zap, Eye, EyeOff, Loader2, ArrowLeft, Shield,
  PencilRuler, Users, Building2, User, GraduationCap,
  BarChart3, Bot, Layers, Globe, DollarSign, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useOrganization } from "@/components/providers/organization-provider"
import { LanguageSwitcher } from "@/components/common/language-switcher"

function LoginContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { language } = useOrganization()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'super_admin' | 'admin' | 'student' | 'teacher' | 'engineer' | 'finance'>('super_admin')
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  const profiles = [
    { id: 'super_admin' as const, label: 'Administrador do Sistema', icon: Shield, description: 'Super Admin / Painel Workflow Pro' },
    { id: 'admin' as const, label: 'Empresa', icon: Building2 },
    { id: 'finance' as const, label: 'Financeiro', icon: DollarSign },
    { id: 'teacher' as const, label: 'Profissional', icon: GraduationCap },
    { id: 'engineer' as const, label: 'Engenheiro', icon: PencilRuler },
    { id: 'student' as const, label: 'Cliente', icon: User },
  ]
  const currentProfile = profiles.find((p) => p.id === role) ?? profiles[0]

  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  React.useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const storedUser = localStorage.getItem("danceflow_user")
        const parsedUser = storedUser ? JSON.parse(storedUser) : null
        const userRole = parsedUser?.role || session.user.user_metadata?.role || 'admin'
        // Super Admin SEMPRE vai para /admin — nunca respeita returnTo para dashboard/estúdio
        if (userRole === 'super_admin') { router.push("/admin"); return }
        if (returnTo) { router.push(returnTo); return }
        if (userRole === 'engineer') router.push("/solutions/fire-protection/engineer")
        else if (userRole === 'technician' || userRole === 'teacher') router.push("/technician")
        else if (userRole === 'student') router.push("/student")
        else if (userRole === 'finance') router.push("/dashboard/financeiro")
        else router.push("/dashboard")
      }
    }
    checkSession()
  }, [router, returnTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      let portal = 'admin'
      if (role === 'student') portal = 'client'
      if (role === 'teacher') portal = 'professional'
      if (role === 'engineer') portal = 'engineer'
      if (role === 'finance' || role === 'super_admin') portal = 'admin'

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, portal, language })
      })
      const data = await response.json()

      if (response.ok && data.success) {
        toast({ title: "Bem-vindo de volta!", description: "Redirecionando para o painel..." })
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        if (data.session) {
          await supabase.auth.setSession(data.session)
        }
        await new Promise(resolve => setTimeout(resolve, 400))
        // Super Admin SEMPRE vai para /admin — nunca respeita returnTo
        if (data.user.role === 'super_admin') {
          router.push("/admin")
        } else if (returnTo) {
          router.push(returnTo)
        } else if (data.user.role === 'student') {
          router.push("/student")
        } else if (data.user.role === 'teacher' || data.user.role === 'technician') {
          router.push("/technician")
        } else if (data.user.role === 'engineer') {
          router.push("/solutions/fire-protection/engineer")
        } else if (data.user.role === 'finance') {
          router.push("/dashboard/financeiro")
        } else {
          router.push("/dashboard")
        }
      } else {
        toast({
          title: "Erro ao entrar",
          description: data.error || "E-mail ou senha incorretos.",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Verifique sua conexão e tente novamente.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    { icon: BarChart3, text: "Dashboards inteligentes em tempo real" },
    { icon: Bot, text: "IA generativa para gestão automatizada" },
    { icon: Layers, text: "Multi-nicho: dança, saúde, serviços e mais" },
    { icon: Globe, text: "White-label para verticalizar seu negócio" },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex relative font-sans">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <Link
        href="/"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Site
      </Link>

      {/* Left Side — WorkflowAI Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full blur-[128px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600 rounded-full blur-[128px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
            <Zap className="w-6 h-6 text-indigo-300 fill-current" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">
            Workflow <span className="text-indigo-300">Pro</span>
          </span>
        </Link>

        <div>
          <h1 className="text-5xl font-black text-white mb-6 leading-tight tracking-tighter">
            A plataforma central da sua<br />
            <span className="text-indigo-300">gestão inteligente</span>
          </h1>
          <p className="text-indigo-100/70 text-xl max-w-lg font-medium leading-relaxed mb-10">
            Gerencie seu negócio com IA, automatize processos e escale com verticalizations white-label.
          </p>
          <ul className="space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-indigo-300" />
                </div>
                <span className="text-indigo-100/80 text-sm font-medium">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-indigo-800/50 border-2 border-indigo-400/30 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-indigo-200/60 text-sm font-bold uppercase tracking-widest">
            +2.000 Empresas Ativas
          </p>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />
        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Zap className="w-6 h-6 text-white fill-current" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">
                Workflow <span className="text-indigo-400">Pro</span>
              </span>
            </Link>
          </div>

          <Card className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
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
                        ? "border-indigo-500/40 ring-2 ring-indigo-500/20"
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
                              role === p.id ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <p.icon className="w-4 h-4 shrink-0 opacity-70" />
                            <div className="flex flex-col items-start">
                              <span className="font-medium text-sm">{p.label}</span>
                              {p.description && (
                                <span className="text-[10px] text-slate-500 mt-0.5">{p.description}</span>
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
                  <Label htmlFor="email" className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-slate-800/50 border-white/5 text-white h-11 rounded-xl placeholder:text-slate-500 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Senha</Label>
                    <Link href="/forgot-password" className="text-xs text-indigo-500/80 hover:text-indigo-400 transition-colors">
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
                      className="bg-slate-800/50 border-white/5 text-white h-11 pr-12 rounded-xl placeholder:text-slate-500 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
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
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> AUTENTICANDO...</>
                  ) : (
                    "ENTRAR NA PLATAFORMA"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
                <p className="text-center text-sm text-slate-500">
                  Não possui conta?{" "}
                  <Link href="/register" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
                    Criar conta grátis
                  </Link>
                </p>
                <Link
                  href="/portal/affiliate/login"
                  className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  Portal de Afiliados
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
