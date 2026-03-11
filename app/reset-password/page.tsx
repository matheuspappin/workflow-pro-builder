"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo") || "/login"
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Opcional: Verificar se há uma sessão ativa ao carregar a página
  // O Supabase lida com o token via hash URL automaticamente, mas é bom validar.
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Se não houver sessão, o link pode ter expirado ou é inválido
        // toast({
        //   title: "Link inválido ou expirado",
        //   description: "Solicite um novo link de redefinição.",
        //   variant: "destructive",
        // })
        // router.push("/forgot-password")
      }
    }
    checkSession()
  }, [router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "Certifique-se de que ambas as senhas sejam iguais.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast({
          title: "Erro ao redefinir",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setIsSuccess(true)
        toast({
          title: "Senha alterada!",
          description: "Sua senha foi redefinida com sucesso.",
        })
        
        // Limpar qualquer dado de usuário antigo do localStorage para forçar login limpo
        localStorage.removeItem("danceflow_user")

        setTimeout(() => {
          router.push(returnTo)
        }, 3000)
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      toast({
        title: "Erro de conexão",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              Workflow <span className="text-indigo-600">AI</span>
            </span>
          </Link>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black">Nova Senha</CardTitle>
            <CardDescription>
              {isSuccess 
                ? "Senha atualizada com sucesso!" 
                : "Escolha uma senha forte para sua segurança."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Tudo pronto! Você será redirecionado para o login em instantes.
                  </p>
                </div>
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold"
                  onClick={() => router.push(returnTo)}
                >
                  Ir para o Login Agora
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-slate-50 dark:bg-slate-800 border-none h-12 pr-10"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-slate-50 dark:bg-slate-800 border-none h-12"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Lock className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    "Redefinir Senha"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
