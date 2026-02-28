'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useVocabulary } from '@/hooks/use-vocabulary'
import { useOrganization } from '@/components/providers/organization-provider'
import { supabase } from '@/lib/supabase'
import { Loader2, FileText, Calendar, Clock, ChevronLeft, Package, Wrench, CheckCircle2, Shield, QrCode as QrCodeIcon, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import QRCode from "react-qr-code"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function StudentOSDetailPage() {
  const params = useParams()
  const { id } = params
  const { vocabulary, t } = useVocabulary()
  const { toast } = useToast()
  const { studioId, businessModel } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [isClientIDOpen, setIsClientIDOpen] = useState(false)
  const [isPayingOnline, setIsPayingOnline] = useState(false)

  useEffect(() => {
    async function loadInitialData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) setStudent(session.user)
      
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          professional:teachers(name),
          items:service_order_items(*),
          history:service_order_history(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar detalhes da OS:', error)
      } else {
        setOrder(data)
      }
      setLoading(false)
    }

    if (id) {
      loadInitialData()
    }
  }, [id])

  const handlePayOS = async () => {
    try {
      setIsPayingOnline(true)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: order.id,
          amount: Number(order.total_amount),
          description: `Pagamento OS #${order.tracking_code || order.id.substring(0,8)}`,
          studentId: student.id,
          studioId: order.studio_id,
          type: 'service_order'
        })
      })

      const data = await response.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error || 'Erro ao criar sessão de pagamento')
    } catch (e: any) {
      toast({ title: "Erro no pagamento", description: e.message, variant: "destructive" })
    } finally {
      setIsPayingOnline(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold">Ordem de Serviço não encontrada</h1>
        <Button className="mt-4" asChild>
          <Link href="/student/os">Voltar para a lista</Link>
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-600'
      case 'open': return 'bg-blue-100 text-blue-600'
      case 'in_progress': return 'bg-amber-100 text-amber-600'
      case 'finished': return 'bg-green-100 text-green-600'
      case 'cancelled': return 'bg-red-100 text-red-600'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho'
      case 'open': return 'Aberta'
      case 'in_progress': return 'Em Execução'
      case 'finished': return 'Finalizada'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10">
      <div className="bg-white dark:bg-slate-900 border-b p-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/student/os">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">Detalhes da OS</h1>
        <Badge className={`ml-auto ${getStatusColor(order.status)} border-none text-[10px] uppercase`}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      <main className="container p-4 space-y-4 max-w-md mx-auto">
        {/* Cabeçalho da OS */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className={`${order.status === 'finished' ? 'bg-emerald-600' : 'bg-slate-900'} text-white p-6 transition-colors duration-500`}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className={`text-[10px] font-black ${order.status === 'finished' ? 'text-emerald-100' : 'text-indigo-400'} uppercase tracking-widest`}>Código de Rastreio</p>
                <h2 className="text-2xl font-black">{order.tracking_code || order.id.substring(0, 8)}</h2>
              </div>
              {order.status === 'finished' ? <CheckCircle2 className="w-8 h-8 text-emerald-200" /> : <FileText className="w-8 h-8 opacity-20" />}
            </div>
            
            {order.status === 'finished' && businessModel === 'MONETARY' && (
              <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm space-y-3">
                {order.payment_status === 'paid' ? (
                  <>
                    <p className="text-xs font-bold text-center leading-tight">Pagamento Confirmado! ✅ Apresente seu QR Code para validar a entrega/conclusão.</p>
                    <Button 
                      className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-black tracking-widest text-[10px] h-10 shadow-lg"
                      onClick={() => setIsClientIDOpen(true)}
                    >
                      <QrCodeIcon className="w-4 h-4 mr-2" /> MOSTRAR MEU QR CODE
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-center leading-tight">Serviço Concluído! ⚠️ Efetue o pagamento para liberar a entrega e o QR Code.</p>
                    <Button 
                      className="w-full bg-white text-rose-600 hover:bg-rose-50 font-black tracking-widest text-[10px] h-10 shadow-lg animate-pulse"
                      onClick={handlePayOS}
                      disabled={isPayingOnline}
                    >
                      {isPayingOnline ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                      PAGAR E LIBERAR AGORA
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Barra de Progresso Visual */}
            <div className="px-6 pb-2">
              <div className="flex justify-between items-center mb-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Início</span>
                <span>Execução</span>
                <span>Finalizado</span>
              </div>
              <div className="flex items-center gap-2 py-2">
                <div className={`h-2 flex-1 rounded-full ${order.status === 'open' || order.status === 'in_progress' || order.status === 'finished' ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                <div className={`h-2 flex-1 rounded-full ${order.status === 'in_progress' || order.status === 'finished' ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                <div className={`h-2 flex-1 rounded-full ${order.status === 'finished' ? 'bg-emerald-500' : 'bg-slate-100'}`} />
              </div>
            </div>

            <div className="px-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Descrição do Serviço</Label>
              <p className="text-sm font-medium leading-relaxed">{order.description || 'Nenhuma descrição fornecida'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Data de Abertura</Label>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  {format(new Date(order.opened_at || order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
              {order.finished_at && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Conclusão</Label>
                  <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {format(new Date(order.finished_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              )}
            </div>

            {order.professional && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Responsável Técnico</Label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {order.professional.name[0]}
                  </div>
                  <span className="text-sm font-bold">{order.professional.name}</span>
                </div>
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        {/* Itens e Peças */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              Itens do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      {item.item_type === 'product' ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{item.description}</p>
                      <p className="text-[10px] text-muted-foreground">{item.quantity}x R$ {Number(item.unit_price).toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black">R$ {Number(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="p-4 space-y-2 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {(Number(order.total_products || 0) + Number(order.total_services || 0)).toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs text-red-500 font-bold">
                    <span>Desconto</span>
                    <span>- R$ {Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-2 border-t">
                  <span>Total Geral</span>
                  <div className="flex flex-col items-end">
                    <span className="text-indigo-600 text-lg">R$ {Number(order.total_amount).toFixed(2)}</span>
                    {order.payment_status === 'paid' ? (
                      <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">PAGO ✅</span>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest">PENDENTE ⚠️</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.status === 'finished' && order.payment_status !== 'paid' && (
           <Card className="border-none shadow-xl bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500">
             <CardContent className="p-6 space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                   <CreditCard className="w-5 h-5 text-amber-600" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black uppercase">Pagamento Necessário</h3>
                   <p className="text-[11px] text-amber-700">O serviço foi finalizado. Efetue o pagamento online para liberar o QR Code de retirada.</p>
                 </div>
               </div>
               <Button 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95"
                onClick={handlePayOS}
                disabled={isPayingOnline}
               >
                 {isPayingOnline ? <Loader2 className="w-5 h-5 animate-spin" /> : "PAGAR AGORA R$ " + Number(order.total_amount).toFixed(2)}
               </Button>
             </CardContent>
           </Card>
        )}

        {/* Observações */}
        {order.observations && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-tight">Observações Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "{order.observations}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Assinatura */}
        {order.customer_signature_url && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Assinatura Digital do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-4">
              <img src={order.customer_signature_url} alt="Assinatura" className="h-20 object-contain opacity-70 grayscale" />
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={isClientIDOpen} onOpenChange={setIsClientIDOpen}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl">
          <div className="bg-emerald-600 p-10 text-center text-white space-y-3">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 backdrop-blur-md border border-white/20 shadow-xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight uppercase">Liberação</h2>
            <p className="text-emerald-100 text-sm font-bold opacity-90 tracking-wide leading-tight">Use este código para autorizar a conclusão e entrega do serviço.</p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 gap-10 bg-white dark:bg-slate-950">
            <div className="bg-white p-6 rounded-[3rem] shadow-2xl border-[12px] border-emerald-50">
              <QRCode
                value={`SECURE-AUTH-RETIRADA-CLI-${student?.id?.toString().slice(-12).toUpperCase()}-${order?.id?.slice(-8)}-${new Date().toISOString().slice(0,10)}`}
                size={240}
                level="H"
                viewBox={`0 0 256 256`}
              />
            </div>

            <div className="space-y-6 w-full px-12 text-center">
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-5 rounded-3xl border border-slate-100 dark:border-slate-800 w-full shadow-inner">
                <p className="text-[11px] text-muted-foreground font-black uppercase mb-2 tracking-[0.3em]">CÓDIGO DE LIBERAÇÃO DIÁRIO</p>
                <p className="font-mono text-3xl font-black text-emerald-600 tracking-[0.25em]">
                  CLI-{student?.id?.toString().slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-center opacity-40">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Válido apenas hoje para a OS #{order?.tracking_code || order?.id?.slice(0,8)}</p>
                <div className="h-px w-20 bg-slate-200" />
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-slate-50 dark:bg-slate-900 border-t">
            <Button variant="ghost" className="w-full font-black text-slate-500 h-14 rounded-2xl tracking-[0.2em] hover:bg-slate-100" onClick={() => setIsClientIDOpen(false)}>
              FECHAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
