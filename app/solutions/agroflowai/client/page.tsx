"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Leaf, FileText, ClipboardList, MapPin, Bell, Calendar,
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Loader2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface OSItem {
  id: string
  code: string
  client_name: string
  type: string
  status: string
  scheduled_date: string | null
}

interface LaudoItem {
  id: string
  code: string
  title: string
  type: string
  status: string
  date: string
  art?: string
}

const statusLabelOS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "text-amber-400", icon: Clock },
  in_progress: { label: "Em Andamento", color: "text-blue-400", icon: AlertTriangle },
  completed: { label: "Concluída", color: "text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelada", color: "text-red-400", icon: AlertTriangle },
}

const statusLaudoLabel: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "text-slate-400" },
  review: { label: "Em Revisão", color: "text-amber-400" },
  approved: { label: "Aprovado", color: "text-blue-400" },
  issued: { label: "Emitido", color: "text-emerald-400" },
}

export default function ClientHomePage() {
  const [userName, setUserName] = useState("")
  const [studioId, setStudioId] = useState("")
  const [os, setOs] = useState<OSItem[]>([])
  const [laudos, setLaudos] = useState<LaudoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("workflow_user") || "{}")
      setUserName(user.name || user.email?.split("@")[0] || "Proprietário")
      setStudioId(user.studioId || "")
    } catch {}
  }, [])

  useEffect(() => {
    if (!studioId) { setLoading(false); return }

    Promise.all([
      fetch(`/api/agroflowai/os?studioId=${studioId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/agroflowai/laudos?studioId=${studioId}`).then(r => r.json()).catch(() => []),
    ]).then(([osData, laudosData]) => {
      setOs(Array.isArray(osData) ? osData.slice(0, 3) : [])
      setLaudos(Array.isArray(laudosData) ? laudosData.slice(0, 3) : [])
    }).finally(() => setLoading(false))
  }, [studioId])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"

  const quickCards = [
    { label: "Ordens de Serviço", icon: ClipboardList, href: "/solutions/agroflowai/client/os", color: "text-emerald-400", bg: "bg-emerald-400/10", count: os.length },
    { label: "Laudos Técnicos", icon: FileText, href: "/solutions/agroflowai/client/laudos", color: "text-violet-400", bg: "bg-violet-400/10", count: laudos.length },
    { label: "Propriedades", icon: MapPin, href: "/solutions/agroflowai/client/propriedades", color: "text-teal-400", bg: "bg-teal-400/10", count: null },
    { label: "Notificações", icon: Bell, href: "/solutions/agroflowai/client/notificacoes", color: "text-amber-400", bg: "bg-amber-400/10", count: null },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm font-medium">{greeting},</p>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">{userName} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Portal do Proprietário Rural — AgroFlowAI</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-7 h-7 text-emerald-400" />
        </div>
      </div>

      {/* Quick Access Cards */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Acesso Rápido</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickCards.map(card => {
            const Icon = card.icon
            return (
              <Link key={card.label} href={card.href}>
                <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-600 transition-all cursor-pointer group">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", card.bg)}>
                      <Icon className={cn("w-6 h-6", card.color)} />
                    </div>
                    <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors leading-tight">
                      {card.label}
                    </p>
                    {card.count !== null && (
                      <Badge className={cn("text-[10px] font-bold border-0", card.color, card.bg)}>
                        {card.count}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          {/* Recent OS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ordens de Serviço Recentes</p>
              <Link href="/solutions/agroflowai/client/os" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">
                Ver todas →
              </Link>
            </div>
            {os.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-8 text-center">
                  <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Nenhuma OS ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {os.map((item) => {
                  const st = statusLabelOS[item.status] || statusLabelOS.pending
                  const Icon = st.icon
                  return (
                    <Card key={item.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{item.client_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-500">{item.code}</span>
                            {item.scheduled_date && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Calendar className="w-3 h-3" />
                                {item.scheduled_date}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={cn("text-[10px] font-bold border-0 shrink-0", st.color, `${st.color.replace('text-', 'bg-')}/10`)}>
                          <Icon className="w-2.5 h-2.5 mr-1" />
                          {st.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Laudos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Laudos Técnicos Recentes</p>
              <Link href="/solutions/agroflowai/client/laudos" className="text-xs text-violet-400 hover:text-violet-300 font-semibold">
                Ver todos →
              </Link>
            </div>
            {laudos.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-8 text-center">
                  <FileText className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Nenhum laudo ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {laudos.map((laudo) => {
                  const st = statusLaudoLabel[laudo.status] || statusLaudoLabel.draft
                  return (
                    <Card key={laudo.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{laudo.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-500">{laudo.code}</span>
                            {laudo.art && <span className="text-xs text-emerald-400 font-semibold">{laudo.art}</span>}
                          </div>
                        </div>
                        <Badge className={cn("text-[10px] font-bold border-0 shrink-0", st.color, `${st.color.replace('text-', 'bg-')}/10`)}>
                          {st.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Compliance Status */}
          <Card className="bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border-emerald-500/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Status de Compliance Ambiental</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {laudos.filter(l => l.status === "issued").length > 0
                    ? `${laudos.filter(l => l.status === "issued").length} laudo(s) emitido(s) — propriedade regularizada`
                    : "Acompanhe o status de regularização da sua propriedade"}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
