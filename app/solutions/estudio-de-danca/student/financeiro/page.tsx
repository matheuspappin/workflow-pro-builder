"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, CheckCircle2, Clock, AlertCircle, CreditCard, QrCode, Barcode, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const sid = user.user_metadata?.studio_id
      setStudioId(sid)
      if (!sid) { setLoading(false); return }

      try {
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
      } catch { /* sem cobranças */ }

      setLoading(false)
    }
    load()
  }, [])

  const pendentes = payments.filter(p => p.status === 'pending' || p.status === 'overdue')
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
