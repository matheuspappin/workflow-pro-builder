"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Calendar,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ExternalLink,
  Download,
  RefreshCw,
  Building2,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Ordem {
  id: string
  tracking_code?: string
  title: string
  status: string
  project_type: string
  vistoria_type?: string
  observations?: string
  laudo_url?: string
  conformidade_score?: number
  created_at: string
  finished_at?: string
  scheduled_at?: string
  professional?: { name: string }
  documents?: Array<{
    id: string
    title?: string
    file_url: string
    file_type?: string
    file_name?: string
    description?: string
    signed_at?: string
    created_at: string
  }>
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open:         { label: "Em Aberto",     color: "bg-amber-100 text-amber-700",   icon: Clock },
  in_progress:  { label: "Em Andamento",  color: "bg-blue-100 text-blue-700",     icon: Wrench },
  finished:     { label: "Concluída",     color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  nao_conforme: { label: "Não Conforme",  color: "bg-rose-100 text-rose-700",     icon: XCircle },
  cancelled:    { label: "Cancelada",     color: "bg-slate-100 text-slate-600",   icon: XCircle },
}

function formatDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function ConformidadeBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return null
  const color = score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", color)}>
      {score}% conformidade
    </span>
  )
}

function OrdemCard({ ordem }: { ordem: Ordem }) {
  const st = statusConfig[ordem.status] ?? statusConfig.open
  const StatusIcon = st.icon
  const isVistoria = ordem.project_type === "vistoria"
  const docs = ordem.documents || []

  return (
    <Card className={cn(
      "border-l-4 bg-white dark:bg-slate-900/50 shadow-sm",
      isVistoria ? "border-l-red-500" : "border-l-blue-500"
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {ordem.tracking_code && (
                <span className="text-xs font-mono font-bold text-slate-400">#{ordem.tracking_code}</span>
              )}
              <Badge className={cn("text-xs border-0 font-bold", st.color)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {st.label}
              </Badge>
              {isVistoria && (
                <Badge className="text-xs border-0 bg-red-100 text-red-700 font-bold">Vistoria</Badge>
              )}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{ordem.title}</h3>
          </div>
          <ConformidadeBadge score={ordem.conformidade_score} />
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {isVistoria ? `Agendada: ${formatDate(ordem.scheduled_at)}` : `Criada: ${formatDate(ordem.created_at)}`}
          </div>
          {ordem.finished_at && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Concluída: {formatDate(ordem.finished_at)}
            </div>
          )}
          {ordem.professional && (
            <div className="flex items-center gap-1 col-span-2">
              <Wrench className="w-3.5 h-3.5" />
              Técnico/Engenheiro: {ordem.professional.name}
            </div>
          )}
        </div>

        {/* Observações / Laudo */}
        {ordem.observations && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Laudo / Observações</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{ordem.observations}</p>
          </div>
        )}

        {/* Laudo URL */}
        {ordem.laudo_url && (
          <a href={ordem.laudo_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Baixar Laudo PDF
            </Button>
          </a>
        )}

        {/* Documentos anexos */}
        {docs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Documentos</p>
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {doc.title || doc.file_name || "Documento"}
                    </p>
                    {doc.description && (
                      <p className="text-xs text-slate-400 truncate">{doc.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {doc.signed_at && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-0">Assinado</Badge>
                  )}
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function FireClientDocumentosPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ vistorias: Ordem[]; os: Ordem[]; all: Ordem[] }>({
    vistorias: [],
    os: [],
    all: [],
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/client/documentos", { credentials: "include" })
      const json = await res.json()
      if (!json.error) setData(json)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const finalizadas = data.vistorias.filter(v => v.status === "finished" || v.status === "nao_conforme")
  const laudosDisp = data.all.filter(o => o.laudo_url || (o.documents && o.documents.length > 0))

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-red-600" />
            Documentos & Laudos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm">
            Laudos, PPCI, certificados e histórico das vistorias
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        </div>
      ) : (
        <Tabs defaultValue="vistorias">
          <TabsList className="w-full">
            <TabsTrigger value="vistorias" className="flex-1">
              Vistorias
              {data.vistorias.length > 0 && (
                <span className="ml-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {data.vistorias.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="os" className="flex-1">
              OS
              {data.os.length > 0 && (
                <span className="ml-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {data.os.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="laudos" className="flex-1">
              Laudos
              {laudosDisp.length > 0 && (
                <span className="ml-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {laudosDisp.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vistorias" className="space-y-3 mt-4">
            {data.vistorias.length === 0 ? (
              <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-slate-500">Nenhuma vistoria registrada</p>
                  <p className="text-sm text-slate-400 mt-1">As vistorias realizadas aparecerão aqui.</p>
                </CardContent>
              </Card>
            ) : (
              data.vistorias.map(v => <OrdemCard key={v.id} ordem={v} />)
            )}
          </TabsContent>

          <TabsContent value="os" className="space-y-3 mt-4">
            {data.os.length === 0 ? (
              <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-slate-500">Nenhuma OS registrada</p>
                  <p className="text-sm text-slate-400 mt-1">Ordens de serviço aparecerão aqui.</p>
                </CardContent>
              </Card>
            ) : (
              data.os.map(o => <OrdemCard key={o.id} ordem={o} />)
            )}
          </TabsContent>

          <TabsContent value="laudos" className="space-y-3 mt-4">
            {laudosDisp.length === 0 ? (
              <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-slate-500">Nenhum laudo disponível</p>
                  <p className="text-sm text-slate-400 mt-1">Os laudos das vistorias serão exibidos aqui.</p>
                </CardContent>
              </Card>
            ) : (
              laudosDisp.map(o => <OrdemCard key={o.id} ordem={o} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
