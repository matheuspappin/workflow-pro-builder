"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Leaf, Shield, Eye, EyeOff, Loader2, ArrowLeft,
  Building2, User, Wrench, PencilRuler, DollarSign, ChevronDown,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getSessionKey } from "@/lib/constants/storage-keys"

const AGRO_SESSION_KEY = getSessionKey('agroflowai')

type RoleId = 'super_admin' | 'admin' | 'student' | 'teacher' | 'engineer' | 'finance'

const profiles: { id: RoleId; label: string; icon: React.ComponentType<{ className?: string }>; description?: string }[] = [
  { id: 'super_admin', label: 'Administrador do Sistema', icon: Shield, description: 'Super Admin / Painel akaaicore' },
  { id: 'admin', label: 'Empresa / Consultoria', icon: Building2 },
  { id: 'finance', label: 'Financeiro', icon: DollarSign },
  { id: 'engineer', label: 'Engenheiro Ambiental', icon: PencilRuler },
  { id: 'teacher', label: 'Técnico de Campo', icon: Wrench },
  { id: 'student', label: 'Cliente / Proprietário Rural', icon: User },
]

function LoginContent() {
  const router = useRouter()
  const { toast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<RoleId>('admin')
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  const currentProfile = profiles.find((p) => p.id === role) ?? profiles[1]

  React.useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const stored = localStorage.getItem(AGRO_SESSION_KEY)
        const parsed = stored ? JSON.parse(stored) : null
        const userRole = parsed?.role || session.user.user_metadata?.role || 'admin'
        redirectByRole(userRole)
      }
    }
    checkSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function redirectByRole(userRole: string) {
    if (userRole === 'super_admin') router.push("/admin")
    else if (userRole === 'student') router.push("/solutions/agroflowai/client")
    else if (userRole === 'teacher') router.push("/solutions/agroflowai/dashboard")
    else if (userRole === 'engineer') router.push("/solutions/agroflowai/dashboard")
    else if (userRole === 'finance') router.push("/solutions/agroflowai/dashboard/financeiro")
    else router.push("/solutions/agroflowai/dashboard")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      let portal = 'admin'
      if (role === 'student') portal = 'client'
      if (role === 'teacher' || role === 'engineer') portal = 'professional'
      if (role === 'finance' || role === 'super_admin') portal = 'admin'

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, portal, language: 'pt' })
      })
      const data = await response.json()

      if (response.ok && data.success) {
        const roleLabels: Record<string, string> = {
          super_admin: 'Super Admin',
          admin: 'Empresa',
          finance: 'Financeiro',
          engineer: 'Engenheiro',
          teacher: 'Técnico',
          student: 'Proprietário Rural',
        }
        toast({
          title: "Bem-vindo de volta!",
          description: `Acessando como ${roleLabels[data.user.role] ?? 'Usuário'}`,
        })
        localStorage.setItem(AGRO_SESSION_KEY, JSON.stringify(data.user))
        if (data.session) {
          const { error } = await supabase.auth.setSession(data.session)
          if (error) console.error("Erro ao setar sessão:", error)
        }
        await new Promise(resolve => setTimeout(resolve, 500))
        redirectByRole(data.user.role)
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

  return (
    <div className="min-h-screen bg-slate-950 flex relative font-sans">
      <button
        type="button"
        onClick={() => router.push("/solutions/agroflowai")}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Left Side — AgroFlowAI Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-[128px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400 rounded-full blur-[128px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <Link href="/solutions/agroflowai" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-2xl">
            <Leaf className="w-6 h-6 text-emerald-700" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">
            Agro<span className="text-emerald-200">Flow</span>AI
          </span>
        </Link>

        <div>
          <h1 className="text-5xl font-black text-white mb-6 leading-tight tracking-tighter">
            Compliance Ambiental <br />
            <span className="text-emerald-200">para o Agronegócio</span>
          </h1>
          <p className="text-emerald-50/80 text-xl max-w-lg font-medium leading-relaxed">
            Laudos técnicos, regularização CAR, monitoramento satelital e gestão de equipes em uma única plataforma.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Laudos / OS", value: "Técnicos" },
              { label: "Monitor", value: "Satelital" },
              { label: "CAR", value: "Regulação" },
              { label: "Portal", value: "Clientes" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest">{item.label}</p>
                <p className="text-white text-lg font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full bg-emerald-700/50 border-2 border-emerald-400/30 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-emerald-100/70 text-sm font-bold uppercase tracking-widest">
            Consultorias no Brasil
          </p>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="relative w-full max-w-md">
          <div className="lg:hidden mb-12 text-center">
            <Link href="/solutions/agroflowai" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">
                Agro<span className="text-emerald-500">Flow</span>AI
              </span>
            </Link>
          </div>

          <Card className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
            <CardHeader className="text-center space-y-1 pt-8">
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Acessar sistema</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Selecione seu perfil e faça login
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              {/* Seletor de Perfil */}
              <div className="mb-6">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-2">Perfil de acesso</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-slate-800/50 transition-all duration-200",
                      profileDropdownOpen
                        ? "border-emerald-500/40 ring-2 ring-emerald-500/20"
                        : "border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        role === 'super_admin' && "bg-amber-600/30 text-amber-300",
                        role === 'admin' && "bg-emerald-500/20 text-emerald-400",
                        role === 'finance' && "bg-teal-500/20 text-teal-400",
                        role === 'engineer' && "bg-blue-500/20 text-blue-400",
                        role === 'teacher' && "bg-orange-500/20 text-orange-400",
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
                              role === p.id ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
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
                    className="bg-slate-800/50 border-white/5 text-white h-11 rounded-xl placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Senha</Label>
                    <Link href="/forgot-password?returnTo=/solutions/agroflowai/login" className="text-xs text-emerald-500/80 hover:text-emerald-400 transition-colors">
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
                      className="bg-slate-800/50 border-white/5 text-white h-11 pr-12 rounded-xl placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
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
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-3 animate-spin" />AUTENTICANDO...</>
                  ) : (
                    "ENTRAR NO SISTEMA"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
                <p className="text-center text-sm text-slate-500">
                  Não possui conta?{" "}
                  <Link href="/solutions/agroflowai/register" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
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
                  href="/solutions/agroflowai"
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
            <span>•</span>
            <span className="text-xs">SSL 256-bit</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgroFlowAILoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
