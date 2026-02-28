"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, ArrowLeft, Building2, UserCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { nicheDictionary } from "@/config/niche-dictionary"

import { getPublicStudioBySlug } from "@/lib/actions/studios"

export default function JoinStudioPage() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') // 'client' or 'professional'
  const router = useRouter()
  const { toast } = useToast()
  const [studio, setStudio] = useState<any>(null)
  const [vocabulary, setVocabulary] = useState<any>(nicheDictionary.pt.dance)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        
        // 1. Carregar Estúdio via Server Action (Bypass RLS)
        const { data: studioData, error: studioError } = await getPublicStudioBySlug(slug as string)

        if (studioError || !studioData) {
          toast({ title: "Estabelecimento não encontrado", variant: "destructive" })
          router.push("/")
          return
        }
        setStudio(studioData)
        const fetchedVocabulary = (studioData.organization_settings as { vocabulary?: any; niche?: any }[] | null)?.[0]?.vocabulary;
        if (fetchedVocabulary) {
          setVocabulary(fetchedVocabulary);
        }

        // 2. Verificar Sessão
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // Guardar a intenção de entrar para após o login
          localStorage.setItem('pending_join_slug', slug as string)
          if (roleParam) localStorage.setItem('pending_join_role', roleParam)
          router.push(`/s/${slug}/login?redirect=/s/${slug}/join${roleParam ? `&role=${roleParam}` : ''}`)
          return
        }

        // 3. Pegar dados do usuário do localStorage ou Supabase
        const userStr = localStorage.getItem('danceflow_user')
        if (userStr) {
          setUser(JSON.parse(userStr))
        } else {
          // Fallback se não estiver no localStorage
          console.log('🔄 Buscando perfil no banco para fallback...');
          const { data: profile } = await supabase
            .from('users_internal')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          
          if (profile) {
            setUser({ ...profile, role: profile.role || 'admin' })
          } else {
            const { data: student } = await supabase
              .from('students')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            
            if (student) {
              setUser({ ...student, role: 'student' })
            } else {
              const { data: teacher } = await supabase
                .from('teachers')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle()
              
              if (teacher) {
                setUser({ ...teacher, id: session.user.id, role: 'teacher' })
              } else {
                setUser(null)
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados de convite:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [slug])

  const handleJoin = async () => {
    if (!studio) return
    
    // Garantir que temos o ID do usuário da sessão atual
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id || user?.id
    
    if (!userId) {
      toast({ title: "Erro de sessão", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" })
      return
    }

    setIsJoining(true)
    console.log('🚀 Iniciando processo de Join para usuário:', userId)

    try {
      let userRole = user?.role
      
      // Priorizar o parâmetro do convite se ele for para um papel específico ou se o usuário for apenas um estudante
      if (roleParam && (roleParam === 'engineer' || roleParam === 'architect' || roleParam === 'professional' || !userRole || userRole === 'student')) {
        if (roleParam === 'engineer') {
          userRole = 'engineer'
        } else if (roleParam === 'architect') {
          userRole = 'architect'
        } else if (roleParam === 'professional') {
          userRole = 'teacher'
        } else {
          userRole = 'student'
        }
      }
      
      userRole = userRole || 'student'
      const table = (userRole === 'student') ? 'students' : 
                    (userRole === 'engineer' || userRole === 'architect') ? 'professionals' : 'users_internal'
      
      // 1. Atualizar no Banco de Dados o perfil do usuário
      console.log(`📝 Atualizando tabela ${table} para studio ${studio.id}`)
      
      // Se for professor, precisamos atualizar também a tabela 'teachers'
      if (userRole === 'teacher') {
        const { error: teacherErr } = await supabase
          .from('teachers')
          .update({ studio_id: studio.id })
          .eq('user_id', userId)
        if (teacherErr) console.error("Erro ao atualizar tabela teachers:", teacherErr)
      }

      // Se for engenheiro ou arquiteto, o upsert já cuida de tudo na tabela 'professionals'
      if (userRole === 'engineer' || userRole === 'architect') {
        const { error: profErr } = await supabase
          .from('professionals')
          .upsert({
            user_id: userId,
            studio_id: studio.id,
            professional_type: userRole,
            name: user?.name || session?.user?.email?.split('@')[0] || 'Novo Profissional',
            email: session?.user?.email ?? '',
            status: 'active'
          }, { onConflict: 'studio_id, email' })

        if (profErr) {
          console.error("Erro ao fazer upsert na tabela professionals:", profErr)
          throw new Error(`Erro ao vincular perfil profissional: ${profErr.message}`)
        }

        // CORREÇÃO CRÍTICA PARA RLS:
        // Verificar se existe registro em users_internal e atualizar para evitar conflito de studio_id na função de segurança
        const { data: internalUser } = await supabase
          .from('users_internal')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (internalUser) {
          console.log('🔄 Atualizando users_internal para consistência de RLS')
          await supabase
            .from('users_internal')
            .update({ 
              studio_id: studio.id,
              role: 'professional' // Marca como professional genérico em users_internal
            })
            .eq('id', userId)
        }

      } else {
        // Para outras roles, atualiza a tabela correspondente (students ou users_internal)
        const { error: profileError } = await supabase
          .from(table)
          .update({ 
            studio_id: studio.id,
            status: 'active'
          })
          .eq('id', userId)

        if (profileError) {
          console.error(`❌ Erro ao atualizar ${table}:`, profileError)
          throw new Error(`Erro ao atualizar perfil: ${profileError.message}`)
        }
      }

      // 2. Inicializar créditos se for aluno
      if (userRole === 'student') {
        console.log('💰 Verificando créditos do aluno...')
        const { data: existingCredits } = await supabase
          .from('student_lesson_credits')
          .select('id')
          .eq('student_id', userId)
          .maybeSingle()

        if (!existingCredits) {
          console.log('➕ Criando registro inicial de créditos')
          const nextYear = new Date()
          nextYear.setFullYear(nextYear.getFullYear() + 1)
          
          const { error: creditError } = await supabase
            .from('student_lesson_credits')
            .insert({
              student_id: userId,
              studio_id: studio.id,
              total_credits: 0,
              remaining_credits: 0,
              expiry_date: nextYear.toISOString().split('T')[0] // Formato YYYY-MM-DD
            })
          if (creditError) console.error("Erro ao criar créditos:", creditError)
        }
      }

      // 3. Atualizar Metadata do Auth
      console.log('🔑 Atualizando metadados de autenticação...')
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          studio_id: studio.id,
          role: userRole
        }
      })

      if (authError) console.warn("Aviso: Erro ao atualizar metadata do auth (RLS pode ser afetado):", authError.message)

      // 4. Atualizar LocalStorage
      const updatedUser = {
        ...(user || {}),
        id: userId,
        role: userRole,
        studio_id: studio.id,
        studioName: studio.name,
        studioSlug: studio.slug,
        status: 'active'
      }
      localStorage.setItem('danceflow_user', JSON.stringify(updatedUser))

      toast({
        title: "Sucesso!",
        description: `Agora você faz parte do ${studio.name}`,
      })

      // 5. Redirecionar
      console.log('✅ Join concluído. Redirecionando para:', userRole === 'student' ? '/student' : (userRole === 'engineer' || userRole === 'architect' ? '/engineer' : '/teacher'))
      
      // Pequeno delay para o usuário ver o toast de sucesso
      setTimeout(() => {
        const targetPath = userRole === 'student' ? '/student' : (userRole === 'engineer' || userRole === 'architect' ? '/engineer' : '/teacher')
        
        // Forçar reload completo para garantir atualização de sessão e RLS
        window.location.href = targetPath
      }, 1000)

    } catch (error: any) {
      console.error('💥 Erro fatal no handleJoin:', error)
      toast({
        title: "Erro ao entrar",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Convite Recebido
          </h1>
          <p className="text-sm text-muted-foreground">
            Você foi convidado para participar de um {vocabulary.establishment.toLowerCase()}
          </p>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-indigo-600 text-white pb-8">
            <CardTitle className="text-center text-xl">Confirmar Entrada</CardTitle>
            <CardDescription className="text-indigo-100 text-center">
              Deseja entrar para o {vocabulary.establishment.toLowerCase()} abaixo?
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{vocabulary.establishment}</p>
                <p className="font-bold text-lg leading-tight">{studio?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 opacity-80">
              <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <UserCircle2 className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Seu Perfil</p>
                <p className="font-medium text-sm leading-tight">{user?.name || 'Novo Usuário'}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === 'student' || (!user?.role && roleParam === 'client') ? vocabulary.client : 
                   user?.role === 'engineer' || (!user?.role && roleParam === 'engineer') ? 'Engenheiro Técnico' : 
                   user?.role === 'architect' || (!user?.role && roleParam === 'architect') ? 'Arquiteto Parceiro' : 
                   vocabulary.provider}
                </p>
              </div>
            </div>

            <Button 
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold text-lg"
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Aceitar Convite e Entrar"}
            </Button>

            <button 
              onClick={() => router.push(user?.role === 'student' ? '/student' : '/teacher')}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Agora não, levar para meu painel
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
