"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShoppingBag,
  History,
  TrendingDown,
  TrendingUp,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
} from "lucide-react"

// ─── tipos ───────────────────────────────────────────────────────────────────

type CreditRecord = {
  id: string
  remaining_credits: number
  total_credits: number
  expiry_date: string | null
  last_purchase_date: string | null
}

type Package = {
  id: string
  name: string
  description: string | null
  lessons_count: number
  price: number
}

type UsageEntry = {
  id: string
  credits_used: number
  usage_type: 'class_attendance' | 'manual_adjustment' | 'refund'
  notes: string | null
  created_at: string
}

type Payment = {
  id: string
  amount: number
  description: string
  status: 'paid' | 'pending' | 'overdue'
  due_date: string | null
  payment_date: string | null
  payment_method: string | null
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—'

const fmtDatetime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

function isExpired(expiryDate: string | null) {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
}

function daysUntil(expiryDate: string | null) {
  if (!expiryDate) return null
  const diff = new Date(expiryDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const usageConfig: Record<UsageEntry['usage_type'], { label: string; icon: any; color: string; sign: string }> = {
  class_attendance: { label: 'Aula realizada',    icon: Zap,         color: 'bg-violet-100 text-violet-600 dark:bg-violet-600/20', sign: '-' },
  manual_adjustment:{ label: 'Ajuste manual',      icon: RotateCcw,   color: 'bg-amber-100 text-amber-600 dark:bg-amber-600/20',    sign: '' },
  refund:           { label: 'Estorno',             icon: TrendingUp,  color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-600/20', sign: '+' },
}

const paymentStatusConfig = {
  paid:    { label: 'Pago',     icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' },
  pending: { label: 'Pendente', icon: Clock,         badge: 'bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400' },
  overdue: { label: 'Vencido',  icon: AlertCircle,   badge: 'bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:text-rose-400' },
}

// ─── componente ──────────────────────────────────────────────────────────────

function FinanceiroContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [buying, setBuying] = useState<string | null>(null)

  const [user, setUser] = useState<any>(null)
  const [studioId, setStudioId] = useState<string | null>(null)
  const [businessModel, setBusinessModel] = useState<'CREDIT' | 'MONETARY'>('CREDIT')

  // créditos
  const [credits, setCredits] = useState<CreditRecord | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [usage, setUsage] = useState<UsageEntry[]>([])
  const [showAllUsage, setShowAllUsage] = useState(false)

  // mensalidades (modelo MONETARY)
  const [payments, setPayments] = useState<Payment[]>([])
  const [showAllPayments, setShowAllPayments] = useState(false)

  // ref para evitar múltiplas chamadas ao confirm-credit (React Strict Mode, re-renders)
  const confirmedSessionRef = useRef<Set<string>>(new Set())

  // ── carregamento ──────────────────────────────────────────────────────────

  const loadAll = useCallback(async (uid: string, sid: string, silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const [studioRes, creditsRes, packagesRes, usageRes, paymentsRes] = await Promise.all([
        supabase.from('studios').select('business_model').eq('id', sid).single(),

        supabase
          .from('student_lesson_credits')
          .select('id, remaining_credits, total_credits, expiry_date, last_purchase_date')
          .eq('student_id', uid)
          .maybeSingle(),

        supabase
          .from('lesson_packages')
          .select('id, name, description, lessons_count, price')
          .eq('studio_id', sid)
          .eq('is_active', true)
          .order('price', { ascending: true }),

        supabase
          .from('student_credit_usage')
          .select('id, credits_used, usage_type, notes, created_at')
          .eq('student_id', uid)
          .order('created_at', { ascending: false })
          .limit(30),

        supabase
          .from('payments')
          .select('id, amount, description, status, due_date, payment_date, payment_method')
          .eq('student_id', uid)
          .order('due_date', { ascending: false })
          .limit(20),
      ])

      const model = studioRes.data?.business_model || 'CREDIT'
      setBusinessModel(model)
      setCredits(creditsRes.data ?? null)
      setPackages(packagesRes.data ?? [])
      setUsage((usageRes.data ?? []) as UsageEntry[])
      setPayments((paymentsRes.data ?? []) as Payment[])
    } catch {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }

      const sid = authUser.user_metadata?.studio_id
      setUser(authUser)
      setStudioId(sid)

      if (sid) {
        await loadAll(authUser.id, sid, true)

        // Realtime: atualiza créditos ao validar QR em tempo real
        const channel = supabase
          .channel(`financeiro-credits-${authUser.id}`)
          .on('postgres_changes', {
            event: '*', schema: 'public', table: 'student_lesson_credits',
            filter: `student_id=eq.${authUser.id}`,
          }, (payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              setCredits(payload.new as CreditRecord)
            }
          })
          .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'student_credit_usage',
            filter: `student_id=eq.${authUser.id}`,
          }, () => {
            loadAll(authUser.id, sid, true)
          })
          .subscribe()

        return () => { supabase.removeChannel(channel) }
      } else {
        setLoading(false)
      }
    }
    init()
  }, [loadAll])

  // Feedback de pagamento retornado pelo Stripe + confirmar crédito + polling
  useEffect(() => {
    const payment = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (payment === 'success') {
      toast({
        title: 'Pagamento confirmado! 🎉',
        description: sessionId ? 'Adicionando seus créditos...' : 'Seus créditos serão adicionados em instantes.',
      })

      // Chamar API para creditar imediatamente (apenas UMA vez por session_id)
      if (sessionId && !confirmedSessionRef.current.has(sessionId)) {
        confirmedSessionRef.current.add(sessionId)
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (!session?.access_token) return
          try {
            const res = await fetch(`/api/dance-studio/packages/confirm-credit?session_id=${encodeURIComponent(sessionId)}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            const data = await res.json()
            if (res.ok && data.success) {
              toast({ title: 'Créditos adicionados!', description: 'Sua carteira foi atualizada.' })
              const uid = session.user?.id
              const sid = session.user?.user_metadata?.studio_id
              if (uid && sid) loadAll(uid, sid, true)
            }
          } catch {
            confirmedSessionRef.current.delete(sessionId)
          }
        })
      }

      const interval = setInterval(() => {
        if (user && studioId) loadAll(user.id, studioId, true)
      }, 2000)
      const timeout = setTimeout(() => clearInterval(interval), 15000)
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    } else if (payment === 'cancelled') {
      toast({
        title: 'Pagamento cancelado',
        description: 'Nenhum valor foi cobrado.',
        variant: 'destructive',
      })
    }
  }, [searchParams, toast, user, studioId, loadAll])

  // ── compra de pacote ──────────────────────────────────────────────────────

  const handleBuyPackage = async (pkg: Package) => {
    if (!user || !studioId) return
    if (buying) return // Evita múltiplos cliques

    setBuying(pkg.id)
    try {
      const res = await fetch('/api/dance-studio/packages/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          studioId,
          studentId: user.id,
          studentEmail: user.email,
          studentName: user.user_metadata?.name || '',
          successUrl: `${window.location.origin}/solutions/estudio-de-danca/student/financeiro?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/solutions/estudio-de-danca/student/financeiro?payment=cancelled`,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao iniciar pagamento')

      if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      toast({ title: 'Erro ao processar pagamento', description: e.message, variant: 'destructive' })
    } finally {
      setBuying(null)
    }
  }

  // ── renders ───────────────────────────────────────────────────────────────

  const expired = isExpired(credits?.expiry_date ?? null)
  const days = daysUntil(credits?.expiry_date ?? null)
  const creditPercent = credits && credits.total_credits > 0
    ? Math.min(100, Math.round((credits.remaining_credits / credits.total_credits) * 100))
    : 0

  const visibleUsage = showAllUsage ? usage : usage.slice(0, 5)
  const visiblePayments = showAllPayments ? payments : payments.slice(0, 5)
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue')

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-violet-600" />
            Minha Carteira
          </h1>
          <p className="text-slate-500 text-sm mt-1">Créditos de aula e histórico financeiro</p>
        </div>
        <Button
          variant="ghost" size="icon" className="rounded-xl"
          onClick={() => user && studioId && loadAll(user.id, studioId)}
          disabled={refreshing}
          title="Atualizar"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </Button>
      </div>

      {/* ── Cartão de Créditos ────────────────────────────────────────────── */}
      {businessModel === 'CREDIT' && (
        <>
          {credits ? (
            <div className={cn(
              'rounded-3xl p-6 text-white relative overflow-hidden',
              expired
                ? 'bg-gradient-to-br from-slate-600 to-slate-800'
                : credits.remaining_credits <= 2
                  ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                  : 'bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700'
            )}>
              {/* Decoração de fundo */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

              <div className="relative">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
                      Créditos de Aula
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-black leading-none">
                        {credits.remaining_credits}
                      </span>
                      <span className="text-base opacity-70 mb-1">
                        / {credits.total_credits}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${creditPercent}%` }}
                  />
                </div>

                {/* Informações inferiores */}
                <div className="flex items-center justify-between">
                  <div>
                    {expired ? (
                      <p className="text-xs font-bold text-rose-200">
                        ⚠ Créditos expirados em {fmtDate(credits.expiry_date)}
                      </p>
                    ) : credits.expiry_date ? (
                      <p className="text-xs font-bold opacity-75">
                        {days !== null && days <= 7
                          ? `⚠ Expiram em ${days} dia(s)`
                          : `Válidos até ${fmtDate(credits.expiry_date)}`}
                      </p>
                    ) : (
                      <p className="text-xs font-bold opacity-75">Sem data de expiração</p>
                    )}
                    {credits.last_purchase_date && (
                      <p className="text-[10px] opacity-50 mt-0.5">
                        Última recarga: {fmtDate(credits.last_purchase_date)}
                      </p>
                    )}
                  </div>
                  {credits.remaining_credits <= 2 && !expired && (
                    <Badge className="bg-white/20 text-white border-none text-[10px] font-bold animate-pulse">
                      QUASE ACABANDO
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Aluno sem nenhum crédito ainda
            <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
              <Wallet className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Carteira vazia</p>
              <p className="text-xs text-slate-500 mt-1">
                Adquira um pacote abaixo para começar a usar os créditos.
              </p>
            </div>
          )}

          {/* Alertas de créditos baixos / expirados */}
          {credits && expired && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Créditos expirados</p>
                <p className="text-xs text-rose-600/80 dark:text-rose-500 mt-0.5">
                  Seus créditos expiraram e foram congelados. Renove comprando um novo pacote abaixo — a validade será renovada automaticamente.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Pagamentos pendentes (MONETARY) ────────────────────────────────── */}
      {businessModel === 'MONETARY' && pendingPayments.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendências</p>
          {pendingPayments.map((p) => {
            const cfg = paymentStatusConfig[p.status]
            const StatusIcon = cfg.icon
            return (
              <div key={p.id} className={cn(
                'rounded-2xl p-4 flex items-center gap-3 border',
                p.status === 'overdue'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200'
              )}>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.badge)}>
                  <StatusIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{p.description || 'Mensalidade'}</p>
                  <p className="text-xs text-slate-500">Vencimento: {fmtDate(p.due_date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-slate-900 dark:text-white">R$ {fmt(p.amount)}</p>
                  <Badge className={cn('text-[10px] border-0 font-bold mt-1', cfg.badge)}>{cfg.label}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pacotes de Crédito ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-violet-600" />
          <p className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            {businessModel === 'CREDIT' ? 'Recarregar Créditos' : 'Adquirir Créditos'}
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-8 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm text-slate-500">Nenhum pacote disponível no momento.</p>
            <p className="text-xs text-slate-400 mt-1">Entre em contato com o estúdio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {packages.map((pkg, i) => {
              const pricePerLesson = Number(pkg.price) / pkg.lessons_count
              const isPopular = i === Math.floor(packages.length / 2) // pacote do meio = mais popular

              return (
                <div
                  key={pkg.id}
                  className={cn(
                    'relative rounded-2xl border-2 overflow-hidden transition-all',
                    isPopular
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20 shadow-md shadow-violet-500/10'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 hover:border-violet-300 dark:hover:border-violet-700/50'
                  )}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl">
                      MAIS POPULAR
                    </div>
                  )}

                  <div className="p-4 flex items-center gap-4">
                    {/* Créditos destaque */}
                    <div className={cn(
                      'w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black',
                      isPopular
                        ? 'bg-violet-600 text-white'
                        : 'bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400'
                    )}>
                      <span className="text-xl leading-none">{pkg.lessons_count}</span>
                      <span className="text-[9px] uppercase font-bold opacity-80">
                        {pkg.lessons_count === 1 ? 'crédito' : 'créditos'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 dark:text-white text-sm">{pkg.name}</p>
                      {pkg.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{pkg.description}</p>
                      )}
                      <p className="text-xs text-violet-600 dark:text-violet-400 font-bold mt-1">
                        ≈ R$ {fmt(pricePerLesson)} por aula
                      </p>
                    </div>

                    {/* Preço + Comprar */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <p className="font-black text-lg text-slate-900 dark:text-white leading-none">
                        R$ {fmt(Number(pkg.price))}
                      </p>
                      <Button
                        size="sm"
                        className={cn(
                          'h-9 px-4 rounded-xl font-bold text-sm',
                          isPopular
                            ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-600/25'
                            : 'bg-slate-900 dark:bg-white hover:bg-slate-700 dark:hover:bg-slate-200 text-white dark:text-slate-900'
                        )}
                        onClick={() => handleBuyPackage(pkg)}
                        disabled={!!buying}
                      >
                        {buying === pkg.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Comprar'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Nota sobre pagamento */}
        <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
          <CreditCard className="w-3 h-3" />
          Pagamento seguro via cartão de crédito. Os créditos são adicionados automaticamente após confirmação.
        </p>
      </div>

      {/* ── Histórico de Uso de Créditos ─────────────────────────────────── */}
      {usage.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <p className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Extrato de Créditos
            </p>
          </div>

          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {visibleUsage.map((entry) => {
                  const cfg = usageConfig[entry.usage_type] ?? usageConfig.class_attendance
                  const EntryIcon = cfg.icon
                  const isGain = entry.usage_type === 'refund'
                  const isManual = entry.usage_type === 'manual_adjustment'

                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-3.5">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.color)}>
                        <EntryIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {entry.notes || cfg.label}
                        </p>
                        <p className="text-[11px] text-slate-400">{fmtDatetime(entry.created_at)}</p>
                      </div>
                      <div className={cn(
                        'font-black text-base shrink-0',
                        isGain ? 'text-emerald-600' : isManual ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'
                      )}>
                        {isGain ? '+' : isManual ? '±' : '-'}{entry.credits_used}
                      </div>
                    </div>
                  )
                })}
              </div>

              {usage.length > 5 && (
                <button
                  onClick={() => setShowAllUsage(v => !v)}
                  className="w-full py-3 text-xs font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-white/5"
                >
                  {showAllUsage ? (
                    <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5" /> Ver todos os {usage.length} registros</>
                  )}
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Histórico de Pagamentos ───────────────────────────────────────── */}
      {payments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <p className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Histórico de Pagamentos
            </p>
          </div>

          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {visiblePayments.map((p) => {
                  const cfg = paymentStatusConfig[p.status] ?? paymentStatusConfig.pending
                  const StatusIcon = cfg.icon
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3.5">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.badge)}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {p.description || 'Mensalidade'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {p.status === 'paid' && p.payment_date
                            ? `Pago em ${fmtDate(p.payment_date)}`
                            : `Vencimento: ${fmtDate(p.due_date)}`}
                          {p.payment_method && ` · ${p.payment_method}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900 dark:text-white text-sm">
                          R$ {fmt(p.amount)}
                        </p>
                        <Badge className={cn('text-[10px] border-0 font-bold mt-1', cfg.badge)}>
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>

              {payments.length > 5 && (
                <button
                  onClick={() => setShowAllPayments(v => !v)}
                  className="w-full py-3 text-xs font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-white/5"
                >
                  {showAllPayments ? (
                    <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5" /> Ver todos os {payments.length} pagamentos</>
                  )}
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state completo */}
      {usage.length === 0 && payments.length === 0 && !loading && (
        <div className="text-center py-12">
          <TrendingDown className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="font-bold text-slate-500 text-sm">Nenhuma movimentação ainda</p>
          <p className="text-xs text-slate-400 mt-1">Compre um pacote acima para começar.</p>
        </div>
      )}
    </div>
  )
}

export default function StudentFinanceiroPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <FinanceiroContent />
    </Suspense>
  )
}
