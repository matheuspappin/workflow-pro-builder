"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  getServiceOrderById,
  updateMilestoneStatus,
} from "@/lib/actions/service-orders"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  Calendar,
  MapPin,
  User as UserIcon,
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
  Phone,
  ArrowRight,
  Info,
  QrCode as QrCodeIcon,
  CheckCircle,
  Circle
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { supabase } from "@/lib/supabase"

export default function TechnicianServiceOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { vocabulary } = useVocabulary()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const id = params.id as string

  useEffect(() => {
    async function loadTechnicianData() {
        const userStr = localStorage.getItem("danceflow_user")
        if (!userStr) {
            router.push("/login")
            return
        }
        const user = JSON.parse(userStr)
        
        const { data: professional } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (professional) {
            setProfessionalId(professional.id)
        } else {
            toast.error("Perfil de técnico não encontrado.")
            router.push("/login")
        }
    }
    loadTechnicianData()
  }, [router, toast])

  useEffect(() => {
    async function loadOrder() {
      if (!professionalId) return; // Espera o professionalId ser carregado

      try {
        setLoading(true)
        const data = await getServiceOrderById(id)

        // Validar se a OS pertence a este técnico
        if (!data || (data as { professional_id?: string })?.professional_id !== professionalId) {
          toast.error("Ordem de Serviço não encontrada ou você não tem acesso.")
          router.push("/technician/os-list")
          return
        }
        setOrder(data)
      } catch (error) {
        console.error("Erro ao carregar OS:", error)
        toast.error("Erro ao carregar detalhes da Ordem de Serviço")
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [id, professionalId, router])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Aberto</Badge>
      case 'in_progress': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Em Andamento</Badge>
      case 'finished': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Concluído</Badge>
      case 'cancelled': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Cancelado</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleToggleMilestoneStatus = async (milestone: any) => {
    if (!order?.studio_id || !professionalId) return;
    const nextStatus = milestone.status === 'completed' ? 'pending' : 'completed';
    try {
        await updateMilestoneStatus(milestone.id, nextStatus, order.studio_id, professionalId);
        toast.success(`Marco ${nextStatus === 'completed' ? 'concluído' : 'reaberto'} com sucesso!`);
        // Recarregar a ordem para atualizar os marcos
        const updatedOrder = await getServiceOrderById(id);
        setOrder(updatedOrder);
    } catch (error: any) {
        toast.error(error.message || "Erro ao atualizar status do marco.");
    }
  };

  if (loading || !order) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ordem de Serviço</h2>
          <p className="text-sm text-muted-foreground">#{order.tracking_code} • {order.customer?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <UserIcon className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cliente / Condomínio</p>
                      <p className="text-sm font-bold">{order.customer?.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {order.customer?.phone || "Não informado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-rose-500 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Localização</p>
                      <p className="text-sm font-bold">{order.customer?.address || "Não informado"}</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer?.address || "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        Abrir no Google Maps <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data de Abertura</p>
                      <p className="text-sm font-bold">
                        {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Descrição / Escopo</p>
                      <p className="text-sm font-medium">{order.description || "Nenhuma descrição fornecida."}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {order.observations && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                  <p className="text-[10px] font-black text-amber-800 dark:text-amber-200 uppercase tracking-widest mb-1">Observações Internas</p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">{order.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Milestones Section */}
          <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Etapas da Ordem de Serviço
                </CardTitle>
                <CardDescription>Marque as etapas como concluídas durante a execução.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {order.milestones?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma etapa definida para esta OS.
                    </p>
                )}
                {order.milestones?.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => handleToggleMilestoneStatus(m)}
                            >
                                {m.status === 'completed' ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground" />
                                )}
                            </Button>
                            <span className={m.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                {m.title}
                            </span>
                            {m.assigned_professional_id && (
                              <Badge variant="secondary" className="text-[9px] px-1 h-4 uppercase font-black tracking-tighter">
                                 Responsável: {m.professional?.name || 'Você'}
                              </Badge>
                            )}
                        </div>
                        {m.completed_at && (
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(m.completed_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                ))}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Scanner Action */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <QrCodeIcon className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-bold">Scanner de Equipamentos</h3>
                <p className="text-xs text-indigo-200 mt-1 mb-4">Use para coletar, inspecionar ou entregar extintores.</p>
                <Link href={`/technician/scanner?osId=${order.id}`}>
                    <Button 
                        variant="outline" 
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold"
                    >
                        Abrir Scanner
                    </Button>
                </Link>
            </CardContent>
          </Card>
          
          {/* Documents Section - Simplified View for Technician */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Documentos Anexados
                </CardTitle>
                <CardDescription>Visualização de laudos, fotos e outros arquivos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {order.documents?.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
                    </div>
                ) : (
                    order.documents?.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-rose-500" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold truncate">{doc.title}</p>
                                    <Badge variant="outline" className="text-[9px] px-1 h-4 uppercase font-black tracking-tighter">
                                        {doc.category}
                                    </Badge>
                                </div>
                            </div>
                            <a href={doc.file_url} target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="sm" className="h-8 text-xs font-bold">
                                    Visualizar
                                </Button>
                            </a>
                        </div>
                    ))
                )}
            </CardContent>
          </Card>

          <Button 
            variant="default" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2"
            disabled={order.status === 'finished'}
            onClick={() => { /* Lógica para finalizar OS */ toast.success("OS Finalizada!") }}
          >
            {order.status === 'finished' ? 'OS Concluída' : 'Finalizar Ordem de Serviço'}
          </Button>

        </div>
      </div>
    </main>
  )
}
