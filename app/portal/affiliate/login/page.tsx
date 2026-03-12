"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LanguageSwitcher } from "@/components/common/language-switcher"

import { useOrganization } from "@/components/providers/organization-provider"
import { OFFICIAL_LOGO } from "@/config/branding"

function AffiliateLoginContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { language } = useOrganization()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, portal: 'affiliate', language }) // Importante: Definir portal como 'affiliate'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo de volta, afiliado!`,
        })
        
        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        
        if (data.session) {
          const { error } = await supabase.auth.setSession(data.session)
          if (error) {
             console.error("Erro ao setar sessão client-side:", error)
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500))

        // Redireciona para o dashboard do afiliado
        router.push("/portal/affiliate/dashboard")
        
      } else {
        toast({
          title: "Erro no login",
          description: data.error || "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao entrar:', error)
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
    <div className="min-h-screen bg-background flex relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="hidden lg:flex lg:w-1/2 bg-black p-12 flex-col justify-between">
        <Link href="/portal/affiliate" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
            <Image src={OFFICIAL_LOGO} alt="AKAAI CORE" width={28} height={28} className="object-contain" />
          </div>
          <span className="text-xl font-bold text-white">
            Portal do Afiliado
          </span>
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Seu sucesso começa aqui.
          </h1>
          <p className="text-white/80 text-lg">
            Gerencie seus estúdios e ganhos de forma simples e eficiente.
          </p>
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
            Parceiros de sucesso
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/portal/affiliate" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                <Image src={OFFICIAL_LOGO} alt="AKAAI CORE" width={28} height={28} className="object-contain" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Portal do Afiliado
              </span>
            </Link>
          </div>

          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-card-foreground">Login Afiliado</CardTitle>
              <CardDescription>
                Acesse sua conta de afiliado para começar a gerenciar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail ou WhatsApp</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="seu@email.com ou (00) 00000-0000"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-background h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="/forgot-password?returnTo=/portal/affiliate/login" className="text-sm text-primary hover:underline">
                      Esqueceu a senha?
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

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  Não é afiliado ainda?{" "}
                  <Link href="/portal/affiliate/register" className="font-bold text-primary hover:underline">
                    Criar uma conta
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AffiliateLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AffiliateLoginContent />
    </Suspense>
  )
}
