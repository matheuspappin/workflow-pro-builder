"use client"

import { useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, RefreshCw, Satellite, ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface NDVIPoint {
  date: string
  ndvi: number
}

interface NDVIChartProps {
  propertyId: string
  propertyName: string
  studioId: string
  initialHistory?: NDVIPoint[]
  initialNdviMean?: number | null
  initialImageB64?: string | null
  initialAlertLevel?: 'critical' | 'warning' | 'ok' | null
  initialAlertMessage?: string | null
  initialCollection?: string | null
}

const NDVI_THRESHOLDS = [
  { value: 0.3, label: "Crítico", color: "#ef4444", strokeDash: "4 4" },
  { value: 0.5, label: "Atenção", color: "#f59e0b", strokeDash: "4 4" },
  { value: 0.7, label: "Saudável", color: "#10b981", strokeDash: "4 4" },
]

function ndviColor(v: number | null | undefined) {
  if (v === null || v === undefined) return "#94a3b8"
  if (v < 0.3) return "#ef4444"
  if (v < 0.5) return "#f59e0b"
  if (v < 0.7) return "#84cc16"
  return "#10b981"
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  } catch {
    return dateStr
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{formatDate(label)}</p>
      <p className="font-black text-lg" style={{ color: ndviColor(v) }}>
        NDVI {v?.toFixed(3)}
      </p>
      {v < 0.3 && <p className="text-xs text-red-400 mt-1">⚠ Risco crítico</p>}
      {v >= 0.3 && v < 0.5 && <p className="text-xs text-amber-400 mt-1">⚠ Atenção</p>}
      {v >= 0.5 && v < 0.7 && <p className="text-xs text-lime-400 mt-1">↗ Vegetação moderada</p>}
      {v >= 0.7 && <p className="text-xs text-emerald-400 mt-1">✓ Saudável</p>}
    </div>
  )
}

export default function NDVIChart({
  propertyId,
  propertyName,
  studioId,
  initialHistory = [],
  initialNdviMean = null,
  initialImageB64 = null,
  initialAlertLevel = null,
  initialAlertMessage = null,
  initialCollection = null,
}: NDVIChartProps) {
  const [history, setHistory] = useState<NDVIPoint[]>(initialHistory)
  const [ndviMean, setNdviMean] = useState<number | null>(initialNdviMean)
  const [imageB64, setImageB64] = useState<string | null>(initialImageB64)
  const [alertLevel, setAlertLevel] = useState<'critical' | 'warning' | 'ok' | null>(initialAlertLevel)
  const [alertMessage, setAlertMessage] = useState<string | null>(initialAlertMessage)
  const [collection, setCollection] = useState<string | null>(initialCollection)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chartData = history.map(p => ({
    date: p.date,
    ndvi: p.ndvi,
    label: formatDate(p.date),
  }))

  const handleProcess = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/agroflowai/satellite-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, studioId, daysBack: 90 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro no processamento")

      setHistory(data.ndvi_history || [])
      setNdviMean(data.ndvi_mean ?? null)
      setImageB64(data.image_b64 ?? null)
      setAlertLevel(data.alert_level ?? null)
      setAlertMessage(data.alert_message ?? null)
      setCollection(data.collection ?? null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const color = ndviColor(ndviMean)

  return (
    <div className="space-y-4">
      {/* Alerta crítico */}
      {alertLevel === "critical" && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-red-400 text-sm">RISCO DE DESMATAMENTO OU ESTRESSE CRÍTICO</p>
            <p className="text-xs text-red-300/70 mt-0.5">{alertMessage}</p>
          </div>
        </div>
      )}
      {alertLevel === "warning" && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-amber-400 text-sm">NDVI BAIXO — ATENÇÃO</p>
            <p className="text-xs text-amber-300/70 mt-0.5">{alertMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico NDVI */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  Evolução NDVI
                  {collection && (
                    <Badge className="text-[10px] font-bold border-0 text-blue-400 bg-blue-400/10">
                      {collection}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Índice de Vegetação — últimas cenas disponíveis
                </CardDescription>
              </div>
              {ndviMean !== null && (
                <div className="text-right">
                  <p className="text-xs text-slate-500">Média atual</p>
                  <p className="text-2xl font-black" style={{ color }}>
                    {ndviMean.toFixed(3)}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3">
                <Satellite className="w-8 h-8 text-slate-600" />
                <p className="text-slate-500 text-sm">Sem histórico de NDVI processado</p>
                <Button
                  onClick={handleProcess}
                  disabled={loading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Satellite className="w-4 h-4 mr-2" />}
                  {loading ? "Processando..." : "Processar via Satélite"}
                </Button>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id={`ndviGrad-${propertyId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickCount={5}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {NDVI_THRESHOLDS.map(t => (
                      <ReferenceLine
                        key={t.value}
                        y={t.value}
                        stroke={t.color}
                        strokeDasharray={t.strokeDash}
                        strokeOpacity={0.5}
                        label={{ value: t.label, fill: t.color, fontSize: 9, position: "insideTopRight" }}
                      />
                    ))}
                    <Area
                      type="monotone"
                      dataKey="ndvi"
                      stroke={color}
                      strokeWidth={2}
                      fill={`url(#ndviGrad-${propertyId})`}
                      dot={{ fill: color, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleProcess}
                    disabled={loading}
                    size="sm"
                    variant="ghost"
                    className="text-slate-500 hover:text-white text-xs"
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    {loading ? "Processando..." : "Atualizar"}
                  </Button>
                </div>
              </>
            )}
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Imagem de satélite */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Imagem RGB Recortada</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Composição Vermelho-Verde-Azul da área da propriedade
            </CardDescription>
          </CardHeader>
          <CardContent>
            {imageB64 ? (
              <div className="relative">
                <img
                  src={`data:image/png;base64,${imageB64}`}
                  alt={`Imagem satélite — ${propertyName}`}
                  className="w-full h-48 object-cover rounded-xl border border-slate-700"
                />
                <div className="absolute bottom-2 right-2">
                  <Badge className="text-[10px] font-bold border-0 text-slate-300 bg-slate-900/80">
                    {collection || "BDC"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-700 rounded-xl">
                <ImageOff className="w-8 h-8 text-slate-600" />
                <p className="text-slate-500 text-sm text-center">
                  {loading ? "Gerando imagem..." : "Nenhuma imagem processada"}
                </p>
                {loading && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
