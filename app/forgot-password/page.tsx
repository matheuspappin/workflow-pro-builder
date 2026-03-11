"use client"

import React, { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, ArrowLeft, MailCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

function ForgotPasswordContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo") || "/login"
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
      })

      if (error) {
        toast({
          title: "Erro ao enviar",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setIsSent(true)
        toast({
          title: "E-mail enviado!",
          description: "Verifique sua caixa de entrada para redefinir a senha.",
        })
      }
    } catch (error) {
      console.error('Erro ao solicitar redefinição:', error)
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
            <CardTitle className="text-2xl font-black">Esqueceu a senha?</CardTitle>
            <CardDescription>
              {isSent 
                ? "Enviamos as instruções para o seu e-mail." 
                : "Digite seu e-mail para receber um link de redefinição."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSent ? (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                  <MailCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    O link de redefinição foi enviado para: <br />
                    <span className="font-bold text-slate-900 dark:text-white">{email}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Não recebeu? Verifique sua pasta de spam.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsSent(false)}
                >
                  Tentar outro e-mail
                </Button>
                <Link href={returnTo} className="block text-sm text-indigo-600 font-bold hover:underline">
                  Voltar para o login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail cadastrado</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-50 dark:bg-slate-800 border-none h-12"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Link de Redefinição"
                  )}
                </Button>

                <Link 
                  href={returnTo} 
                  className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-indigo-600 transition-colors py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}
