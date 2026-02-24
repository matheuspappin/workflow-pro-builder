'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCompleteUserProfile } from '@/lib/actions/auth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const { data: { user: authUser }, error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      if (!authUser) {
        throw new Error('Usuário não identificado após atualizar senha')
      }

      // Tentar login automático
      const profile = await getCompleteUserProfile(authUser.id)
      
      if (profile) {
        // Salvar no localStorage para manter consistência com o login normal
        localStorage.setItem("danceflow_user", JSON.stringify(profile))
        
        toast.success('Senha definida! Entrando no sistema...')
        
        // Redirecionar baseado no role
        setTimeout(() => {
          if (profile.role === 'super_admin') {
            router.push("/admin")
          } else if (profile.role === 'student' || profile.role === 'client') {
            router.push("/student")
          } else if (profile.role === 'teacher' || profile.role === 'professional') {
            router.push("/teacher")
          } else {
            router.push("/dashboard")
          }
        }, 1500)
        return
      }

      // Se falhar o auto-login (perfil não encontrado), mostra a tela de sucesso manual
      setSuccess(true)
      toast.success('Senha definida com sucesso!')
      
      // Pequeno delay para o usuário ver a mensagem de sucesso
      setTimeout(() => {
        router.push('/portal/login')
      }, 3000)

    } catch (error: any) {
      console.error('Erro ao definir senha:', error)
      toast.error(error.message || 'Erro ao definir senha. O link pode ter expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md border-2 border-green-100 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">Tudo pronto!</CardTitle>
            <CardDescription className="text-base">
              Sua senha foi cadastrada com sucesso. Você será redirecionado para a página de login em instantes.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/portal/login')} className="bg-green-600 hover:bg-green-700">
              Ir para Login agora
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 w-full max-w-md shadow-xl border-t-4 border-primary">
        <div className="px-6 space-y-1">
          <h1 className="text-2xl font-bold">Defina sua Senha</h1>
          <p className="text-sm text-muted-foreground">
            Crie uma senha segura para acessar sua conta e visualizar suas ordens de serviço.
          </p>
        </div>
        <form onSubmit={handleSetPassword} className="px-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="pt-2">
            <Button className="w-full h-11 font-bold" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar Senha'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
