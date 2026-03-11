'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useVocabulary } from '@/hooks/use-vocabulary'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/components/providers/organization-provider'
import { supabase } from '@/lib/supabase'
import { Loader2, FileText, Calendar, Clock, ChevronRight, LayoutDashboard, User, Shield, QrCode as QrCodeIcon, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import QRCode from "react-qr-code"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function StudentOSPage() {
  const { vocabulary, t, language } = useVocabulary()
  const { businessModel, niche } = useOrganization()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [student, setStudent] = useState<any>(null)
  const [isClientIDOpen, setIsClientIDOpen] = useState(false)
  const [isPayingOnline, setIsPayingOnline] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadOrders() {
      // CORRIGIDO: getUser() valida JWT; getSession() não valida
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Construir objeto de student com studio_id dos metadados do usuário
      const userData = typeof window !== 'undefined'
        ? (() => { try { return JSON.parse(localStorage.getItem('danceflow_user') || '{}') } catch { return {} } })()
        : {}

      const studentData = {
        ...userData,
        id: authUser.id,
        email: authUser.email,
        studio_id: userData.studio_id || userData.studioId || authUser.user_metadata?.studio_id,
      }

      if (!mounted) return
      setStudent(studentData)

      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          professional:teachers(name),
          items:service_order_items(*)
        `)
        .eq('customer_id', authUser.id)
        .order('created_at', { ascending: false })

      if (!mounted) return
      if (error) {
        console.error('Erro ao buscar OS:', error)
      } else {
        setOrders(data || [])
      }
      setLoading(false)
    }

    loadOrders()
    return () => { mounted = false }
  }, [])

  const handlePayOS = async (order: any) => {
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
          studioId: student?.studio_id || student?.studioId,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="bg-white dark:bg-slate-900 border-b p-4 flex items-center gap-4">
        <Link href="/student">
          <Button variant="ghost" size="sm">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Minhas Ordens de Serviço</h1>
      </div>

      <main className="container p-4 space-y-4 max-w-md mx-auto">
        {businessModel === 'MONETARY' && (
          <Card className="bg-emerald-600 text-white border-none shadow-lg overflow-hidden relative group" onClick={() => setIsClientIDOpen(true)}>
            <CardContent className="p-5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
                  <QrCodeIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Chave Digital</p>
                  <p className="text-lg font-black tracking-tight">Liberar Atendimento</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </CardContent>
            {/* Efeito decorativo no background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm text-muted-foreground">Carregando suas ordens...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    OS #{order.tracking_code || order.id.substring(0, 8)}
                  </p>
                  <CardTitle className="text-sm font-bold">
                    {order.description || 'Sem descrição'}
                  </CardTitle>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={`${getStatusColor(order.status)} border-none text-[10px] uppercase px-2 py-0.5`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                  {order.payment_status === 'paid' ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[8px] uppercase font-bold px-1.5 py-0.5">PAGO ✅</Badge>
                  ) : (
                    <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[8px] uppercase font-bold px-1.5 py-0.5">PENDENTE ⚠️</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barra de Progresso Visual */}
                <div className="flex items-center gap-1.5 py-1">
                  <div className={`h-1.5 flex-1 rounded-full ${order.status === 'open' || order.status === 'in_progress' || order.status === 'finished' ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${order.status === 'in_progress' || order.status === 'finished' ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${order.status === 'finished' ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}
                  </div>
                </div>

                {order.professional && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {order.professional.name[0]}
                    </div>
                    <span>Responsável: <b>{order.professional.name}</b></span>
                  </div>
                )}

                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="text-xs font-bold">Total do Serviço</span>
                  <span className="text-sm font-black text-indigo-600">
                    R$ {Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
                
                {order.status === 'finished' && order.payment_status !== 'paid' ? (
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-lg animate-pulse"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePayOS(order);
                    }}
                    disabled={isPayingOnline}
                  >
                    {isPayingOnline ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    PAGAR E LIBERAR RETIRADA
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full text-[11px] h-9 border-slate-100 bg-slate-50 hover:bg-slate-100" asChild>
                    <Link href={`/student/os/${order.id}`}>Ver Detalhes Completos</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">Nenhuma OS encontrada</p>
              <p className="text-xs text-muted-foreground">Suas ordens de serviço aparecerão aqui.</p>
            </div>
          </div>
        )}
      </main>

      {/* Tab Bar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t flex items-center justify-around h-16 px-4 z-50">
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student'}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Início</span>
        </Button>
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-primary" onClick={() => window.location.href='/student/os'}>
          <FileText className="w-5 h-5" />
          <span className="text-[10px]">Minhas OS</span>
        </Button>
        <Button type="button" variant="ghost" className="flex flex-col gap-1 text-muted-foreground" onClick={() => window.location.href='/student/profile'}>
          <User className="w-5 h-5" />
          <span className="text-[10px]">Perfil</span>
        </Button>
      </nav>

      <Dialog open={isClientIDOpen} onOpenChange={setIsClientIDOpen}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-[2rem] border-none p-0 overflow-hidden shadow-2xl">
          <div className="bg-emerald-600 p-8 text-center text-white space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-2 backdrop-blur-md border border-white/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Cartão de Retirada</h2>
            <p className="text-emerald-100 text-xs font-bold opacity-90 tracking-wide">Apresente para liberar seu veículo, pet ou produto.</p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-10 gap-8 bg-white dark:bg-slate-950">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-emerald-50">
              <QRCode
                value={`SECURE-AUTH-CLI-${student?.id?.toString().slice(-12).toUpperCase()}-${new Date().toISOString().slice(0,10)}`}
                size={220}
                level="H"
                viewBox={`0 0 256 256`}
              />
            </div>

            <div className="space-y-4 w-full px-10 text-center">
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 w-full">
                <p className="text-[10px] text-muted-foreground font-black uppercase mb-1 tracking-widest">CÓDIGO DE AUTORIZAÇÃO DIÁRIO</p>
                <p className="font-mono text-2xl font-black text-emerald-600 tracking-[0.2em]">
                  CLI-{student?.id?.toString().slice(-8).toUpperCase()}
                </p>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Expira automaticamente em 24 horas</p>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t">
            <Button type="button" variant="ghost" className="w-full font-black text-slate-500 h-12 rounded-xl tracking-widest" onClick={() => setIsClientIDOpen(false)}>
              FECHAR CARTÃO
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
