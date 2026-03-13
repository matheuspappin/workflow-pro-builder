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

const VERTICALIZATION_SLUG = "estudio-de-danca"

const DEFAULT_PLAN_LIMITS = {
  name: "Gratuito",
  price: 0,
  max_students: 10,
  max_teachers: 1,
  has_whatsapp: false,
  has_ai: false,
  has_finance: true,
  has_multi_unit: false,
  has_pos: false,
  has_inventory: false,
  has_gamification: false,
  has_leads: false,
  has_scanner: false,
  has_marketplace: false,
  has_erp: false,
}

export default function PlanosPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [studioId, setStudioId] = useState("")
  const [usage, setUsage] = useState({ students: 0, teachers: 0, plan: "gratuito", planName: null as string | null })
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
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean> | null>(null)

  // Carregar dados
  useEffect(() => {
    const userStr = localStorage.getItem("danceflow_user")
    if (!userStr) return
    const user = JSON.parse(userStr)
    const sId = user.studio_id || user.studioId
    setStudioId(sId || "")
    if (sId) {
      loadUsage(sId)
      loadInvoices(sId)
      loadEnabledModules(sId)
    } else {
      setUsageLoaded(true)
      setEnabledModules(null)
    }
    loadVerticalizationPlans()
  }, [])

  const loadUsage = async (sId: string) => {
    setUsageLoaded(false)
    try {
      const res = await fetch(`/api/dance-studio/usage?studioId=${encodeURIComponent(sId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao carregar uso")
      const plan = data.plan || "gratuito"
      setUsage({
        students: data.students ?? 0,
        teachers: data.teachers ?? 0,
        plan,
        planName: data.planName ?? null,
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

  const loadVerticalizationPlans = async () => {
    setLoadingPlans(true)
    try {
      const res = await fetch(`/api/verticalization/plans?slug=${encodeURIComponent(VERTICALIZATION_SLUG)}`)
      const data = await res.json()
      if (res.ok && Array.isArray(data.plans)) {
        setPlans(data.plans)
      } else {
        setPlans([])
      }
    } catch (e) {
      console.error("Erro ao carregar planos da verticalização:", e)
      setPlans([])
    } finally {
      setLoadingPlans(false)
    }
  }

  const loadEnabledModules = async (sId: string) => {
    try {
      const res = await fetch(`/api/dance-studio/config?studioId=${encodeURIComponent(sId)}`, { credentials: "include" })
      const data = await res.json()
      if (res.ok && data.enabledModules && typeof data.enabledModules === "object") {
        setEnabledModules(data.enabledModules)
      } else {
        setEnabledModules(null)
      }
    } catch {
      setEnabledModules(null)
    }
  }

  const getCurrentPlanLimits = () => {
    const normalizedPlanId = ["starter", "free"].includes(usage.plan?.toLowerCase?.())
      ? "gratuito"
      : usage.plan === "pro+"
        ? "pro-plus"
        : usage.plan
    const plan = plans.find((p) => p.plan_id === normalizedPlanId || p.plan_id === usage.plan || p.id === usage.plan)
    const normalized = normalizePlanForDisplay(plan ?? null, normalizedPlanId)
    const name = usage.planName ?? normalized.name ?? usage.plan?.replace?.("pro-plus", "Pro+") ?? usage.plan ?? "Gratuito"
    return { ...DEFAULT_PLAN_LIMITS, ...normalized, name }
  }

  const syncPlanFromInvoice = async () => {
    if (!studioId) return
    setIsSyncingFromInvoice(true)
    try {
      const res = await fetch("/api/dance-studio/sync-plan", {
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
        await loadEnabledModules(studioId)
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
        window.location.replace("/solutions/estudio-de-danca/dashboard/planos")
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
    const plan = plans.find((p) => p.id === selectedNewPlan || p.plan_id === selectedNewPlan)
    if (!plan || !studioId) return
    toast({
      title: "Redirecionando para Stripe",
      description: `Preparando checkout para o plano ${plan?.name}...`,
    })
    setIsLoading(true)
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const successUrl = `${baseUrl}/solutions/estudio-de-danca/dashboard/planos?success=true&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${baseUrl}/solutions/estudio-de-danca/dashboard/planos?canceled=true`
      const response = await fetch("/api/admin/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.plan_id || plan.id,
          studioId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          verticalizationSlug: VERTICALIZATION_SLUG,
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

  // Detectar se o plano exibido não bate com a última fatura paga (possível dessincronia)
  const latestPaidInvoice = invoices.find((i: any) => i.status === "paid")
  const planPriceMismatch =
    latestPaidInvoice &&
    Math.abs(Number(latestPaidInvoice.amount) - Number(limits.price || 0)) > 1

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center gap-3 mb-6 px-1">
        <Link
          href="/solutions/estudio-de-danca/dashboard/configuracoes"
          className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
          <CreditCard className="w-5 h-5 text-white" />
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
                    {!usageLoaded ? "—" : ["gratuito", "starter", "free"].includes(usage.plan?.toLowerCase?.())
                      ? "Ideal para começar sua jornada"
                      : usage.plan === "pro"
                        ? "Tudo o que você precisa para crescer"
                        : ["pro-plus", "pro+"].includes(usage.plan)
                          ? "O melhor custo-benefício para estabelecimentos médios"
                          : "Escalabilidade e suporte total"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {!usageLoaded ? "—" : `R$ ${Number(limits.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">/mês</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-end">
                    {searchParams.get("session_id") && (
                      <Button
                        size="sm"
                        className="h-9 px-4 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-0"
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
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Alunos Ativos</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {usage.students} / {(limits.max_students ?? 0) >= 1000 ? "Ilimitado" : limits.max_students ?? 10}
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
                          (usage.students / (limits.max_students || 1)) * 100,
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
                      {usage.teachers} / {(limits.max_teachers ?? 0) >= 1000 ? "Ilimitado" : limits.max_teachers ?? 1}
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
                          (usage.teachers / (limits.max_teachers || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Recursos do plano
                </p>
                <div className="flex flex-wrap gap-2">
                  {getModulesForVerticalization(VERTICALIZATION_SLUG)
                    .filter((m) => m.key !== "dashboard")
                    .map(({ key, label }) => {
                      const has = enabledModules?.[key] === true
                      return (
                        <Badge
                          key={key}
                          variant="secondary"
                          className={cn(
                            "gap-1.5 px-3 py-1 font-medium",
                            has
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 border-slate-300/50 dark:border-slate-600"
                          )}
                        >
                          {has ? <CheckCircle className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 opacity-70" />}
                          {label}
                        </Badge>
                      )
                    })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md hover:shadow-lg transition-shadow"
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

      {/* Modal de Seleção de Plano */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Escolha seu Novo Plano</DialogTitle>
            <DialogDescription className="text-center">
              Selecione a melhor opção para o crescimento do seu estúdio. Você poderá revisar antes da cobrança.
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
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-2" />
                <p className="text-sm text-slate-500">Carregando planos...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="col-span-full py-10 text-center">
                <p className="text-slate-500 text-sm">Nenhum plano configurado para esta verticalização.</p>
                <p className="text-slate-600 text-xs mt-1">O administrador pode configurar em Admin → Verticalizações → Estúdio de Dança → Planos e Preços.</p>
              </div>
            ) : (
              plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    (selectedNewPlan === plan.id || selectedNewPlan === plan.plan_id)
                      ? "border-violet-600 bg-violet-50 dark:bg-violet-900/10 ring-2 ring-violet-600/20"
                      : "border-border hover:border-violet-400",
                    (usage.plan === plan.plan_id || usage.plan === plan.id) && "opacity-60 cursor-default"
                  )}
                  onClick={() => (usage.plan !== plan.plan_id && usage.plan !== plan.id) && setSelectedNewPlan(plan.plan_id || plan.id)}
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
                        <CheckCircle className="w-3 h-3 text-violet-500" />
                        Até {(plan.max_students ?? plan.maxStudents) >= 1000 ? "Ilimitados" : plan.max_students ?? plan.maxStudents} alunos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-violet-500" />
                        Até {(plan.max_teachers ?? plan.maxProfessionals) >= 1000 ? "Ilimitados" : plan.max_teachers ?? plan.maxProfessionals} profissionais
                      </li>
                      {getModulesForVerticalization(VERTICALIZATION_SLUG)
                        .filter((m) => m.key !== "dashboard")
                        .map(({ key, label }) => {
                          const enabled = plan.modules?.[key] === true
                          return (
                            <li key={key} className="flex items-center gap-2">
                              {enabled ? (
                                <CheckCircle className="w-3 h-3 text-violet-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-slate-400" />
                              )}
                              {label}
                            </li>
                          )
                        })}
                    </ul>
                    {(usage.plan === plan.plan_id || usage.plan === plan.id) ? (
                      <Badge variant="secondary" className="mt-4 w-full justify-center py-1">
                        Plano Atual
                      </Badge>
                    ) : (
                      <Button
                        variant={(selectedNewPlan === plan.id || selectedNewPlan === plan.plan_id) ? "default" : "outline"}
                        className="mt-4 w-full text-xs h-8 bg-violet-600 hover:bg-violet-700"
                      >
                        {(selectedNewPlan === plan.id || selectedNewPlan === plan.plan_id) ? "Selecionado" : "Selecionar"}
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
              disabled={!selectedNewPlan || selectedNewPlan === usage.plan || isLoading || plans.length === 0}
              onClick={handleCheckout}
              className="bg-violet-600 hover:bg-violet-700"
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
