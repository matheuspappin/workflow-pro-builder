"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft, User, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useVocabulary } from "@/hooks/use-vocabulary"
import logger from "@/lib/logger"

function PortalLoginContent() {
  const router = useRouter()
  const { vocabulary } = useVocabulary()
  const searchParams = useSearchParams()
  const { toast } = useToast()
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
        body: JSON.stringify({ ...formData, portal: activeRole })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Bem-vindo ao Portal!",
          description: `Olá, ${data.user.name}!`,
        })
        
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        
        if (data.session) {
          await supabase.auth.setSession(data.session)
        }
        
        // Redirecionamento automático baseado no role retornado
        if (data.user.role === 'client' || data.user.role === 'student') {
          router.push("/student")
        } else if (data.user.role === 'professional' || data.user.role === 'teacher') {
          router.push("/teacher")
        } else if (data.user.role === 'partner' || data.user.role === 'affiliate') {
          router.push("/portal/affiliate/dashboard")
        } else {
          // Se um admin logar por aqui, manda pro dashboard normal
          router.push("/dashboard")
        }
      } else {
        toast({
          title: "Erro no acesso",
          description: data.error || "Verifique suas credenciais.",
          variant: "destructive",
        })
      }
    } catch (error) {
      logger.error('Erro ao entrar:', error)
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/portal" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              Portal
            </span>
          </Link>
          <p className="text-slate-500 font-medium">
            Acesse sua conta, agenda e muito mais.
          </p>
        </div>

        <Card className="w-full shadow-xl shadow-slate-200/50 border-slate-200/80">
          <CardHeader>
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <Button 
                  onClick={() => setActiveRole("client")}
                  variant={activeRole === "client" ? "default" : "ghost"}
                  className={`w-full rounded-lg px-6 font-bold ${activeRole === "client" ? "bg-indigo-600 text-white shadow" : "text-slate-500"}`}
                >
                  <User className="w-4 h-4 mr-2" />
                  {vocabulary.client}
                </Button>
                <Button 
                  onClick={() => setActiveRole("professional")}
                  variant={activeRole === "professional" ? "default" : "ghost"}
                  className={`w-full rounded-lg px-6 font-bold ${activeRole === "professional" ? "bg-indigo-600 text-white shadow" : "text-slate-500"}`}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  {vocabulary.provider}
                </Button>
              </div>
            </div>
            <CardTitle className="text-2xl font-black tracking-tighter text-slate-800">
              {activeRole === "client" ? `Acessar como ${vocabulary.client}` : `Acessar como ${vocabulary.provider}`}
            </CardTitle>
            <CardDescription>
              {activeRole === "client" 
                ? "Entre com seu e-mail e senha para ver sua agenda."
                : `Acesse seu painel para gerenciar seus ${vocabulary.client.toLowerCase()}s.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">E-mail ou WhatsApp</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="seu@email.com ou (00) 00000-0000"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-slate-50 dark:bg-slate-900 h-12 border-slate-200 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="/forgot-password" passHref>
                    <span className="text-sm font-medium text-indigo-600 hover:underline">
                      Esqueceu?
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
                    className="bg-slate-50 dark:bg-slate-900 h-12 border-slate-200 focus:border-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Entrar"}
              </Button>
            </form>
            <p className="text-center text-sm text-slate-500">
              Não tem uma conta?{" "}
              <Link href={`/portal/register?role=${activeRole}`} passHref>
                <span className="font-bold text-indigo-600 hover:underline">
                  Cadastre-se
                </span>
              </Link>
            </p>
            
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link href="/portal/affiliate/login" className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                Você é um parceiro/afiliado? <span className="underline">Acesse seu portal aqui</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Link href="/portal" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para a página inicial do portal
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
