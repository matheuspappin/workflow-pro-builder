"use client"

import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Satellite, AlertTriangle, MapPin, Calendar,
  TrendingDown, TrendingUp, Eye, RefreshCw, Layers, BarChart3,
  TreePine, Leaf, Zap, Globe, Wifi, WifiOff, Loader2, Map,
} from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const MapaSatelite = dynamic(() => import("@/components/agroflowai/MapaSatelite"), { ssr: false })
const NDVIChart = dynamic(() => import("@/components/agroflowai/NDVIChart"), { ssr: false })

interface SateliteAlert {
  id: string
  property: string
  type: 'deforestation' | 'fire' | 'ndvi_low' | 'car_issue'
  severity: 'critical' | 'warning' | 'info'
  description: string
  area_ha?: number
  date: string
  source: string
  lat?: number
  lon?: number
}

interface NDVIProperty {
  property_id: string
  property_name: string
  ndvi_current: number | null
  ndvi_previous: number | null
  ndvi_change_pct: number | null
  ndvi_history: Array<{ date: string; value: number }>
  area_ha: number
  city: string
  state: string
  last_update: string
  source: 'bdc_sentinel2' | 'bdc_modis' | 'sentinel_hub' | 'unavailable'
  lat: number | null
  lon: number | null
  car_status?: string
  alerts?: number
}

interface SateliteResponse {
  alerts: SateliteAlert[]
  cached: boolean
  sources: {
    firms: boolean
    deter: boolean
    car: boolean
    firmsKeyConfigured: boolean
  }
  total: number
}

interface NDVIResponse {
  properties: NDVIProperty[]
  bdc_available: boolean
  sentinel_hub_available: boolean
  total: number
}

const MOCK_ALERTS: SateliteAlert[] = [
  { id: "m1", property: "Fazenda Boa Esperança", type: "deforestation", severity: "critical", description: "Alerta PRODES: Supressão vegetal detectada em 12,4 ha", area_ha: 12.4, date: "24/02/2026", source: "INPE PRODES (demo)" },
  { id: "m2", property: "Sítio São João", type: "ndvi_low", severity: "warning", description: "NDVI abaixo do esperado para a época (-18% vs histórico)", date: "23/02/2026", source: "Sentinel-2 (demo)" },
  { id: "m3", property: "Agropecuária Bela Vista", type: "fire", severity: "critical", description: "Focos de calor detectados pelo INPE - 3 ocorrências", date: "22/02/2026", source: "INPE DETER (demo)" },
  { id: "m4", property: "Fazenda Paraíso", type: "car_issue", severity: "info", description: "CAR vence em 30 dias - renovação necessária", date: "25/02/2026", source: "SICAR (demo)" },
]

const MOCK_NDVI: NDVIProperty[] = [
  { property_id: "1", property_name: "Fazenda Boa Esperança", ndvi_current: 0.62, ndvi_previous: 0.71, ndvi_change_pct: -12.7, ndvi_history: [], area_ha: 320, city: "Ribeirão Preto", state: "SP", last_update: "24/02/2026", source: "unavailable", lat: null, lon: null },
  { property_id: "2", property_name: "Agropecuária Bela Vista", ndvi_current: 0.74, ndvi_previous: 0.69, ndvi_change_pct: 7.2, ndvi_history: [], area_ha: 180, city: "Uberaba", state: "MG", last_update: "23/02/2026", source: "unavailable", lat: null, lon: null },
  { property_id: "3", property_name: "Sítio São João", ndvi_current: 0.55, ndvi_previous: 0.67, ndvi_change_pct: -17.9, ndvi_history: [], area_ha: 45, city: "Piracicaba", state: "SP", last_update: "22/02/2026", source: "unavailable", lat: null, lon: null },
  { property_id: "4", property_name: "Fazenda Paraíso", ndvi_current: 0.79, ndvi_previous: 0.77, ndvi_change_pct: 2.6, ndvi_history: [], area_ha: 210, city: "Bauru", state: "SP", last_update: "21/02/2026", source: "unavailable", lat: null, lon: null },
]

const alertConfig = {
  critical: { color: "text-red-400", bg: "bg-red-400/10", border: "border-l-red-400", label: "Crítico" },
  warning: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-l-amber-400", label: "Atenção" },
  info: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-l-blue-400", label: "Info" },
}

const alertTypeIcon = {
  deforestation: TrendingDown,
  fire: Zap,
  ndvi_low: TreePine,
  car_issue: AlertTriangle,
}

const alertTypeLabel = {
  deforestation: "Desmatamento",
  fire: "Foco de Incêndio",
  ndvi_low: "NDVI Baixo",
  car_issue: "CAR",
}

export default function SatelitePage() {
  const [activeTab, setActiveTab] = useState<"mapa" | "alerts" | "properties" | "ndvi" | "tools">("mapa")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [alerts, setAlerts] = useState<SateliteAlert[]>(MOCK_ALERTS)
  const [ndviData, setNdviData] = useState<NDVIProperty[]>(MOCK_NDVI)
  const [sources, setSources] = useState<SateliteResponse['sources'] | null>(null)
  const [bdcAvailable, setBdcAvailable] = useState(false)
  const [sentinelAvailable, setSentinelAvailable] = useState(false)
  const [isRealData, setIsRealData] = useState(false)
  const [studioId, setStudioId] = useState<string | null>(null)

  const loadData = useCallback(async (sid: string, forceRefresh = false) => {
    try {
      const [satRes, ndviRes] = await Promise.allSettled([
        fetch(`/api/agroflowai/satelite?studioId=${sid}${forceRefresh ? '&refresh=1' : ''}`),
        fetch(`/api/agroflowai/ndvi?studioId=${sid}`),
      ])

      if (satRes.status === 'fulfilled' && satRes.value.ok) {
        const satData: SateliteResponse = await satRes.value.json()
        if (satData.alerts && satData.alerts.length > 0) {
          setAlerts(satData.alerts)
          setIsRealData(true)
        }
        setSources(satData.sources)
      }

      if (ndviRes.status === 'fulfilled' && ndviRes.value.ok) {
        const ndData: NDVIResponse = await ndviRes.value.json()
        if (ndData.properties && ndData.properties.length > 0) {
          setNdviData(ndData.properties)
          setBdcAvailable(ndData.bdc_available)
          setSentinelAvailable(ndData.sentinel_hub_available)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("workflow_user")
      if (!stored) { setLoading(false); return }
      const parsed = JSON.parse(stored)
      const sid = parsed.studioId || parsed.studio_id
      if (!sid) { setLoading(false); return }
      setStudioId(sid)
      loadData(sid).finally(() => setLoading(false))
    } catch {
      setLoading(false)
    }
  }, [loadData])

  const handleRefresh = async () => {
    if (!studioId) return
    setRefreshing(true)
    await loadData(studioId, true)
    setRefreshing(false)
  }

  const criticalCount = alerts.filter(a => a.severity === "critical").length
  const warningCount = alerts.filter(a => a.severity === "warning").length
  const totalAreaHa = ndviData.reduce((s, p) => s + (p.area_ha || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Satellite className="w-8 h-8 text-blue-400" />
            Monitor Satelital
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            MapBiomas, INPE DETER/PRODES, NDVI e alertas em tempo real
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : isRealData ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                <Wifi className="w-3 h-3" /> Dados reais ativos
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <WifiOff className="w-3 h-3" /> Modo demonstração
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || !studioId}
          variant="outline"
          className="border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold rounded-xl"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
          {refreshing ? "Atualizando..." : "Atualizar Dados"}
        </Button>
      </div>

      {/* Status das fontes */}
      {sources && (
        <Card className="bg-slate-900/30 border-slate-800/50">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Status das Integrações</p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "INPE DETER", active: sources.deter, hint: undefined },
                { label: "SICAR / CAR", active: sources.car, hint: undefined },
                { label: "NASA FIRMS", active: sources.firms, hint: !sources.firmsKeyConfigured ? "Adicione NASA_FIRMS_API_KEY no .env.local" : undefined },
                { label: "BDC Sentinel-2", active: bdcAvailable, hint: bdcAvailable ? undefined : "Gratuito — cadastre coordenadas nas propriedades" },
                { label: "Sentinel Hub", active: sentinelAvailable, hint: sentinelAvailable ? undefined : "Opcional — configure SENTINEL_HUB_CLIENT_ID" },
              ].map(s => (
                <div
                  key={s.label}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold",
                    s.active ? "bg-emerald-400/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                  )}
                  title={s.hint}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", s.active ? "bg-emerald-400 animate-pulse" : "bg-slate-600")} />
                  {s.label}
                  {s.hint && <span className="text-[10px] opacity-50 font-normal ml-1">↗</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: AlertTriangle, label: "Alertas Críticos", value: String(criticalCount), color: "text-red-400", bg: "bg-red-400/10" },
          { icon: AlertTriangle, label: "Alertas de Atenção", value: String(warningCount), color: "text-amber-400", bg: "bg-amber-400/10" },
          { icon: TreePine, label: "Propriedades Monit.", value: String(ndviData.length), color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { icon: Globe, label: "Área Total (ha)", value: totalAreaHa.toLocaleString("pt-BR"), color: "text-teal-400", bg: "bg-teal-400/10" },
        ].map(s => (
          <Card key={s.label} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Sources */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-900/50 border border-blue-500/20">
        <CardContent className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Fontes de Dados Integradas</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "INPE DETER", desc: "Alertas em tempo real", color: "text-red-400", bg: "bg-red-400/10" },
              { label: "INPE PRODES", desc: "Desmatamento anual", color: "text-orange-400", bg: "bg-orange-400/10" },
              { label: "MapBiomas", desc: "Mapeamento de uso do solo", color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { label: "Sentinel-2", desc: "Imagens multiespectrais", color: "text-blue-400", bg: "bg-blue-400/10" },
              { label: "SICAR", desc: "Cadastro Ambiental Rural", color: "text-violet-400", bg: "bg-violet-400/10" },
              { label: "NASA FIRMS", desc: "Focos de calor/incêndio", color: "text-amber-400", bg: "bg-amber-400/10" },
            ].map(src => (
              <div key={src.label} className={cn("px-4 py-2.5 rounded-xl border border-transparent", src.bg)}>
                <p className={cn("text-sm font-black", src.color)}>{src.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{src.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "mapa", label: "Mapa Interativo" },
          { key: "alerts", label: "Alertas Ativos", count: alerts.length },
          { key: "properties", label: "Propriedades", count: ndviData.length },
          { key: "ndvi", label: "NDVI Geral" },
          { key: "tools", label: "Ferramentas Externas" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === t.key
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
          >
            {t.label}
            {'count' in t && t.count !== undefined && (
              <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded-full", activeTab === t.key ? "bg-white/20" : "bg-slate-700 text-slate-400")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-800 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-slate-800 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mapa Tab */}
      {activeTab === "mapa" && (
        <MapaSatelite
          className="w-full"
          properties={ndviData
            .filter(p => p.lat !== null && p.lon !== null)
            .map(p => ({
              id: p.property_id,
              name: p.property_name,
              lat: p.lat!,
              lon: p.lon!,
              ndvi: p.ndvi_current ?? undefined,
              area_ha: p.area_ha,
              city: p.city,
              state: p.state,
            }))
          }
          hotspots={alerts
            .filter(a => a.type === "fire" && a.lat !== undefined)
            .map(a => ({
              id: a.id,
              lat: a.lat!,
              lon: a.lon!,
              description: a.description,
              source: a.source,
              date: a.date,
            }))
          }
        />
      )}

      {/* Alerts Tab */}
      {!loading && activeTab === "alerts" && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <Satellite className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">Nenhum alerta ativo no momento</p>
                <p className="text-slate-600 text-sm mt-1">As propriedades monitoradas estão sem ocorrências</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map(alert => {
              const ac = alertConfig[alert.severity]
              const AlertIcon = alertTypeIcon[alert.type]
              return (
                <Card key={alert.id} className={cn("bg-slate-900/50 border-l-4 border-slate-800", ac.border)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", ac.bg)}>
                        <AlertIcon className={cn("w-5 h-5", ac.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={cn("text-[10px] font-bold border-0", ac.color, ac.bg)}>{ac.label}</Badge>
                          <Badge className="text-[10px] font-bold border-0 text-slate-400 bg-slate-400/10">{alertTypeLabel[alert.type]}</Badge>
                          <span className="text-xs text-slate-500 ml-auto">{alert.date}</span>
                        </div>
                        <p className="font-bold text-white">{alert.property}</p>
                        <p className="text-sm text-slate-400 mt-1">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Fonte: {alert.source}</span>
                          {alert.area_ha && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.area_ha} ha afetados</span>}
                          {alert.lat && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.lat.toFixed(3)}, {alert.lon?.toFixed(3)}</span>}
                        </div>
                      </div>
                      {alert.lat && (
                        <a
                          href={`https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@${alert.lon},${alert.lat},10z`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="ghost" className="text-slate-500 hover:text-white flex-shrink-0" title="Ver no mapa NASA FIRMS">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Properties Tab */}
      {!loading && activeTab === "properties" && (
        <div className="space-y-3">
          {ndviData.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <Leaf className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">Nenhuma propriedade cadastrada</p>
                <p className="text-slate-600 text-sm mt-1">Cadastre propriedades para monitoramento via satélite</p>
              </CardContent>
            </Card>
          ) : (
            ndviData.map(prop => {
              const ndviDiff = (prop.ndvi_current ?? 0) - (prop.ndvi_previous ?? 0)
              const ndviPositive = ndviDiff >= 0

              return (
                <Card key={prop.property_id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <p className="font-bold text-white">{prop.property_name}</p>
                          {prop.source === 'bdc_sentinel2' && (
                            <Badge className="text-[10px] font-bold border-0 text-emerald-400 bg-emerald-400/10">BDC Sentinel-2</Badge>
                          )}
                          {prop.source === 'bdc_modis' && (
                            <Badge className="text-[10px] font-bold border-0 text-teal-400 bg-teal-400/10">BDC MODIS</Badge>
                          )}
                          {prop.source === 'sentinel_hub' && (
                            <Badge className="text-[10px] font-bold border-0 text-blue-400 bg-blue-400/10">Sentinel Hub</Badge>
                          )}
                          {prop.source === 'unavailable' && !prop.ndvi_current && (
                            <Badge className="text-[10px] font-bold border-0 text-slate-500 bg-slate-800">sem coordenadas</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          {prop.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{prop.city}, {prop.state}</span>}
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{prop.area_ha.toLocaleString("pt-BR")} ha</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Atualizado: {prop.last_update}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500 mb-1">NDVI Atual</p>
                        <p className={cn("text-2xl font-black",
                          (prop.ndvi_current ?? 0) >= 0.7 ? "text-emerald-400"
                            : (prop.ndvi_current ?? 0) >= 0.5 ? "text-amber-400"
                            : "text-red-400"
                        )}>
                          {prop.ndvi_current?.toFixed(2) ?? "—"}
                        </p>
                        {prop.ndvi_change_pct !== null && (
                          <div className={cn("flex items-center gap-1 text-xs font-bold justify-end", ndviPositive ? "text-emerald-400" : "text-red-400")}>
                            {ndviPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {ndviPositive ? "+" : ""}{prop.ndvi_change_pct}%
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* NDVI Tab */}
      {!loading && activeTab === "ndvi" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Análise NDVI por Propriedade
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">
                {bdcAvailable ? "Dados via Brazil Data Cube / INPE" : "Clique em 'Processar via Satélite' para obter dados reais"}
              </p>
            </div>
          </div>

          {ndviData.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">Nenhuma propriedade cadastrada</p>
              </CardContent>
            </Card>
          ) : (
            ndviData.map(prop => (
              <div key={prop.property_id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-black text-white">{prop.property_name}</h3>
                  {prop.city && <span className="text-xs text-slate-500">{prop.city}, {prop.state}</span>}
                </div>
                {studioId && (
                  <NDVIChart
                    propertyId={prop.property_id}
                    propertyName={prop.property_name}
                    studioId={studioId}
                    initialHistory={(prop.ndvi_history || []).map(h => ({ date: h.date, ndvi: h.value }))}
                    initialNdviMean={prop.ndvi_current}
                  />
                )}
              </div>
            ))
          )}

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Legenda NDVI</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { color: "bg-emerald-500", label: "≥ 0.70 — Vegetação densa/saudável" },
                  { color: "bg-amber-500", label: "0.50 – 0.69 — Vegetação moderada" },
                  { color: "bg-red-500", label: "< 0.30 — Risco crítico / desmatamento" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className={cn("w-3 h-3 rounded-full flex-shrink-0", l.color)} />
                    {l.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tools Tab */}
      {!loading && activeTab === "tools" && (
        <div className="space-y-4">
          {/* Setup guide */}
          {sources && (
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-5">
                <p className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Como ativar cada integração
                </p>
                <div className="space-y-3 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className={cn("font-bold flex-shrink-0", sources.deter ? "text-emerald-400" : "text-amber-400")}>
                      {sources.deter ? "✓" : "→"}
                    </span>
                    <span>
                      <strong className="text-white">INPE DETER</strong> — Gratuito, sem configuração. Alertas de desmatamento da Amazônia automáticos.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className={cn("font-bold flex-shrink-0", bdcAvailable ? "text-emerald-400" : "text-amber-400")}>
                      {bdcAvailable ? "✓" : "→"}
                    </span>
                    <span>
                      <strong className="text-white">Brazil Data Cube / NDVI (BDC-WTSS)</strong> — Gratuito, sem configuração. Basta cadastrar as{" "}
                      <strong className="text-white">coordenadas (lat, lon)</strong> nas propriedades para ativar NDVI real via Sentinel-2 do INPE.
                    </span>
                  </div>
                  {!sources.firmsKeyConfigured && (
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold flex-shrink-0">→</span>
                      <span>
                        <strong className="text-white">NASA FIRMS (focos de calor)</strong> — Obtenha uma MAP_KEY gratuita em{" "}
                        <a href="https://firms.modaps.eosdis.nasa.gov/api/area/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">firms.modaps.eosdis.nasa.gov</a>
                        {" "}e adicione <code className="bg-slate-800 px-1 rounded">NASA_FIRMS_API_KEY=chave</code> no .env.local
                      </span>
                    </div>
                  )}
                  {!sentinelAvailable && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-600 font-bold flex-shrink-0">→</span>
                      <span className="text-slate-600">
                        <strong className="text-slate-500">Sentinel Hub (opcional)</strong> — Para NDVI de maior resolução, crie conta em{" "}
                        <a href="https://www.sentinel-hub.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 underline">sentinel-hub.com</a>
                        {" "}e adicione <code className="bg-slate-900 px-1 rounded">SENTINEL_HUB_CLIENT_ID</code> e <code className="bg-slate-900 px-1 rounded">SENTINEL_HUB_CLIENT_SECRET</code>
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "INPE DETER", desc: "Alertas de desmatamento em tempo real na Amazônia", url: "http://www.obt.inpe.br/OBT/assuntos/programas/amazonia/deter", color: "text-red-400", bg: "bg-red-400/10", badge: "Desmatamento" },
              { title: "INPE PRODES", desc: "Monitoramento anual de desmatamento — dados históricos", url: "http://www.obt.inpe.br/OBT/assuntos/programas/amazonia/prodes", color: "text-orange-400", bg: "bg-orange-400/10", badge: "Histórico" },
              { title: "MapBiomas", desc: "Mapeamento anual de uso e cobertura do solo", url: "https://plataforma.brasil.mapbiomas.org", color: "text-emerald-400", bg: "bg-emerald-400/10", badge: "Uso do Solo" },
              { title: "SICAR / CAR", desc: "Consulta e cadastro do CAR — Sistema Nacional", url: "https://www.car.gov.br/publico/municipios/downloads", color: "text-violet-400", bg: "bg-violet-400/10", badge: "CAR" },
              { title: "NASA FIRMS", desc: "Focos de incêndio globais em tempo real", url: "https://firms.modaps.eosdis.nasa.gov/map", color: "text-amber-400", bg: "bg-amber-400/10", badge: "Incêndio" },
              { title: "Sentinel Hub", desc: "Imagens Sentinel-2 para análise de vegetação NDVI", url: "https://apps.sentinel-hub.com/eo-browser", color: "text-blue-400", bg: "bg-blue-400/10", badge: "Satélite" },
              { title: "TerraClass", desc: "Uso da terra no Cerrado e Amazônia (EMBRAPA/INPE)", url: "https://www.terraclass.gov.br", color: "text-teal-400", bg: "bg-teal-400/10", badge: "Bioma" },
              { title: "Google Earth Engine", desc: "Análise geoespacial e processamento de imagens de satélite", url: "https://earthengine.google.com", color: "text-indigo-400", bg: "bg-indigo-400/10", badge: "Geoespacial" },
            ].map(tool => (
              <Card key={tool.title} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", tool.bg)}>
                      <Globe className={cn("w-5 h-5", tool.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-white">{tool.title}</p>
                        <Badge className={cn("text-[10px] font-bold border-0", tool.color, tool.bg)}>{tool.badge}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{tool.desc}</p>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className={cn("w-full h-8 font-bold rounded-xl text-xs", tool.bg, "hover:opacity-80", tool.color, "border border-transparent")}>
                          Acessar plataforma →
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
