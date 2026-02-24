"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { useOrganization } from "@/components/providers/organization-provider"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PendingItem {
  id: string
  tracking_code?: string
  title?: string
  total_amount: number
  discount_amount?: number
  payment_status?: string
  paid_at?: string
  created_at: string
  customer?: { id: string; name?: string; phone?: string; email?: string } | { id: string; name?: string; phone?: string; email?: string }[]
}

interface EmittedNote {
  id: string
  source_type: string
  source_id?: string
  invoice_number?: string
  access_key?: string
  status: string
  amount: number
  customer_data?: { name?: string; email?: string }
  created_at: string
}

export default function NotasPage() {
  const { studioId } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [emitting, setEmitting] = useState(false)
  const [pending, setPending] = useState<PendingItem[]>([])
  const [emitted, setEmitted] = useState<EmittedNote[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const loadData = async () => {
    const sid = studioId || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("danceflow_user") || "{}")?.studio_id : null)
    if (!sid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/notas?studioId=${sid}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setPending(data.pending || [])
        setEmitted(data.emitted || [])
      } else {
        toast.error(data.error || "Erro ao carregar")
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [studioId])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === pending.length) setSelected(new Set())
    else setSelected(new Set(pending.map((p) => p.id)))
  }

  const handleEmitBatch = async () => {
    if (selected.size === 0) {
      toast.error("Selecione pelo menos um item para emitir notas")
      return
    }
    const sid = studioId || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("danceflow_user") || "{}")?.studio_id : null)
    if (!sid) return

    setEmitting(true)
    try {
      const res = await fetch("/api/finance/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId: sid,
          items: Array.from(selected).map((id) => ({ id, type: "service_order" as const })),
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        const ok = data.results.filter((r: any) => r.status === "emitted").length
        const err = data.results.filter((r: any) => r.status === "error").length
        if (err > 0) {
          toast.warning(`${ok} emitida(s), ${err} com erro`)
          data.results.filter((r: any) => r.status === "error").forEach((r: any) => {
            toast.error(`${r.id}: ${r.error}`)
          })
        } else {
          toast.success(`${ok} nota(s) emitida(s) com sucesso`)
        }
        setSelected(new Set())
        loadData()
      } else {
        toast.error(data.error || "Erro ao emitir")
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao emitir")
    } finally {
      setEmitting(false)
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR")

  const customerName = (c: PendingItem["customer"]) => {
    if (!c) return "—"
    const arr = Array.isArray(c) ? c : [c]
    return arr[0]?.name || "—"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Notas Fiscais
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Emitir NF-e em lote para vendas pagas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            onClick={handleEmitBatch}
            disabled={emitting || selected.size === 0}
          >
            {emitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Emitir {selected.size > 0 ? `${selected.size} nota(s)` : "selecionadas"}
          </Button>
        </div>
      </div>

      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-800 dark:text-amber-200">Integração com API de NF-e</p>
            <p className="text-amber-700 dark:text-amber-300/80 mt-0.5">
              Configure <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">NOTES_API_URL</code> e{" "}
              <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">NOTES_API_TOKEN</code> no .env para
              conectar ao seu provedor (Focus NFe, PlugNotas, Nuvem Fiscal, etc.). Sem configuração, as notas
              são geradas em modo simulado.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Pendentes de emissão ({pending.length})
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Vendas pagas (PDV) que ainda não têm nota fiscal. Selecione várias e emita em lote.
            </p>

            {pending.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">Nenhum item pendente</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    checked={selected.size === pending.length}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-xs font-bold text-slate-500">Selecionar todas</span>
                </div>
                <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                  {pending.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selected.has(item.id)
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
                          : "bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-300/50"
                      )}
                      onClick={() => toggleSelect(item.id)}
                    >
                      <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {item.title || item.tracking_code || item.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-500">{customerName(item.customer)} • {formatDate(item.created_at)}</p>
                      </div>
                      <span className="font-black text-emerald-600 text-sm">{formatCurrency(Number(item.total_amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Notas emitidas ({emitted.length})
            </h2>

            {emitted.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">Nenhuma nota emitida ainda</p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                {emitted.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {note.invoice_number || `#${note.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {note.customer_data?.name || "—"} • {formatDate(note.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 text-sm">{formatCurrency(Number(note.amount))}</span>
                      <Badge className={cn(
                        "ml-2 text-[10px]",
                        note.status === "emitted" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20" : "bg-red-100 text-red-700"
                      )}>
                        {note.status === "emitted" ? "Emitida" : note.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
