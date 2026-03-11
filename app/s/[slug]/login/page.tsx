"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FireExtinguisher, Sparkles, Eye, EyeOff, Loader2, ArrowLeft, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { nicheDictionary } from "@/config/niche-dictionary"

import { getPublicStudioBySlug } from "@/lib/actions/studios"

function StudioStudentLoginContent() {
  const { slug } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') || 'client'
  const { toast } = useToast()
  const [studio, setStudio] = useState<any>(null)
  const [vocabulary, setVocabulary] = useState<any>(nicheDictionary.pt.dance)
  const [niche, setNiche] = useState<string>('dance')
  const isFire = niche === 'fire_protection' || niche === 'fire-protection'
  const [isLoadingStudio, setIsLoadingStudio] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ 
    email: searchParams.get("email") || "", 
    password: "" 
  })

  useEffect(() => {
    async function loadStudio() {
      const { data, error } = await getPublicStudioBySlug(slug as string)

      if (error || !data) {
        toast({ title: "Estabelecimento não encontrado", variant: "destructive" })
        router.push("/login")
        return
      }
      setStudio(data)
      
      const settings = data.organization_settings?.[0] || data.organization_settings
      if (settings?.vocabulary) {
          setVocabulary(settings.vocabulary)
      }
      if (settings?.niche) {
          setNiche(settings.niche)
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
        body: JSON.stringify({ ...formData, portal: 'student', studioSlug: slug })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Se a API indicar redirecionamento para join (porque o vínculo não existia)
        if (data.redirectToJoin) {
          toast({ title: "Quase lá!", description: "Agora confirme seu vínculo ao estúdio.", duration: 3000 });
          router.push(`/s/${slug}/join?role=${roleParam}`);
          return;
        }

        // Validação de estúdio:
        // Para alunos, deve pertencer a este estúdio.
        // Para profissionais (engenheiros/arquitetos), permitimos o login para que ele possa ser vinculado ou trocar de estúdio.
        const isProfessional = ['engineer', 'architect', 'professional', 'teacher'].includes(data.user.role);
        
        if (!isProfessional && data.user.studio_id !== studio.id) {
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
        
        const redirectUrl = searchParams.get('redirect')
        if (redirectUrl) {
             router.push(decodeURIComponent(redirectUrl))
        } else {
             router.push(data.user.role === 'student' ? '/student' : (['engineer', 'architect'].includes(data.user.role) ? '/solutions/fire-protection/engineer' : (['professional', 'teacher'].includes(data.user.role) ? '/technician' : '/dashboard')))
        }
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
      <Loader2 className={cn("w-8 h-8 animate-spin", isFire ? "text-red-600" : "text-indigo-600")} />
    </div>
  )

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500", 
      isFire ? "bg-slate-950" : "bg-slate-50 dark:bg-slate-950"
    )}>
      {isFire && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600 rounded-full blur-[128px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600 rounded-full blur-[128px]" />
        </div>
      )}
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          {isFire ? (
            <Link href="/solutions/fire-protection" className="flex items-center justify-center gap-2.5 font-bold text-2xl tracking-tight text-white hover:opacity-80 transition-opacity mb-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg">
                  <FireExtinguisher className="w-5 h-5 fill-current" />
                </div>
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Fire<span className="text-red-500 font-black">Control</span>
              </span>
            </Link>
          ) : (
            <div className={cn(
              "mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110",
              "bg-indigo-600 shadow-indigo-200"
            )}>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          )}
          
          <h1 className={cn("text-3xl font-black tracking-tighter", isFire ? "text-white" : "text-slate-900 dark:text-white")}>
            Portal do {
              roleParam === 'professional' ? (isFire ? 'Técnico PPCI' : vocabulary.provider) : 
              roleParam === 'engineer' ? (isFire ? 'Engenheiro PPCI' : 'Engenheiro') :
              roleParam === 'architect' ? (isFire ? 'Arquiteto PPCI' : 'Arquiteto') :
              vocabulary.client
            }
          </h1>
          <p className={cn("text-sm font-bold uppercase tracking-[0.2em]", isFire ? "text-red-600" : "text-indigo-600")}>
            {studio.name}
          </p>
        </div>

        <Card className={cn(
          "border-none shadow-2xl transition-all", 
          isFire ? "bg-slate-900/80 backdrop-blur-xl text-white border border-white/5" : "bg-white dark:bg-slate-900"
        )}>
          <CardHeader className="text-center">
            <CardTitle className={cn("text-2xl font-bold", isFire ? "text-white" : "")}>Entrar</CardTitle>
            <CardDescription className={isFire ? "text-slate-400 font-medium" : ""}>
              {niche === 'fire_protection' 
                ? `Acesse seus vistorias, laudos e pagamentos` 
                : `Acesse seus ${vocabulary.service.toLowerCase()}s e pagamentos`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={isFire ? "text-slate-300" : ""}>E-mail ou Telefone</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="seu@email.com ou (00) 00000-0000"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={cn(isFire ? "bg-slate-800 border-white/10 text-white focus:border-red-600" : "", "focus:ring-0 focus:ring-offset-0 focus:shadow-none")}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={isFire ? "text-slate-300" : ""}>Senha</Label>
                  <Link href={`/forgot-password?returnTo=${encodeURIComponent(`/s/${slug}/login${roleParam ? `?role=${roleParam}` : ''}`)}`} className={cn("text-xs font-bold hover:underline", isFire ? "text-red-600" : "text-indigo-600")}>
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
                    className={cn(isFire ? "bg-slate-800 border-white/10 text-white focus:border-red-600" : "", "focus:ring-0 focus:ring-offset-0 focus:shadow-none")}
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
              <Button 
                className={cn(
                  "w-full h-12 font-bold transition-all", 
                  isFire 
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98]" 
                    : "bg-indigo-600 hover:bg-indigo-700"
                )} 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Acessar Portal"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className={cn("text-sm", isFire ? "text-slate-400" : "text-slate-500")}>
                Ainda não tem cadastro?{" "}
                <Link 
                  href={`/s/${studio.slug}/register${roleParam ? `?role=${roleParam}` : ''}`} 
                  className={cn("font-bold hover:underline underline-offset-4 decoration-2", isFire ? "text-red-600" : "text-indigo-600")}
                >
                  Criar conta no {vocabulary.establishment.toLowerCase()}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <button 
          onClick={() => router.push(isFire ? "/solutions/fire-protection/login" : "/login")}
          className={cn(
            "w-full text-center text-xs flex items-center justify-center gap-2 transition-all hover:gap-3", 
            isFire ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <ArrowLeft className="w-3 h-3" /> {isFire ? "Voltar para FireControl" : "Voltar para login geral"}
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
