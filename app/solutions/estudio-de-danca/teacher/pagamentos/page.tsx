"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Wallet, Loader2, ArrowDownToLine, Clock, CheckCircle2, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const PIX_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave aleatória" },
]

export default function TeacherPagamentosPage() {
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState({ pending: 0, released: 0, withdrawn: 0, availableToWithdraw: 0 })
  const [entries, setEntries] = useState<any[]>([])
  const [pixSettings, setPixSettings] = useState<{ pix_key: string; pix_key_type: string } | null>(null)
  const [pixKey, setPixKey] = useState("")
  const [pixType, setPixType] = useState("cpf")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [savingPix, setSavingPix] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const sid = user?.user_metadata?.studio_id ?? null
    setStudioId(sid)
    if (!sid) { setLoading(false); return }

    try {
      const [balanceRes, paymentsRes, pixRes] = await Promise.all([
        fetch("/api/dance-studio/teacher-payments/balance", { credentials: "include" }),
        fetch(`/api/dance-studio/teacher-payments?studioId=${sid}&mine=true`, { credentials: "include" }),
        fetch("/api/dance-studio/teacher-payout-settings", { credentials: "include" }),
      ])
      const balanceData = await balanceRes.json()
      const paymentsData = await paymentsRes.json()
      const pixData = await pixRes.json()

      setBalance({
        pending: balanceData.pending || 0,
        released: balanceData.released || 0,
        withdrawn: balanceData.withdrawn || 0,
        availableToWithdraw: balanceData.availableToWithdraw || balanceData.released || 0,
      })
      setEntries(paymentsData.entries || [])
      setPixSettings(pixData)
      if (pixData) {
        setPixKey(pixData.pix_key || "")
        setPixType(pixData.pix_key_type || "cpf")
      }
    } catch {
      toast({ title: "Erro ao carregar", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const handleSavePix = async () => {
    if (!pixKey.trim()) {
      toast({ title: "Informe a chave PIX", variant: "destructive" })
      return
    }
    setSavingPix(true)
    try {
      const res = await fetch("/api/dance-studio/teacher-payout-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pix_key: pixKey.trim(), pix_key_type: pixType }),
        credentials: "include",
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setPixSettings({ pix_key: pixKey.trim(), pix_key_type: pixType })
      toast({ title: "Chave PIX salva!" })
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" })
    } finally {
      setSavingPix(false)
    }
  }

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount)
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" })
      return
    }
    if (amt > balance.availableToWithdraw) {
      toast({ title: "Saldo insuficiente", variant: "destructive" })
      return
    }
    if (!pixSettings?.pix_key) {
      toast({ title: "Cadastre sua chave PIX antes de sacar", variant: "destructive" })
      return
    }
    setWithdrawing(true)
    try {
      const res = await fetch("/api/dance-studio/teacher-withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          pix_key: pixSettings.pix_key,
          pix_key_type: pixSettings.pix_key_type,
        }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao solicitar saque")
      setWithdrawAmount("")
      toast({ title: "Saque solicitado!", description: "O valor será processado em breve." })
      load()
    } catch (e: any) {
      toast({ title: "Erro ao sacar", description: e.message, variant: "destructive" })
    } finally {
      setWithdrawing(false)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
  const formatMoney = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Wallet className="w-6 h-6 text-pink-500" />
          Meus Pagamentos
        </h1>
        <p className="text-slate-500 text-sm mt-1">Saldo, chave PIX e saques</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-amber-200 dark:border-amber-600/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-bold uppercase">Congelado</span>
            </div>
            <p className="text-2xl font-black mt-1">{formatMoney(balance.pending)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Aguardando liberação do estúdio</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-600/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-600">
              <ArrowDownToLine className="w-5 h-5" />
              <span className="text-sm font-bold uppercase">Disponível</span>
            </div>
            <p className="text-2xl font-black mt-1">{formatMoney(balance.availableToWithdraw)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Pode sacar via PIX</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-bold uppercase">Sacado</span>
            </div>
            <p className="text-2xl font-black mt-1">{formatMoney(balance.withdrawn)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Já recebido</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Chave PIX
          </CardTitle>
          <CardDescription>Cadastre sua chave PIX para receber os pagamentos. Necessário antes de solicitar saque.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Tipo</Label>
              <Select value={pixType} onValueChange={setPixType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIX_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Chave</Label>
              <Input
                placeholder={pixType === "email" ? "seu@email.com" : pixType === "phone" ? "(11) 99999-9999" : "Digite a chave"}
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <Button onClick={handleSavePix} disabled={savingPix} className="bg-pink-600 hover:bg-pink-700">
            {savingPix ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Chave PIX
          </Button>
        </CardContent>
      </Card>

      {balance.availableToWithdraw > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-600/30">
          <CardHeader>
            <CardTitle>Solicitar Saque</CardTitle>
            <CardDescription>
              {pixSettings?.pix_key
                ? `Valor disponível: ${formatMoney(balance.availableToWithdraw)}. Será enviado para ${pixSettings.pix_key}`
                : "Cadastre sua chave PIX acima para poder sacar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-xs">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={balance.availableToWithdraw}
                placeholder={formatMoney(balance.availableToWithdraw)}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={withdrawing || !pixSettings?.pix_key || !withdrawAmount}
              className="bg-emerald-600 hover:bg-emerald-700 self-end"
            >
              {withdrawing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowDownToLine className="w-4 h-4 mr-2" />}
              Sacar
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lançamentos</CardTitle>
          <CardDescription>Pagamentos gerados por aula ministrada</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhum lançamento ainda. As aulas que você ministrar gerarão pagamentos automaticamente.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((e: any) => (
                <div
                  key={e.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border",
                    e.status === "pending" && "border-amber-200 dark:border-amber-600/30",
                    e.status === "released" && "border-emerald-200 dark:border-emerald-600/30",
                    e.status === "withdrawn" && "border-slate-200 dark:border-white/10"
                  )}
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{e.class_name || "Aula"}</p>
                    <p className="text-xs text-slate-500">{formatDate(e.scheduled_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black">{formatMoney(e.amount)}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        e.status === "pending" && "border-amber-300 text-amber-700",
                        e.status === "released" && "border-emerald-300 text-emerald-700",
                        e.status === "withdrawn" && "border-slate-300 text-slate-600"
                      )}
                    >
                      {e.status === "pending" && "Congelado"}
                      {e.status === "released" && "Liberado"}
                      {e.status === "withdrawn" && "Sacado"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
