"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Calendar as CalendarIcon,
  QrCode as QrCodeIcon,
  ArrowRight,
  ClipboardCheck,
  FileText,
  Loader2,
  MapPin,
  CheckCircle2,
  Clock
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

import { useVocabulary } from "@/hooks/use-vocabulary"

export default function TechnicianDashboard() {
  const { vocabulary, niche } = useVocabulary()
  const [technicianData, setTechnicianData] = useState<any>(null)
  const [stats, setStats] = useState({
    totalServiceOrders: 0,
    openServiceOrders: 0,
    inProgressServiceOrders: 0,
  })
  const [myServiceOrders, setMyServiceOrders] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const userStr = localStorage.getItem("danceflow_user")
        if (!userStr) return
        const user = JSON.parse(userStr)

        const { data: professional } = await supabase
          .from('professionals')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        setTechnicianData(professional || user)

        if (professional?.id) {
          const { data: orders, error } = await supabase
            .from('service_orders')
            .select(`
                    *,
                    customer:students(name, address, phone)
                `)
            .eq('professional_id', professional.id)
            .in('status', ['open', 'in_progress'])
            .order('scheduled_at', { ascending: true })

          if (error) throw error

          setMyServiceOrders(orders || [])
          setStats({
            totalServiceOrders: orders?.length || 0,
            openServiceOrders: orders?.filter(os => os.status === 'open').length || 0,
            inProgressServiceOrders: orders?.filter(os => os.status === 'in_progress').length || 0,
          })
        }

      } catch (error) {
        console.error('Erro ao carregar dados do técnico:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return null

  if (!technicianData?.studio_id) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 mb-6">
          <QrCodeIcon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Bem-vindo, Técnico de Campo!</h1>
        <p className="text-slate-500 max-w-xs mb-8 text-sm">
          Sua conta foi criada com sucesso, mas você ainda não está vinculado a nenhuma empresa. <br/><br/>
          Aguarde o <b>link de convite</b> da sua empresa para começar a gerenciar suas ordens de serviço!
        </p>
        <Button 
          variant="outline" 
          className="w-full max-w-[200px]"
          onClick={() => {
            localStorage.removeItem("danceflow_user")
            supabase.auth.signOut().then(() => window.location.href = "/login")
          }}
        >
          Sair da Conta
        </Button>
      </div>
    )
  }

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Olá, {technicianData?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-sm text-muted-foreground">Portal do Técnico de Campo • Painel Geral</p>
        </div>
        <Badge variant="outline" className="w-fit bg-white dark:bg-slate-900 border-indigo-100 py-1.5 px-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
          Sessão Ativa
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link href="/technician/scanner">
          <Card className="bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 h-full">
              <CardContent className="p-6 flex items-center justify-between">
                  <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                          <QrCodeIcon className="w-6 h-6" />
                          Scanner Técnico
                      </h3>
                      <p className="text-xs text-indigo-200 mt-1">Inspeção, Coleta e Entrega</p>
                  </div>
                  <ArrowRight className="w-6 h-6" />
              </CardContent>
          </Card>
        </Link>
        <Link href="/technician/os-list">
          <Card className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm border-none h-full">
              <CardContent className="p-6 flex items-center justify-between">
                  <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                          <FileText className="w-6 h-6 text-indigo-600" />
                          Minhas Ordens de Serviço
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Gerenciar vistorias e serviços</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300" />
              </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats - Horizontal Scroll */}
      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
        <Card className="min-w-[160px] flex-1 border-none shadow-sm snap-start">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-3">
              <ClipboardCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold">{stats.totalServiceOrders}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total OSs</p>
          </CardContent>
        </Card>

        <Card className="min-w-[160px] flex-1 border-none shadow-sm snap-start">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-3">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{stats.openServiceOrders}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">OSs Abertas</p>
          </CardContent>
        </Card>

        <Card className="min-w-[160px] flex-1 border-none shadow-sm snap-start">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold">{stats.inProgressServiceOrders}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Em Andamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Orders List */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Minhas Ordens de Serviço (Ativas)</h3>
        <div className="space-y-3">
            {myServiceOrders.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent">
                  <CardContent className="p-8 text-center">
                    <p className="text-xs text-muted-foreground italic">Nenhuma ordem de serviço ativa.</p>
                  </CardContent>
                </Card>
            ) : (
                myServiceOrders.map(os => (
                    <Card key={os.id} className="border-l-4 border-l-indigo-500 shadow-sm overflow-hidden">
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-sm">{os.customer?.name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{os.description}</p>
                                </div>
                                <Badge className={os.status === 'open' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-none' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-none'}>
                                    {os.status === 'open' ? 'Aberta' : 'Em Andamento'}
                                </Badge>
                            </div>
                            
                            {os.customer?.address && (
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span className="truncate flex-1">{os.customer.address}</span>
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(os.customer.address)}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-indigo-600 dark:text-indigo-400 font-bold underline hover:text-indigo-800 ml-2"
                                    >
                                        GPS
                                    </a>
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                                <Link href={`/technician/os-details/${os.id}`} className="w-full">
                                    <Button size="sm" variant="outline" className="w-full h-8 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <ClipboardCheck className="w-3 h-3 mr-2" />
                                        Ver Detalhes / Iniciar
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
      </div>

    </main>
  )
}
