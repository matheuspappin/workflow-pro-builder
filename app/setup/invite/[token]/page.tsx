"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, ArrowRight, Building2 } from "lucide-react"
import { claimEcosystem } from "@/lib/actions/ecosystem"
import { toast } from "sonner"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase"

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoadingUser(false)
    }
    checkUser()
  }, [])

  const handleClaim = async () => {
    if (!user) {
      // Redirecionar para login/registro com return url
      const returnUrl = encodeURIComponent(`/setup/invite/${params.token}`)
      router.push(`/register?returnTo=${returnUrl}`)
      return
    }

    setClaiming(true)
    try {
      await claimEcosystem(params.token as string)
      setClaimed(true)
      toast.success("Sistema vinculado à sua conta com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao resgatar convite")
    } finally {
      setClaiming(false)
    }
  }

  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  if (claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md text-center border-emerald-500/20">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Tudo Pronto!</CardTitle>
            <CardDescription>
              O sistema agora é seu. Você já pode começar a configurar seu negócio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full h-12 text-lg font-bold">
                Acessar meu Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">Convite Especial</CardTitle>
            <CardDescription>
              Você foi convidado para gerenciar um ecossistema <strong>Workflow AI</strong>.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg text-sm text-center">
            Este link concede acesso administrativo total ao sistema configurado para você.
          </div>

          {!user ? (
            <div className="space-y-3">
              <Button onClick={handleClaim} className="w-full h-12 font-bold">
                Criar Conta para Aceitar
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Já tem conta? <Link href={`/login?returnTo=/setup/invite/${params.token}`} className="underline text-indigo-600">Faça login</Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="text-sm">
                  <p className="font-medium">Logado como</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button onClick={handleClaim} disabled={claiming} className="w-full h-12 font-bold bg-indigo-600 hover:bg-indigo-700">
                {claiming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Aceitar e Vincular à Conta"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
