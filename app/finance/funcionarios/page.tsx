"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  DollarSign,
  CheckCircle,
  Plus,
  ChevronDown,
  Wrench,
  GraduationCap,
  Building2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOrganization } from "@/components/providers/organization-provider"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const typeLabels: Record<string, string> = {
  technician: "Técnico",
  engineer: "Engenheiro",
  architect: "Arquiteto",
  other: "Outro",
}

export default function FuncionariosFinancePage() {
  const { studioId } = useOrganization()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [professionals, setProfessionals] = useState<any[]>([])
  const [referenceMonth, setReferenceMonth] = useState(
    () => new Date().toISOString().slice(0, 7)
  )
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [payAmount, setPayAmount] = useState("")
  const [paySource, setPaySource] = useState("mixed")
  const [payMethod, setPayMethod] = useState("")
  const [payNotes, setPayNotes] = useState("")
  const [paying, setPaying] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = async () => {
    const studio = studioId || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("workflow_pro_active_studio") || "null") : null)
    if (!studio) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/finance/employee-payments?studioId=${studio}&referenceMonth=${referenceMonth}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao carregar")
      setProfessionals(data.professionals || [])
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [studioId, referenceMonth])

  const handleOpenPay = (prof: any) => {
    setSelectedProfessional(prof)
    setPayAmount(prof.pendingCommission > 0 ? String(prof.pendingCommission) : "")
    setPaySource("mixed")
    setPayMethod("")
    setPayNotes("")
    setPayModalOpen(true)
  }

  const handlePay = async () => {
    const studio = studioId || JSON.parse(localStorage.getItem("workflow_pro_active_studio") || "null")
    if (!studio || !selectedProfessional) return
    const amount = parseFloat(payAmount.replace(",", "."))
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" })
      return
    }
    setPaying(true)
    try {
      const serviceOrderIds = selectedProfessional.pendingOrders?.map((o: any) => o.id) || []
      const res = await fetch("/api/finance/employee-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId: studio,
          professional_id: selectedProfessional.id,
          amount,
          reference_month: referenceMonth,
          source_type: paySource,
          payment_method: payMethod || undefined,
          notes: payNotes || undefined,
          service_order_ids: serviceOrderIds.length > 0 ? serviceOrderIds : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao registrar pagamento")
      toast({ title: "Pagamento registrado com sucesso" })
      setPayModalOpen(false)
      setSelectedProfessional(null)
      load()
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Pagamentos aos Funcionários
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Técnicos, engenheiros e demais colaboradores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-slate-500">Mês</Label>
          <Input
            type="month"
            value={referenceMonth}
            onChange={(e) => setReferenceMonth(e.target.value)}
            className="w-36"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {professionals.length === 0 ? (
          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum funcionário com pagamentos ou comissões neste mês.</p>
            </CardContent>
          </Card>
        ) : (
          professionals.map((prof) => {
            const hasPending = prof.pendingCommission > 0
            const hasPaid = prof.paidThisMonth > 0
            const expand = expandedId === prof.id
            const TypeIcon = prof.professional_type === "engineer" || prof.professional_type === "architect" ? GraduationCap : Wrench
            return (
              <Card
                key={prof.id}
                className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                  onClick={() => setExpandedId(expand ? null : prof.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <TypeIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{prof.name}</p>
                      <p className="text-xs text-slate-500">
                        {typeLabels[prof.professional_type] || prof.professional_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {hasPending && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-bold">
                        Pendente: R$ {prof.pendingCommission.toLocaleString("pt-BR")}
                      </Badge>
                    )}
                    {hasPaid && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-bold">
                        Pago: R$ {prof.paidThisMonth.toLocaleString("pt-BR")}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPay(prof)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Pagar
                    </Button>
                    <ChevronDown
                      className={cn("w-5 h-5 text-slate-400 transition-transform", expand && "rotate-180")}
                    />
                  </div>
                </div>
                {expand && (
                  <CardContent className="border-t border-slate-100 dark:border-white/5 pt-4 pb-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {prof.pendingOrders?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-500 mb-2">OS com comissão pendente</p>
                          <ul className="space-y-1">
                            {prof.pendingOrders.map((o: any) => (
                              <li
                                key={o.id}
                                className="flex items-center justify-between text-sm py-1 border-b border-slate-50 last:border-0"
                              >
                                <span className="text-slate-600 dark:text-slate-300">
                                  #{o.tracking_code || o.id?.slice(0, 8)} — R$ {(o.commission_value || 0).toLocaleString("pt-BR")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {prof.payments?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-500 mb-2">Pagamentos realizados</p>
                          <ul className="space-y-1">
                            {prof.payments.map((p: any, i: number) => (
                              <li
                                key={i}
                                className="flex items-center justify-between text-sm py-1 border-b border-slate-50 last:border-0"
                              >
                                <span className="text-emerald-600 font-medium">
                                  R$ {Number(p.amount || 0).toLocaleString("pt-BR")}
                                </span>
                                <span className="text-slate-500 text-xs">
                                  {p.paid_at ? new Date(p.paid_at).toLocaleDateString("pt-BR") : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Registrar Pagamento
            </DialogTitle>
          </DialogHeader>
          {selectedProfessional && (
            <div className="space-y-4 py-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedProfessional.name} — {typeLabels[selectedProfessional.professional_type]}
              </p>
              <div className="grid gap-4">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    placeholder="0,00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="mt-1"
                  />
                  {selectedProfessional.pendingCommission > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Comissão pendente: R$ {selectedProfessional.pendingCommission.toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={paySource} onValueChange={setPaySource}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commission">Comissão (OS)</SelectItem>
                      <SelectItem value="salary">Salário</SelectItem>
                      <SelectItem value="bonus">Bônus</SelectItem>
                      <SelectItem value="mixed">Misto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input
                    placeholder="Opcional"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handlePay}
              disabled={paying || !payAmount}
            >
              {paying ? "Salvando..." : "Registrar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
