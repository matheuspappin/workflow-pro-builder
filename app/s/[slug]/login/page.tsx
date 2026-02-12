"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { nicheDictionary } from "@/config/niche-dictionary"

function StudioStudentLoginContent() {
  const { slug } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [studio, setStudio] = useState<any>(null)
  const [vocabulary, setVocabulary] = useState<any>(nicheDictionary.dance)
  const [isLoadingStudio, setIsLoadingStudio] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ 
    email: searchParams.get("email") || "", 
    password: "" 
  })

  useEffect(() => {
    async function loadStudio() {
      const { data, error } = await supabase
        .from('studios')
        .select(`
          id, 
          name, 
          slug,
          organization_settings (
            vocabulary
          )
        `)
        .eq('slug', slug)
        .single()

      if (error || !data) {
        toast({ title: "Estabelecimento não encontrado", variant: "destructive" })
        router.push("/login")
        return
      }
      setStudio(data)
      if (data.organization_settings?.[0]?.vocabulary) {
          setVocabulary(data.organization_settings[0].vocabulary)
      } else if (data.organization_settings?.vocabulary) {
          setVocabulary(data.organization_settings.vocabulary)
      }
      setIsLoadingStudio(false)
    }
    loadStudio()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, portal: 'student' })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Validação extra: Garantir que o aluno pertence a ESTE estúdio
        if (data.user.studio_id !== studio.id) {
          toast({
            title: "Acesso negado",
            description: `Sua conta não pertence ao ${studio.name}.`,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        localStorage.setItem("danceflow_user", JSON.stringify(data.user))
        
        // CRITICAL: Synchronize Supabase Client Session
        if (data.session) {
          await supabase.auth.setSession(data.session)
        }

        toast({ title: `Bem-vindo ao ${studio.name}!` })
        router.push("/student")
      } else {
        toast({ title: "Erro no login", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Erro de conexão", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingStudio) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Portal do {vocabulary.client}
          </h1>
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">
            {studio.name}
          </p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse seus {vocabulary.service.toLowerCase()}s e pagamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="/forgot-password" className="text-xs text-indigo-600 font-bold hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Acessar Portal"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Ainda não tem cadastro?{" "}
                <Link href={`/s/${studio.slug}/register`} className="text-indigo-600 font-bold hover:underline">
                  Criar conta no {vocabulary.establishment.toLowerCase()}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <button 
          onClick={() => router.push("/login")}
          className="w-full text-center text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar para login geral
        </button>
      </div>
    </div>
  )
}

export default function StudioStudentLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando...</div>}>
      <StudioStudentLoginContent />
    </Suspense>
  )
}
