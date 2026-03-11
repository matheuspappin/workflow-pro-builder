"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2, ArrowRight, Building2, User, Mail, Wrench,
  CheckCircle2, Sparkles, Music, GraduationCap, Users, DollarSign,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { claimEcosystem } from "@/lib/actions/ecosystem"
import { cn } from "@/lib/utils"

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface InviteData {
  id: string
  studio_id: string
  email: string | null
  token: string
  expires_at: string
  invite_type?: string | null
  metadata?: {
    invite_type?: string
    professional_type?: string
    role?: string
    niche?: string
  } | null
  role?: string | null
  studio: { id: string; name: string }
  createdByUser?: { name: string }
}

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted'
type NicheTheme = 'dance' | 'fire' | 'generic'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isEcosystemInvite(invite: InviteData): boolean {
  return (
    invite.invite_type === 'ecosystem' ||
    invite.metadata?.invite_type === 'ecosystem' ||
    (!invite.role && !invite.metadata?.professional_type && !invite.metadata?.role)
  )
}

function getNicheTheme(niche?: string | null): NicheTheme {
  if (niche === 'dance') return 'dance'
  if (niche === 'fire_protection') return 'fire'
  return 'generic'
}

// ─── Labels por role + nicho ─────────────────────────────────────────────────
const ROLE_LABELS: Record<string, Record<string, string>> = {
  dance: {
    teacher: 'Professor',
    student: 'Aluno',
    finance: 'Financeiro',
    admin: 'Administrador',
    professional: 'Professor',
  },
  fire: {
    finance: 'Financeiro',
    seller: 'Vendedor',
    receptionist: 'Recepcionista',
    engineer: 'Engenheiro',
    architect: 'Arquiteto',
    technician: 'Técnico',
    professional: 'Técnico',
  },
  generic: {
    finance: 'Financeiro',
    seller: 'Vendedor',
    engineer: 'Engenheiro',
    technician: 'Técnico',
    teacher: 'Professor',
    student: 'Aluno',
  },
}

function getRoleLabel(role: string, theme: NicheTheme): string {
  return ROLE_LABELS[theme]?.[role] || ROLE_LABELS.generic[role] || role
}

// ─── Redirect por nicho + role ────────────────────────────────────────────────
function getRedirectAfterAccept(niche: NicheTheme, internalRole?: string, profType?: string): string {
  if (niche === 'dance') {
    if (internalRole === 'finance' || internalRole === 'admin') return '/solutions/estudio-de-danca/dashboard'
    if (profType === 'teacher' || profType === 'professional') return '/solutions/estudio-de-danca/teacher'
    if (profType === 'student') return '/solutions/estudio-de-danca/student'
    return '/solutions/estudio-de-danca/dashboard'
  }
  if (niche === 'fire') {
    if (internalRole === 'finance') return '/solutions/fire-protection/dashboard/financeiro'
    if (internalRole === 'seller') return '/solutions/fire-protection/dashboard/portal-vendedor'
    if (profType === 'engineer' || profType === 'architect') return '/solutions/fire-protection/engineer'
    return '/solutions/fire-protection/technician'
  }
  return '/dashboard'
}

// ─── Temas visuais ────────────────────────────────────────────────────────────
const THEME_CONFIG = {
  dance: {
    accent: 'bg-violet-600',
    accentHover: 'hover:bg-violet-700',
    accentLight: 'bg-violet-50 dark:bg-violet-900/20',
    accentBorder: 'border-violet-100 dark:border-violet-800/50',
    accentText: 'text-violet-700 dark:text-violet-300',
    accentShadow: 'shadow-violet-200',
    stripColor: 'bg-gradient-to-r from-violet-600 to-pink-600',
    icon: Music,
    label: 'DanceFlow',
  },
  fire: {
    accent: 'bg-red-600',
    accentHover: 'hover:bg-red-700',
    accentLight: 'bg-red-50 dark:bg-red-900/10',
    accentBorder: 'border-red-100 dark:border-red-800/50',
    accentText: 'text-red-700 dark:text-red-300',
    accentShadow: 'shadow-red-200',
    stripColor: 'bg-red-600',
    icon: Wrench,
    label: 'Fire Control',
  },
  generic: {
    accent: 'bg-indigo-600',
    accentHover: 'hover:bg-indigo-700',
    accentLight: 'bg-indigo-50 dark:bg-indigo-900/10',
    accentBorder: 'border-indigo-100 dark:border-indigo-800/50',
    accentText: 'text-indigo-700 dark:text-indigo-300',
    accentShadow: 'shadow-indigo-200',
    stripColor: 'bg-indigo-600',
    icon: Sparkles,
    label: 'Sistema',
  },
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()

  const token = params.token as string
  const autoAccept = searchParams.get('autoAccept') === 'true'

  const [loading, setLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>('loading')
  const [nicheTheme, setNicheTheme] = useState<NicheTheme>('generic')

  // ─── Buscar convite ─────────────────────────────────────────────────────────
  const fetchInviteDetails = useCallback(async () => {
    if (!token) {
      setInviteStatus('invalid')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/invites/professionals?token=${token}`)
      const data = await response.json()

      if (response.ok && data.success) {
        const invite = data.invite as InviteData
        setInviteData(invite)
        setNicheTheme(getNicheTheme(invite.metadata?.niche))
        setInviteStatus('valid')
      } else {
        setInviteStatus('invalid')
        const errMsg = data.error || ''
        if (!errMsg.toLowerCase().includes('inválido') && !errMsg.toLowerCase().includes('invalid')) {
          toast.error(errMsg || 'Convite inválido ou expirado')
        }
      }
    } catch {
      setInviteStatus('invalid')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      fetchInviteDetails()
    }
    init()
  }, [supabase, fetchInviteDetails])

  // ─── Auto-accept ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (inviteStatus === 'valid' && currentUser && !isAccepting && autoAccept) {
      handleAcceptInvite()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteStatus, currentUser, autoAccept])

  // ─── Aceitar convite de ECOSSISTEMA ─────────────────────────────────────────
  const handleClaimEcosystem = async () => {
    if (!inviteData || !currentUser) return
    setIsAccepting(true)
    try {
      await claimEcosystem(token)
      await supabase.auth.refreshSession()
      toast.success('Sistema ativado com sucesso! Bem-vindo.')

      // Redirecionar para o dashboard correto baseado no nicho
      if (nicheTheme === 'dance') {
        router.push('/solutions/estudio-de-danca/dashboard')
      } else if (nicheTheme === 'fire') {
        router.push('/solutions/fire-protection/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ativar sistema')
      setIsAccepting(false)
    }
  }

  // ─── Aceitar convite de PROFISSIONAL / ALUNO ─────────────────────────────────
  const handleAcceptProfessionalInvite = async () => {
    if (!inviteData || !currentUser) return
    setIsAccepting(true)
    try {
      const response = await fetch('/api/invites/professionals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: inviteData.token,
          userId: currentUser.id,
          email: currentUser.email,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        await supabase.auth.refreshSession()
        toast.success('Convite aceito com sucesso!')

        const internalRole = inviteData.metadata?.role
        const profType = inviteData.metadata?.professional_type || inviteData.role || 'technician'
        const redirectPath = getRedirectAfterAccept(nicheTheme, internalRole, profType)

        // Pequeno delay para o toast aparecer
        setTimeout(() => router.push(redirectPath), 800)
      } else {
        toast.error(data.error || 'Erro ao aceitar convite')
        setIsAccepting(false)
      }
    } catch {
      toast.error('Erro ao aceitar convite')
      setIsAccepting(false)
    }
  }

  const handleAcceptInvite = () => {
    if (!inviteData) return
    if (isEcosystemInvite(inviteData)) {
      handleClaimEcosystem()
    } else {
      handleAcceptProfessionalInvite()
    }
  }

  // ─── Tela de loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="animate-spin w-10 h-10 text-violet-600 mx-auto mb-4" />
          <p className="text-sm text-slate-500 animate-pulse font-medium">Validando seu convite...</p>
        </div>
      </div>
    )
  }

  // ─── Convite inválido/expirado ──────────────────────────────────────────────
  if (inviteStatus === 'invalid' || inviteStatus === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md text-center border-destructive/20 shadow-xl">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">Convite Inválido</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Este link de convite expirou, já foi utilizado ou nunca existiu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                Voltar para o Login <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!inviteData) return null

  const isEcosystem = isEcosystemInvite(inviteData)
  const internalRole = inviteData.metadata?.role
  const profType = inviteData.metadata?.professional_type || inviteData.role || 'technician'
  const roleLabel = getRoleLabel(internalRole || profType, nicheTheme)
  const returnUrl = encodeURIComponent(`/setup/invite/${token}?autoAccept=true`)
  const studioName = inviteData.studio?.name || 'um sistema'
  const theme = THEME_CONFIG[nicheTheme]
  const ThemeIcon = theme.icon

  // ─── FLUXO: Convite de Ecossistema ──────────────────────────────────────────
  if (isEcosystem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher showIcon />
        </div>
        <Card className="w-full max-w-md shadow-2xl border-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          <div className={cn("h-2 w-full", theme.stripColor)} />
          <CardHeader className="text-center space-y-4 pt-8">
            <div className={cn("mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner", theme.accentLight)}>
              <ThemeIcon className={cn("w-8 h-8", theme.accentText.replace('text-', 'text-').replace('dark:text-', ''))} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Seu sistema está pronto!
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium text-base px-2">
                Foi criado um sistema exclusivo para:
                <br />
                <strong className="text-slate-900 dark:text-slate-100 text-lg block mt-1 underline decoration-violet-500/30 underline-offset-4">
                  {studioName}
                </strong>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className={cn("p-4 rounded-xl text-sm text-center border font-medium", theme.accentLight, theme.accentBorder, theme.accentText)}>
              Clique em "Ativar Sistema" para assumir o controle e acessar seu painel de gestão.
            </div>

            {!currentUser ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-xl text-center">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    Você precisa estar logado para ativar o sistema.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link href={`/login?returnTo=${returnUrl}`} className="w-full">
                    <Button variant="outline" className="w-full h-12 font-bold rounded-xl border-slate-200">
                      Já tenho conta
                    </Button>
                  </Link>
                  <Link href={`/register?returnTo=${returnUrl}`} className="w-full">
                    <Button className={cn("w-full h-12 font-bold text-white rounded-xl shadow-lg", theme.accent, theme.accentHover, theme.accentShadow)}>
                      Criar Conta
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg", theme.accent)}>
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Logado como</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser.email}</p>
                  </div>
                </div>

                <Button
                  onClick={handleClaimEcosystem}
                  disabled={isAccepting}
                  className={cn(
                    "w-full h-14 font-black text-lg text-white rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
                    theme.accent, theme.accentHover, theme.accentShadow
                  )}
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Ativando sistema...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Ativar Sistema <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-center text-slate-400 px-4">
                  Ao clicar em ativar, você assume a propriedade e gestão deste sistema.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── FLUXO: Convite de Profissional / Aluno ───────────────────────────────
  // Ícone por role
  const RoleIcon = profType === 'student' ? Users
    : profType === 'teacher' || profType === 'professional' ? GraduationCap
    : internalRole === 'finance' ? DollarSign
    : Building2

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher showIcon />
      </div>
      <Card className="w-full max-w-md shadow-2xl border-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        <div className={cn("h-2 w-full", theme.stripColor)} />
        <CardHeader className="text-center space-y-4 pt-8">
          <div className={cn("mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner", theme.accentLight)}>
            <RoleIcon className={cn("w-8 h-8", theme.accentText)} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Convite Especial
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium text-base px-2">
              Você foi convidado para atuar como{' '}
              <span className={cn("font-bold", theme.accentText)}>{roleLabel}</span>
              {nicheTheme === 'dance' ? ' no estúdio' : ' na empresa'}:
              <br />
              <strong className="text-slate-900 dark:text-slate-100 text-lg block mt-1 underline decoration-violet-500/30 underline-offset-4">
                {studioName}
              </strong>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className={cn("p-4 rounded-xl text-sm text-center border font-medium", theme.accentLight, theme.accentBorder, theme.accentText)}>
            {profType === 'student'
              ? 'Este link permite acessar seu portal de aluno, ver turmas, frequência e mensalidades.'
              : nicheTheme === 'dance'
              ? 'Este link permite que você se vincule ao estúdio e acesse o portal de professores.'
              : 'Este link permite que você se vincule a esta empresa e acesse seus projetos e ordens de serviço.'
            }
          </div>

          {!currentUser ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-xl text-center">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  Você precisa estar logado para aceitar este convite.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/login?returnTo=${returnUrl}`} className="w-full">
                  <Button variant="outline" className="w-full h-12 font-bold rounded-xl border-slate-200">
                    Já tenho conta
                  </Button>
                </Link>
                <Link
                  href={`/register?returnTo=${returnUrl}&role=${internalRole || profType}${inviteData.studio?.id ? `&studioId=${inviteData.studio.id}` : ''}`}
                  className="w-full"
                >
                  <Button className={cn("w-full h-12 font-bold text-white rounded-xl shadow-lg", theme.accent, theme.accentHover, theme.accentShadow)}>
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg", theme.accent)}>
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Logado como</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser.email}</p>
                </div>
              </div>

              {inviteData.createdByUser?.name && (
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-slate-400 font-medium justify-center">
                  <Mail className="w-3 h-3" />
                  Convidado por {inviteData.createdByUser.name}
                </div>
              )}

              <Button
                onClick={handleAcceptProfessionalInvite}
                disabled={isAccepting}
                className={cn(
                  "w-full h-14 font-black text-lg text-white rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
                  theme.accent, theme.accentHover, theme.accentShadow
                )}
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Vinculando conta...
                  </>
                ) : (
                  <>
                    Aceitar e Entrar <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>

              <p className="text-[10px] text-center text-slate-400 px-4">
                Ao aceitar, você concorda em vincular seu perfil a {nicheTheme === 'dance' ? 'este estúdio' : 'esta empresa'}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
