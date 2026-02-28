"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight, Building2, User, Mail, Wrench, CheckCircle2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { claimEcosystem } from "@/lib/actions/ecosystem"

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isEcosystemInvite(invite: InviteData): boolean {
  return (
    invite.invite_type === 'ecosystem' ||
    invite.metadata?.invite_type === 'ecosystem' ||
    // fallback: sem tipo profissional = ecossistema
    (!invite.role && !invite.metadata?.professional_type && !invite.metadata?.role)
  )
}

const PROFESSIONAL_LABELS: Record<string, string> = {
  finance: 'Financeiro',
  seller: 'Vendedor',
  receptionist: 'Recepcionista',
  engineer: 'Engenheiro',
  architect: 'Arquiteto',
  technician: 'Técnico',
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
        setInviteData(data.invite)
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
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ativar sistema')
      setIsAccepting(false)
    }
  }

  // ─── Aceitar convite de PROFISSIONAL ────────────────────────────────────────
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
        if (internalRole === 'finance') router.push('/solutions/fire-protection/dashboard/financeiro')
        else if (internalRole === 'seller') router.push('/solutions/fire-protection/dashboard/portal-vendedor')
        else if (profType === 'engineer' || profType === 'architect') router.push('/solutions/fire-protection/engineer')
        else router.push('/solutions/fire-protection/technician')
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
          <Loader2 className="animate-spin w-10 h-10 text-blue-600 mx-auto mb-4" />
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
  const professionalLabel = PROFESSIONAL_LABELS[internalRole || profType] || 'Técnico'
  const returnUrl = encodeURIComponent(`/setup/invite/${token}?autoAccept=true`)
  const studioName = inviteData.studio?.name || 'um sistema'

  // ─── FLUXO: Convite de Ecossistema ──────────────────────────────────────────
  if (isEcosystem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher showIcon />
        </div>
        <Card className="w-full max-w-md shadow-2xl border-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          <div className="h-2 bg-indigo-600 w-full" />
          <CardHeader className="text-center space-y-4 pt-8">
            <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Seu sistema está pronto!
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium text-base px-2">
                Foi criado um sistema exclusivo para:
                <br />
                <strong className="text-slate-900 dark:text-slate-100 text-lg block mt-1 underline decoration-indigo-500/30 underline-offset-4">
                  {studioName}
                </strong>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl text-sm text-center text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 font-medium">
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
                    <Button className="w-full h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200">
                      Criar Conta
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
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
                  className="w-full h-14 font-black text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
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

  // ─── FLUXO: Convite de Profissional ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher showIcon />
      </div>
      <Card className="w-full max-w-md shadow-2xl border-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="h-2 bg-blue-600 w-full" />
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center shadow-inner">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Convite Especial
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium text-base px-2">
              Você foi convidado para atuar como{' '}
              <span className="text-blue-600 font-bold">{professionalLabel}</span> no estúdio:
              <br />
              <strong className="text-slate-900 dark:text-slate-100 text-lg block mt-1 underline decoration-blue-500/30 underline-offset-4">
                {studioName}
              </strong>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl text-sm text-center text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 font-medium">
            Este link permite que você se vincule a esta empresa e acesse seus projetos e ordens de serviço.
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
                  <Button className="w-full h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
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
                className="w-full h-14 font-black text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Vinculando conta...
                  </>
                ) : (
                  <>
                    Aceitar e Vincular <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>

              <p className="text-[10px] text-center text-slate-400 px-4">
                Ao clicar em aceitar, você concorda em compartilhar seu perfil profissional com esta empresa.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
