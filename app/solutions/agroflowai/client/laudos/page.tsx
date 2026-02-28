"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, MapPin, User, Search, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft:    { label: "Rascunho",   color: "text-slate-400",   bg: "bg-slate-400/10",   icon: Clock },
  review:   { label: "Em Revisão", color: "text-amber-400",   bg: "bg-amber-400/10",   icon: AlertTriangle },
  approved: { label: "Aprovado",   color: "text-blue-400",    bg: "bg-blue-400/10",    icon: CheckCircle2 },
  issued:   { label: "Emitido",    color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
}

export default function ClientLaudosPage() {
  const [laudos, setLaudos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    try {
      const studioId = JSON.parse(localStorage.getItem("workflow_user") || "{}").studioId || ""
      if (!studioId) { setLoading(false); return }
      fetch(`/api/agroflowai/laudos?studioId=${studioId}`)
        .then(r => r.json())
        .then(data => setLaudos(Array.isArray(data) ? data : []))
        .catch(() => setLaudos([]))
        .finally(() => setLoading(false))
    } catch { setLoading(false) }
  }, [])

  const filtered = laudos.filter(l =>
    l.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.client?.toLowerCase().includes(search.toLowerCase()) ||
    l.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Meus Laudos</h1>
        <p className="text-slate-400 mt-1">Laudos técnicos e relatórios ambientais da sua propriedade</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Buscar laudos..."
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
            <FileText className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold text-lg">
              {search ? "Nenhum laudo encontrado" : "Você não possui laudos ainda"}
            </p>
            <p className="text-slate-600 text-sm mt-1">Os laudos técnicos da sua propriedade aparecerão aqui</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(laudo => {
            const st = statusConfig[laudo.status] || statusConfig.draft
            const StatusIcon = st.icon
            return (
              <Card key={laudo.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-500 font-mono">{laudo.code}</span>
                        <Badge className={cn("text-[10px] font-bold border-0", st.color, st.bg)}>
                          <StatusIcon className="w-2.5 h-2.5 mr-1" />
                          {st.label}
                        </Badge>
                      </div>
                      <p className="font-bold text-white mb-1 text-sm">{laudo.title}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {laudo.property && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{laudo.property}</span>}
                        {laudo.engineer && <span className="flex items-center gap-1"><User className="w-3 h-3" />{laudo.engineer}</span>}
                        {laudo.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{laudo.date}</span>}
                        {laudo.art && <span className="text-emerald-400 font-bold">ART: {laudo.art}</span>}
                      </div>
                    </div>
                    {laudo.status === "issued" && (
                      <Button size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-400/10 rounded-xl flex-shrink-0" title="Baixar laudo">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
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
