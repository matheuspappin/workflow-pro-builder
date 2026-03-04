"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, CheckCircle2, Clock, AlertCircle, CreditCard, QrCode, Barcode, Loader2, Calendar, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type PayStatus = 'paid' | 'pending' | 'overdue'

const statusMap: Record<PayStatus, { label: string; icon: any; badge: string; border: string; bg: string }> = {
  paid:    { label: "Pago",     icon: CheckCircle2, badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-600/20", bg: "bg-emerald-50 dark:bg-emerald-600/5" },
  pending: { label: "Pendente", icon: Clock,        badge: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400",         border: "border-amber-200 dark:border-amber-600/20",   bg: "bg-amber-50 dark:bg-amber-600/5" },
  overdue: { label: "Vencido",  icon: AlertCircle,  badge: "bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:text-rose-400",             border: "border-rose-200 dark:border-rose-600/20",     bg: "bg-rose-50 dark:bg-rose-600/5" },
}

function normalizeStatus(raw: string): PayStatus {
  if (raw === 'paid' || raw === 'recebido' || raw === 'emitted') return 'paid'
  if (raw === 'overdue' || raw === 'vencido') return 'overdue'
  return 'pending'
}

export default function StudentFinanceiroPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<any[]>([])
  const [studioId, setStudioId] = useState<string | null>(null)
  const [studentCredits, setStudentCredits] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [creditUsage, setCreditUsage] = useState<any[]>([])
  const [businessModel, setBusinessModel] = useState<'CREDIT' | 'MONETARY'>('MONETARY')
  const [isBuying, setIsBuying] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const sid = user.user_metadata?.studio_id
      setStudioId(sid)
      if (!sid) { setLoading(false); return }

      try {
        // Carregar business model
        const { data: studio } = await supabase
          .from('studios')
          .select('business_model')
          .eq('id', sid)
          .single()
        setBusinessModel(studio?.business_model || 'MONETARY')

        // Carregar pagamentos (mensalidades)
        const res = await fetch(`/api/fire-protection/financeiro?studioId=${sid}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setPayments(data.map((p: any) => ({
            id: p.id,
            descricao: p.descricao || p.description || 'Mensalidade',
            valor: Number(p.valor || p.amount || 0),
            status: normalizeStatus(p.status),
            vencimento: p.vencimento || p.due || '—',
            pagamento: p.pagamento || p.paidAt || null,
          })))
        }

        // Carregar créditos se for modelo CREDIT
        if (studio?.business_model === 'CREDIT') {
          const [creditsRes, packagesRes, usageRes] = await Promise.all([
            supabase
              .from('student_lesson_credits')
              .select('*')
              .eq('student_id', user.id)
              .maybeSingle(),
            supabase
              .from('lesson_packages')
              .select('*')
              .eq('studio_id', sid)
              .eq('is_active', true)
              .order('lessons_count', { ascending: true }),
            supabase
              .from('student_credit_usage')
              .select('*')
              .eq('student_id', user.id)
              .order('created_at', { ascending: false })
              .limit(10)
          ])
          
          setStudentCredits(creditsRes.data)
          setPackages(packagesRes.data || [])
          setCreditUsage(usageRes.data || [])
        }
      } catch { /* sem dados */ }

      setLoading(false)
    }
    load()
  }, [])

  const pendentes = payments.filter(p => p.status === 'pending' || p.status === 'overdue')
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handlePayment = async (pkg: any) => {
    setIsBuying(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: pkg.id,
            name: pkg.name,
            price: pkg.price,
            quantity: 1,
            type: 'package',
            priceInCredits: pkg.lessons_count
          }],
          customerEmail: user.email,
          successUrl: `${window.location.origin}/solutions/estudio-de-danca/student?payment=success`,
          cancelUrl: `${window.location.origin}/solutions/estudio-de-danca/student/financeiro`,
          metadata: {
            student_id: user.id,
            studio_id: studioId,
            package_id: pkg.id,
            credits: pkg.lessons_count.toString()
          }
        })
      })

      const data = await response.json()
      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erro ao processar pagamento')
      }
    } catch (error: any) {
      toast({
        title: "Erro na compra",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-500" />
          Mensalidades
        </h1>
        <p className="text-slate-500 text-sm mt-1">Histórico e pagamentos pendentes</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* Card de Créditos (modelo CREDIT) */}
          {businessModel === 'CREDIT' && studentCredits && (
            <Card className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs opacity-80 uppercase font-bold tracking-widest mb-1">Créditos de Aula</p>
                    <h2 className="text-4xl font-black">{studentCredits.remaining_credits}</h2>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-white" 
                    style={{ width: `${(studentCredits.remaining_credits / studentCredits.total_credits) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] opacity-80 font-bold uppercase">
                  Válido até: {new Date(studentCredits.expiry_date).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Comprar Pacotes (modelo CREDIT) */}
          {businessModel === 'CREDIT' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Comprar Pacote de Créditos</h3>
              <div className="grid grid-cols-1 gap-3">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className="border-2 border-slate-100 dark:border-slate-800 hover:border-violet-500/50 transition-all cursor-pointer group"
                    onClick={() => handlePayment(pkg)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground">{pkg.lessons_count} aulas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm">R$ {Number(pkg.price).toFixed(2).replace('.', ',')}</p>
                        <p className="text-[10px] text-muted-foreground italic">~ R$ {(Number(pkg.price) / pkg.lessons_count).toFixed(2)}/aula</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Uso de Créditos (modelo CREDIT) */}
          {businessModel === 'CREDIT' && creditUsage.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Uso de Créditos</h3>
              <Card className="border-none shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {creditUsage.map((usage) => (
                      <div key={usage.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            usage.usage_type === 'refund' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{usage.notes || `Aula de ${new Date(usage.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(usage.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={usage.usage_type === 'refund' ? "default" : "secondary"} className={usage.usage_type === 'refund' ? "bg-emerald-500" : ""}>
                          {usage.usage_type === 'refund' ? '+1' : '-1'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Pendentes */}
          {pendentes.length > 0 && (
            <Card className={cn("border", pendentes.some(p => p.status === 'overdue') ? statusMap.overdue.border : statusMap.pending.border,
              pendentes.some(p => p.status === 'overdue') ? statusMap.overdue.bg : statusMap.pending.bg
            )}>
              <CardContent className="p-4 space-y-3">
                <p className={cn("text-xs font-black uppercase tracking-widest",
                  pendentes.some(p => p.status === 'overdue') ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"
                )}>
                  Pagamentos Pendentes
                </p>

                {pendentes.map((p) => {
                  const st = statusMap[p.status as PayStatus]
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-white/50 dark:border-white/10">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{p.descricao}</p>
                        <p className="text-xs text-slate-500">Vencimento: {p.vencimento}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="font-black text-slate-900 dark:text-white">R$ {fmt(p.valor)}</p>
                        <Button size="sm" className={cn(
                          "text-white font-bold rounded-xl text-xs h-8 px-3",
                          p.status === 'overdue' ? "bg-rose-500 hover:bg-rose-600" : "bg-amber-500 hover:bg-amber-600"
                        )}>
                          Pagar
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {/* Métodos de pagamento */}
                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Pagar com</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: QrCode, label: "Pix", color: "hover:bg-teal-50 dark:hover:bg-teal-600/10 hover:border-teal-300" },
                      { icon: Barcode, label: "Boleto", color: "hover:bg-slate-100 dark:hover:bg-white/5" },
                      { icon: CreditCard, label: "Cartão", color: "hover:bg-violet-50 dark:hover:bg-violet-600/10 hover:border-violet-300" },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 transition-all text-slate-700 dark:text-slate-300",
                          opt.color
                        )}
                      >
                        <opt.icon className="w-5 h-5" />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-base font-bold">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-sm">Nenhum lançamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => {
                    const st = statusMap[p.status as PayStatus] ?? statusMap.pending
                    const StatusIcon = st.icon
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", st.badge)}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm">{p.descricao}</p>
                            <p className="text-xs text-slate-500">
                              {p.status === 'paid' && p.pagamento
                                ? `Pago em ${p.pagamento}`
                                : `Vence em ${p.vencimento}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className="font-black text-slate-900 dark:text-white text-sm">R$ {fmt(p.valor)}</p>
                          <Badge className={cn("text-xs border-0 font-bold", st.badge)}>{st.label}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
