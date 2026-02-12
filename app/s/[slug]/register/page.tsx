"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft, Check, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import { isLimitReached, PLAN_LIMITS } from "@/lib/plan-limits"

import { nicheDictionary } from "@/config/niche-dictionary"

export default function StudioStudentRegister() {
  const { slug } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [studio, setStudio] = useState<any>(null)
  const [vocabulary, setVocabulary] = useState<any>(nicheDictionary.dance) // Default fallback
  const [isLoadingStudio, setIsLoadingStudio] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    birthDate: "",
    address: ""
  })

  useEffect(() => {
    async function loadStudio() {
      const { data, error } = await supabase
        .from('studios')
        .select(`
          id, 
          name, 
          slug, 
          plan,
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
          // Handle case where it might be a single object returned if not array
          setVocabulary(data.organization_settings.vocabulary)
      }
      setIsLoadingStudio(false)
    }
    loadStudio()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar força da senha
    const strength = checkPasswordStrength(formData.password)
    if (strength.score < MIN_STRONG_PASSWORD_SCORE) {
      toast({
        title: "Senha muito fraca",
        description: "Por favor, siga os requisitos para criar uma senha segura.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 0. Verificar limite do plano do estúdio
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('studio_id', studio.id)

      if (isLimitReached(studentCount || 0, studio.plan, 'maxStudents')) {
        toast({
          title: `${vocabulary.establishment} Lotado`,
          description: `Este ${vocabulary.establishment.toLowerCase()} atingiu o limite de ${vocabulary.client.toLowerCase()}s do plano atual. Entre em contato com a administração.`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // 1. Criar a conta via Supabase Auth com metadados do aluno e Studio ID
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            studio_id: studio.id,
            role: 'student',
            phone: formData.phone,
            birth_date: formData.birthDate,
            address: formData.address
          }
        }
      })

      if (authError) throw authError

      // 1.1 Criar o perfil do aluno no banco de dados (Necessário se não houver trigger)
      const { error: profileError } = await supabase.from('students').insert({
        id: authData.user?.id,
        studio_id: studio.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        birth_date: formData.birthDate,
        address: formData.address,
        status: 'active'
      })

      if (profileError) {
        console.error("Erro ao criar perfil de aluno:", profileError)
        // Não lançamos erro aqui para não travar o fluxo se o perfil já existir via trigger
      }

      // 2. Tentar Auto-login (Login Automático)
      // Se não houver sessão (por confirmação de email), forçamos o login manual agora
      let session = authData.session
      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (!signInError) {
          session = signInData.session
        }
      }

      if (session) {
        // 3. Montar os dados do usuário (Priorizamos o que já temos para evitar atraso do gatilho)
        const userData = {
          id: authData.user?.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          birth_date: formData.birthDate,
          address: formData.address,
          role: 'student',
          studio_id: studio.id,
          studioName: studio.name,
          studioSlug: studio.slug,
        }

        localStorage.setItem("danceflow_user", JSON.stringify(userData))
        
        toast({
          title: "Conta criada e logada!",
          description: `Bem-vindo ao ${studio.name}!`,
        })
        
        // Pequeno delay apenas para garantir que o Supabase processou a sessão no navegador
        setTimeout(() => {
          router.push("/student")
        }, 500)
        return
      }

      // Fallback caso não consiga logar automaticamente (ex: confirmação de email pendente)
      toast({
        title: "Conta criada com sucesso!",
        description: `Bem-vindo ao ${studio.name}. Já pode fazer seu login!`,
      })
      
      router.push(`/s/${studio.slug}/login`)
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível criar sua conta.",
        variant: "destructive",
      })
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
            Criar Conta de {vocabulary.client}
          </h1>
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">
            {studio.name}
          </p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>Junte-se ao nosso {vocabulary.establishment.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate || ""}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password || ""}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={formData.password || ""} />
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Criar Minha Conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Já tem cadastro?{" "}
                <Link href={`/s/${studio.slug}/login`} className="text-indigo-600 font-bold hover:underline">
                  Fazer Login
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
