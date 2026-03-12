"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Receipt, Loader2, RefreshCw, Send } from "lucide-react"
import { FiscalCertificateSettings } from "@/components/dashboard/settings/fiscal-certificate-settings"
import { ModuleGuard } from "@/components/providers/module-guard"
import { getSessionKey } from "@/lib/constants/storage-keys"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const DANCE_SESSION_KEY = getSessionKey('estudio-de-danca')

interface PendingItem {
  id: string
  source_type: 'service_order' | 'erp_order' | 'package_purchase'
  external_id: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
}

export default function EmissorFiscalPage() {
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<PendingItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [emitting, setEmitting] = useState(false)
  const { toast } = useToast()

  const resolveStudioId = useCallback(async () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(DANCE_SESSION_KEY) : null
    if (stored) {
      try {
        const user = JSON.parse(stored)
        const sid = user.studio_id || user.studioId || null
        if (sid) return sid
      } catch {}
    }
    const fallback = typeof window !== 'undefined' ? localStorage.getItem('danceflow_user') : null
    if (fallback) {
      try {
        const user = JSON.parse(fallback)
        return user.studio_id || user.studioId || null
      } catch {}
    }
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.user_metadata?.studio_id ?? null
  }, [])

  useEffect(() => {
    const check = async () => {
      const sid = await resolveStudioId()
      setStudioId(sid)
      setLoading(false)
    }
    check()
  }, [resolveStudioId])

  const fetchPending = useCallback(async () => {
    if (!studioId) return
    setLoadingPending(true)
    try {
      const res = await fetch(`/api/nfe/pending?studioId=${studioId}`)
      const text = await res.text()
      let data: { pending?: PendingItem[]; error?: string }
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        // API retornou HTML (404/500) em vez de JSON
        const msg = res.status === 404
          ? 'Endpoint não encontrado. Verifique se a aplicação está atualizada.'
          : 'Resposta inválida do servidor. Tente novamente mais tarde.'
        throw new Error(msg)
      }
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar pendentes')
      setPending(data.pending || [])
    } catch (e) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Erro ao carregar pendentes', variant: 'destructive' })
    } finally {
      setLoadingPending(false)
    }
  }, [studioId, toast])

  useEffect(() => {
    if (studioId) fetchPending()
  }, [studioId, fetchPending])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === pending.length) setSelectedIds([])
    else setSelectedIds(pending.map(p => p.id))
  }

  const handleEmit = async () => {
    if (!studioId || selectedIds.length === 0) {
      toast({ title: 'Atenção', description: 'Selecione pelo menos um item para emitir.', variant: 'destructive' })
      return
    }
    setEmitting(true)
    let success = 0
    let failed = 0
    for (const id of selectedIds) {
      const item = pending.find(p => p.id === id)
      if (!item) continue
      try {
        const res = await fetch('/api/nfe/emit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studio_id: studioId,
            source_type: item.source_type,
            source_id: id,
          }),
        })
        const text = await res.text()
        let data: { success?: boolean; error?: string; invoice_number?: string; provider?: string; simulated?: boolean }
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          throw new Error(res.ok ? 'Resposta inválida do servidor.' : 'Erro ao emitir nota. Tente novamente.')
        }
        if (res.ok && data.success) success++
        else {
          failed++
          toast({ title: 'Erro', description: data.error || `Falha ao emitir ${item.external_id}`, variant: 'destructive' })
        }
      } catch (e) {
        failed++
        toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Falha ao emitir', variant: 'destructive' })
      }
    }
    setEmitting(false)
    setSelectedIds([])
    await fetchPending()
    if (success > 0) toast({ title: 'Sucesso', description: `${success} nota(s) emitida(s) com sucesso.` })
    if (failed > 0) toast({ title: 'Atenção', description: `${failed} falha(s) na emissão.`, variant: 'destructive' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <ModuleGuard module="fiscal" showFullError>
      <div className="space-y-6">
        <Link
          href="/solutions/estudio-de-danca/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-7 w-7 text-violet-500" />
            Emissor Fiscal (NF-e)
          </h1>
          <p className="text-muted-foreground">
            Configure o certificado digital A1 (.pfx) e emita Notas Fiscais Eletrônicas via SEFAZ.
          </p>
        </div>

        <FiscalCertificateSettings studioId={studioId} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pendentes de emissão</CardTitle>
              <CardDescription>
                PDV, ERP e compras de créditos que ainda não foram faturados.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchPending} disabled={loadingPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingPending ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Carregando...
              </div>
            ) : pending.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground border rounded-lg border-dashed">
                Nenhum item pendente de emissão.
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left border-b">
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === pending.length && pending.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-4 font-medium">Origem</th>
                        <th className="p-4 font-medium">ID</th>
                        <th className="p-4 font-medium">Cliente</th>
                        <th className="p-4 font-medium">Valor</th>
                        <th className="p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => toggleSelect(p.id)}
                            />
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px]">
                              {p.source_type === 'service_order' ? 'PDV' : p.source_type === 'package_purchase' ? 'Créditos' : 'ERP'}
                            </Badge>
                          </td>
                          <td className="p-4 font-mono font-bold text-xs">{p.external_id}</td>
                          <td className="p-4">{p.customer_name}</td>
                          <td className="p-4 font-bold">R$ {Number(p.total_amount).toLocaleString('pt-BR')}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px] uppercase">{p.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={selectedIds.length === 0 || emitting}
                  onClick={handleEmit}
                >
                  {emitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Emitir {selectedIds.length} nota(s) selecionada(s)
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleGuard>
  )
}
