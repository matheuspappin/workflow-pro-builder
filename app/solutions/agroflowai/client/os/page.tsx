"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Calendar, MapPin, User, Search, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:     { label: "Pendente",      color: "text-amber-400",   bg: "bg-amber-400/10",   icon: Clock },
  in_progress: { label: "Em Andamento",  color: "text-blue-400",    bg: "bg-blue-400/10",    icon: AlertTriangle },
  completed:   { label: "Concluída",     color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  cancelled:   { label: "Cancelada",     color: "text-red-400",     bg: "bg-red-400/10",     icon: AlertTriangle },
}

const typeLabels: Record<string, string> = {
  laudo_car: "Laudo CAR",
  vistoria_ndvi: "Vistoria NDVI",
  regularizacao: "Regularização",
  licenciamento: "Licenciamento",
  monitoramento: "Monitoramento",
  outro: "Outro",
}

export default function ClientOsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    try {
      const studioId = JSON.parse(localStorage.getItem("workflow_user") || "{}").studioId || ""
      if (!studioId) { setLoading(false); return }
      fetch(`/api/agroflowai/os?studioId=${studioId}`)
        .then(r => r.json())
        .then(data => setOrders(Array.isArray(data) ? data : []))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false))
    } catch { setLoading(false) }
  }, [])

  const filtered = orders.filter(os =>
    os.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    os.code?.toLowerCase().includes(search.toLowerCase()) ||
    (os.property_name || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Ordens de Serviço</h1>
        <p className="text-slate-400 mt-1">Serviços ambientais agendados para sua propriedade</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Buscar OS..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">
              {search ? "Nenhuma OS encontrada" : "Nenhuma OS cadastrada ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(os => {
            const st = statusConfig[os.status] || statusConfig.pending
            const StatusIcon = st.icon
            return (
              <Card key={os.id} className={cn("bg-slate-900/50 border-l-4 border-slate-800 hover:border-slate-700 transition-colors")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-500 font-mono">{os.code}</span>
                        <Badge className={cn("text-[10px] font-bold border-0", st.color, st.bg)}>
                          <StatusIcon className="w-2.5 h-2.5 mr-1" />
                          {st.label}
                        </Badge>
                        {os.type && (
                          <Badge className="text-[10px] font-bold border-0 text-teal-400 bg-teal-400/10">
                            {typeLabels[os.type] || os.type}
                          </Badge>
                        )}
                      </div>
                      <p className="font-bold text-white truncate text-sm">{os.client_name}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                        {os.property_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{os.property_name}</span>}
                        {os.scheduled_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{os.scheduled_date}</span>}
                        {os.assigned_to && <span className="flex items-center gap-1"><User className="w-3 h-3" />{os.assigned_to}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
