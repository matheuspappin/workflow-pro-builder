"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  Loader2,
  Zap,
  CheckCircle,
  XCircle,
  Lock,
  RefreshCw,
  ArrowLeft,
} from "lucide-react"
import { normalizePlanForDisplay } from "@/lib/plan-limits"
import { getModulesForVerticalization } from "@/config/verticalization-nav-modules"

interface PlanosVerticalPageProps {
  verticalizationSlug: string
  configUrl: string
  themeColor?: string
  themeBg?: string
}

const DEFAULT_PLAN_LIMITS = {
  name: "Gratuito",
  description: "Plano ativo",
  price: 0,
  max_students: 10,
  max_teachers: 1,
  has_whatsapp: false,
  has_ai: false,
  has_finance: true,
  has_multi_unit: false,
}

export function PlanosVerticalPage({
  verticalizationSlug,
  configUrl,
  themeColor = "text-indigo-400",
  themeBg = "bg-indigo-500/10",
}: PlanosVerticalPageProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [studioId, setStudioId] = useState("")
  const [usage, setUsage] = useState({ students: 0, teachers: 0, plan: "gratuito" })
  const [usageLoaded, setUsageLoaded] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [selectedNewPlan, setSelectedNewPlan] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [isSyncingFromInvoice, setIsSyncingFromInvoice] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid || "")
      let storedId = sid
      if (!storedId && typeof window !== "undefined") {
        const u = JSON.parse(localStorage.getItem("danceflow_user") || "{}")
        storedId = u.studio_id || u.studioId || null
        setStudioId(storedId || "")
      }
      if (storedId) {
        loadUsage(storedId)
        loadInvoices(storedId)
      } else {
        setUsageLoaded(true)
      }
      loadPlans()
    }
    load()
  }, [])

  const loadUsage = async (sId: string) => {
    setUsageLoaded(false)
    try {
      const res = await fetch(`/api/verticalization/usage?studioId=${encodeURIComponent(sId)}&slug=${verticalizationSlug}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao carregar uso")
      setUsage({
        students: data.students ?? 0,
        teachers: data.teachers ?? 0,
        plan: data.plan || "gratuito",
      })
    } catch (e) {
      console.error("Erro ao carregar uso:", e)
    } finally {
      setUsageLoaded(true)
    }
  }

  const loadInvoices = async (sId: string) => {
    try {
      const { data, error } = await supabase
        .from("studio_invoices")
        .select("*")
        .eq("studio_id", sId)
        .order("due_date", { ascending: false })
        .limit(10)
      if (error) throw error
      setInvoices(data || [])
    } catch (e) {
      console.error("Erro ao carregar faturas:", e)
    }
  }

  const loadPlans = async () => {
    setLoadingPlans(true)
    try {
      const res = await fetch(`/api/verticalization/plans?slug=${verticalizationSlug}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao carregar planos")
      setPlans(data.plans || [])
    } catch (e) {
      console.error("Erro ao carregar planos:", e)
    } finally {
      setLoadingPlans(false)
    }
  }

  const getCurrentPlanLimits = () => {
    const plan = plans.find((p: any) => p.plan_id === usage.plan || p.id === usage.plan)
    if (!plan) return { ...DEFAULT_PLAN_LIMITS, name: usage.plan || "Gratuito", price: 0 }
    const normalized = normalizePlanForDisplay(plan, plan.plan_id)
    return {
      ...DEFAULT_PLAN_LIMITS,
      ...normalized,
      name: plan.name,
      description: plan.description ?? "Plano ativo",
      price: Number(plan.price),
      max_students: plan.max_students ?? 10,
      max_teachers: plan.max_teachers ?? 1,
    }
  }

  const syncPlanFromInvoice = async () => {
    if (!studioId) return
    setIsSyncingFromInvoice(true)
    try {
      const res = await fetch("/api/admin/checkout/sync-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId }),
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Plano Sincronizado!",
          description: data.message || "O plano foi atualizado com base na última fatura paga.",
        })
        await loadUsage(studioId)
        await loadInvoices(studioId)
        window.location.reload()
      } else {
        toast({
          title: "Não foi possível sincronizar",
          description: data.error || data.message || "Verifique se há faturas pagas.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSyncingFromInvoice(false)
    }
  }

  const verifyPayment = async (sessionId: string) => {
    setIsVerifyingPayment(true)
    try {
      const res = await fetch(`/api/admin/checkout/verify?session_id=${sessionId}`)
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Pagamento Confirmado!",
          description: data.message || "Seu plano foi atualizado com sucesso.",
        })
        if (studioId) {
          await loadUsage(studioId)
          await loadInvoices(studioId)
        }
        window.location.reload()
      } else {
        toast({
          title: "Erro ao sincronizar",
          description: data.error || data.message || "Não foi possível atualizar o plano.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar",
        description: error?.message || "Não foi possível verificar o pagamento.",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  useEffect(() => {
    const success = searchParams.get("success")
    const sessionId = searchParams.get("session_id")
    if (success === "true" && sessionId) {
      verifyPayment(sessionId)
    }
  }, [searchParams])

  const handleCheckout = async () => {
    const plan = plans.find((p: any) => p.id === selectedNewPlan || p.plan_id === selectedNewPlan)
    if (!plan || !studioId) return
    toast({
      title: "Redirecionando para Stripe",
      description: `Preparando checkout para o plano ${plan?.name}...`,
    })
    setIsLoading(true)
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const successUrl = `${baseUrl}${window.location.pathname}?success=true&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${baseUrl}${window.location.pathname}?canceled=true`
      const response = await fetch("/api/admin/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          studioId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          verticalizationSlug,
          billingInterval,
        }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Erro ao criar checkout")
      }
    } catch (error: any) {
      toast({
        title: "Erro no Checkout",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const limits = getCurrentPlanLimits()
  const latestPaidInvoice = invoices.find((i: any) => i.status === "paid")
  const planPriceMismatch =
    latestPaidInvoice &&
    Math.abs(Number(latestPaidInvoice.amount) - Number(limits.price || 0)) > 1

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center gap-3 mb-6 px-1">
        <Link
          href={configUrl}
          className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-lg", themeBg)}>
          <CreditCard className={cn("w-5 h-5", themeColor)} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Planos e Preços</h1>
          <p className="text-xs text-slate-500">Gerencie sua assinatura e acompanhe seus limites</p>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Seu Plano</CardTitle>
            <CardDescription>Gerencie sua assinatura e acompanhe seus limites</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={cn(
                "p-6 border-2 rounded-xl transition-colors",
                usage.plan === "gratuito" || ["starter", "free"].includes(usage.plan?.toLowerCase?.())
                  ? "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800/60"
                  : "border-primary/50 bg-primary/5 dark:bg-primary/10"
              )}
            >
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    {!usageLoaded ? "Carregando..." : limits.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mt-0.5">
                    {!usageLoaded ? "—" : limits.description || "Plano ativo"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className={cn("text-3xl font-bold", themeColor)}>
                      {!usageLoaded ? "—" : `R$ ${Number(limits.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">/mês</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-end">
                    {searchParams.get("session_id") && (
                      <Button
                        size="sm"
                        className={cn("h-9 px-4 text-sm font-semibold text-white border-0", themeBg)}
                        onClick={() => verifyPayment(searchParams.get("session_id")!)}
                        disabled={isVerifyingPayment}
                      >
                        {isVerifyingPayment ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Sincronizar Plano
                      </Button>
                    )}
                    {latestPaidInvoice && (planPriceMismatch || !searchParams.get("session_id")) && (
                      <Button
                        size="sm"
                        variant={planPriceMismatch ? "default" : "outline"}
                        className={cn(
                          "h-9 px-4 text-sm font-semibold",
                          planPriceMismatch && "bg-amber-600 hover:bg-amber-700 text-white border-0"
                        )}
                        onClick={syncPlanFromInvoice}
                        disabled={isSyncingFromInvoice}
                      >
                        {isSyncingFromInvoice ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        {planPriceMismatch ? "Corrigir Plano (fatura ≠ exibido)" : "Sincronizar com Faturas"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Clientes Ativos</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {usage.students} / {(limits.max_students ?? 10) >= 1000 ? "Ilimitado" : limits.max_students ?? 10}
                    </span>
                  </div>
                  <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300 rounded-full",
                        usage.students >= (limits.max_students ?? 10)
                          ? "bg-red-500"
                          : "bg-emerald-500 dark:bg-emerald-400"
                      )}
                      style={{
                        width: `${Math.min(
                          (usage.students / ((limits.max_students ?? 10) || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Profissionais Ativos</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {usage.teachers} / {(limits.max_teachers ?? 1) >= 1000 ? "Ilimitado" : limits.max_teachers ?? 1}
                    </span>
                  </div>
                  <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300 rounded-full",
                        usage.teachers >= (limits.max_teachers ?? 1)
                          ? "bg-red-500"
                          : "bg-emerald-500 dark:bg-emerald-400"
                      )}
                      style={{
                        width: `${Math.min(
                          (usage.teachers / ((limits.max_teachers ?? 1) || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className={cn("font-semibold shadow-md hover:shadow-lg transition-shadow", themeBg, "text-white")}
                onClick={() => {
                  setSelectedNewPlan(null)
                  setIsPlanModalOpen(true)
                }}
              >
                <Zap className="w-4 h-4 mr-2" />
                {["gratuito", "starter", "free"].includes(usage.plan?.toLowerCase?.())
                  ? "Ver Planos e Preços"
                  : "Alterar Plano"}
              </Button>
            </div>

            <div className="pt-6 border-t border-border">
              <h4 className="font-medium text-foreground mb-4">Histórico de Faturas</h4>
              <div className="space-y-3">
                {invoices.length > 0 ? (
                  invoices.map((invoice: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">
                          {new Date(invoice.due_date)
                            .toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
                            .replace(/^\w/, (c) => c.toUpperCase())}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Vencimento: {new Date(invoice.due_date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <span className="text-muted-foreground font-bold">
                        R$ {Number(invoice.amount).toFixed(2).replace(".", ",")}
                      </span>
                      <Badge
                        variant={invoice.status === "paid" ? "default" : "secondary"}
                        className={
                          invoice.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                            : ""
                        }
                      >
                        {invoice.status === "paid" ? "Pago" : invoice.status === "pending" ? "Pendente" : "Falhou"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhuma fatura encontrada.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Escolha seu Novo Plano</DialogTitle>
            <DialogDescription className="text-center">
              Selecione a melhor opção para o crescimento do seu negócio. Você poderá revisar antes da cobrança.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-2 py-4">
            <Button
              variant={billingInterval === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingInterval("monthly")}
            >
              Mensal
            </Button>
            <Button
              variant={billingInterval === "yearly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingInterval("yearly")}
            >
              Anual (2 meses grátis)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
            {loadingPlans ? (
              <div className="col-span-full py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-500" />
                <p className="text-sm text-slate-500">Carregando planos...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="col-span-full py-10 text-center">
                <p className="text-slate-500">Nenhum plano disponível no momento.</p>
              </div>
            ) : (
              plans.map((plan: any) => (
                <Card
                  key={plan.id}
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    selectedNewPlan === plan.id
                      ? `${themeBg} border-current ring-2 ring-current/20`
                      : "border-border hover:border-slate-400",
                    usage.plan === plan.plan_id && "opacity-60 cursor-default"
                  )}
                  onClick={() => usage.plan !== plan.plan_id && setSelectedNewPlan(plan.id)}
                >
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="mb-4">
                      <h4 className="font-bold text-lg uppercase">{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold">
                          R$ {billingInterval === "yearly" && plan.price_annual
                            ? Number(plan.price_annual).toFixed(0)
                            : Number(plan.price).toFixed(0)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {billingInterval === "yearly" ? "/ano" : "/mês"}
                        </span>
                      </div>
                      {billingInterval === "yearly" && plan.price_annual && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Economize {plan.annual_discount_percent ?? 17}%
                        </p>
                      )}
                    </div>
                    <ul className="space-y-2 text-xs flex-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        Até {(plan.max_students ?? 10) >= 1000 ? "Ilimitados" : plan.max_students ?? 10} clientes
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        Até {(plan.max_teachers ?? 1) >= 1000 ? "Ilimitados" : plan.max_teachers ?? 1} profissionais
                      </li>
                      {getModulesForVerticalization(verticalizationSlug)
                        .filter((m) => m.key !== "dashboard")
                        .map(({ key, label }) => {
                          const enabled = plan.modules?.[key] === true
                          return (
                            <li key={key} className="flex items-center gap-2">
                              {enabled ? (
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-slate-400" />
                              )}
                              {label}
                            </li>
                          )
                        })}
                    </ul>
                    {usage.plan === plan.plan_id ? (
                      <Badge variant="secondary" className="mt-4 w-full justify-center py-1">
                        Plano Atual
                      </Badge>
                    ) : (
                      <Button
                        variant={selectedNewPlan === plan.id ? "default" : "outline"}
                        className={cn("mt-4 w-full text-xs h-8", themeBg, "text-white")}
                      >
                        {selectedNewPlan === plan.id ? "Selecionado" : "Selecionar"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsPlanModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!selectedNewPlan || selectedNewPlan === usage.plan || isLoading}
              onClick={handleCheckout}
              className={cn(themeBg, "text-white")}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Continuar para Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
