"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2, AlertCircle, XCircle, Loader2, RefreshCw,
  FireExtinguisher, Music, Leaf, Layers, ExternalLink,
  Shield, Users, Building2, Zap, Database, Globe,
  Activity, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface VerticalizationStatus {
  id: string
  name: string
  slug: string
  status: 'active' | 'beta' | 'coming_soon'
  niche: string
  icon_name: string
  icon_color: string
  icon_bg: string
  landing_url: string
  admin_url: string
  tags: string[]
  stats: {
    tenants: number
    users: number
    mrr: number
  }
  modules: Record<string, boolean>
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FireExtinguisher, Music, Leaf, Layers, Shield, Users, Building2, Globe,
}

const VERTICAL_STATUS_CONFIG = {
  active:       { label: 'Ativo',   className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  beta:         { label: 'Beta',    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       icon: AlertCircle },
  coming_soon:  { label: 'Em Breve', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',     icon: XCircle },
}

const ECOSYSTEM_ROUTES = [
  {
    label: 'FireControl',
    description: 'Segurança contra incêndio',
    icon: FireExtinguisher,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    routes: [
      { name: 'Landing', path: '/solutions/fire-protection', public: true },
      { name: 'Login', path: '/solutions/fire-protection/login', public: true },
      { name: 'Dashboard', path: '/solutions/fire-protection/dashboard', public: false },
      { name: 'Técnico', path: '/solutions/fire-protection/technician', public: false },
      { name: 'Cliente', path: '/solutions/fire-protection/client', public: false },
    ],
  },
  {
    label: 'DanceFlow',
    description: 'Estúdios de dança',
    icon: Music,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    routes: [
      { name: 'Landing', path: '/solutions/estudio-de-danca', public: true },
      { name: 'Login', path: '/solutions/estudio-de-danca/login', public: true },
      { name: 'Dashboard', path: '/solutions/estudio-de-danca/dashboard', public: false },
      { name: 'Professor', path: '/solutions/estudio-de-danca/teacher', public: false },
      { name: 'Aluno', path: '/solutions/estudio-de-danca/student', public: false },
    ],
  },
  {
    label: 'AgroFlowAI',
    description: 'Compliance ambiental',
    icon: Leaf,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    routes: [
      { name: 'Landing', path: '/solutions/agroflowai', public: true },
      { name: 'Login', path: '/solutions/agroflowai/login', public: true },
      { name: 'Dashboard', path: '/solutions/agroflowai/dashboard', public: false },
      { name: 'Cliente', path: '/solutions/agroflowai/client', public: false },
    ],
  },
]

export default function EcosystemStatusPage() {
  const [verticalizations, setVerticalizations] = useState<VerticalizationStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/verticalizations')
      .then(r => r.json())
      .then(data => {
        setVerticalizations(Array.isArray(data) ? data : [])
      })
      .catch(() => setVerticalizations([]))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const activeCount = verticalizations.filter(v => v.status === 'active').length
  const totalModulesEnabled = verticalizations.reduce((acc, v) => {
    return acc + Object.values(v.modules || {}).filter(Boolean).length
  }, 0)

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 pb-10">
      <AdminHeader title="Status do Ecossistema" />

      <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">

        {/* Header Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20 p-8 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Activity className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white mb-1">AKAAI CORE — Status do Ecossistema</h2>
            <p className="text-slate-400 text-sm">
              O AKAAI CORE é o <strong className="text-indigo-300">coração do ecossistema</strong> — não é comercializado diretamente.
              Cada verticalização abaixo é um produto independente construído sobre esta engine.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="border-slate-700 text-slate-400 hover:text-white gap-2 flex-shrink-0"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Zap, label: 'Verticalizações Ativas', value: loading ? '...' : String(activeCount), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Building2, label: 'Total Tenants', value: loading ? '...' : String(verticalizations.reduce((a, v) => a + (v.stats?.tenants || 0), 0)), color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Database, label: 'Módulos Ativos', value: loading ? '...' : String(totalModulesEnabled), color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { icon: Layers, label: 'Verticalizações Total', value: loading ? '...' : String(verticalizations.length), color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-5 pb-4">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', kpi.bg)}>
                  <kpi.icon className={cn('w-4 h-4', kpi.color)} />
                </div>
                <p className="text-2xl font-black text-white">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Verticalizações */}
        <div>
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Soluções Verticalizadas
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {verticalizations.map(v => {
                const statusCfg = VERTICAL_STATUS_CONFIG[v.status as keyof typeof VERTICAL_STATUS_CONFIG] || VERTICAL_STATUS_CONFIG.coming_soon
                const StatusIcon = statusCfg.icon
                const IconComp = ICON_MAP[v.icon_name] || Layers
                const activeModulesCount = Object.values(v.modules || {}).filter(Boolean).length

                return (
                  <Card key={v.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn('w-11 h-11 rounded-xl border flex items-center justify-center', v.icon_bg)}>
                          <IconComp className={cn('w-5 h-5', v.icon_color ?? 'text-slate-400')} />
                        </div>
                        <span className={cn('flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border', statusCfg.className)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </div>

                      <h4 className="font-black text-white text-lg mb-1">{v.name}</h4>
                      <p className="text-slate-500 text-xs mb-4">Nicho: <span className="text-slate-400">{v.niche}</span></p>

                      <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-slate-800 mb-4">
                        <div className="text-center">
                          <p className="text-lg font-black text-white">{v.stats?.tenants ?? 0}</p>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Empresas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-white">{activeModulesCount}</p>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Módulos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-white">{v.stats?.users ?? 0}</p>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Usuários</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={v.admin_url || `/admin/verticalizations/${v.slug}`} className="flex-1">
                          <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            Gerenciar
                          </Button>
                        </Link>
                        {v.landing_url && (
                          <Link href={v.landing_url} target="_blank">
                            <Button size="sm" variant="outline" className="border-slate-700 text-slate-400 hover:text-white">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Mapa de Rotas por Verticalização */}
        <div>
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Mapa de Rotas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ECOSYSTEM_ROUTES.map(eco => {
              const IconComp = eco.icon
              return (
                <Card key={eco.label} className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', eco.bg)}>
                        <IconComp className={cn('w-4 h-4', eco.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-white text-sm">{eco.label}</CardTitle>
                        <CardDescription className="text-slate-600 text-xs">{eco.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {eco.routes.map(route => (
                      <Link
                        key={route.path}
                        href={route.path}
                        target="_blank"
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded',
                            route.public
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-amber-500/10 text-amber-500'
                          )}>
                            {route.public ? 'Público' : 'Auth'}
                          </span>
                          <span className="text-slate-400 text-xs font-medium group-hover:text-white transition-colors">{route.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-600 text-[10px] font-mono hidden md:block">{route.path}</span>
                          <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Links */}
        <Card className="bg-slate-900/30 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-indigo-400" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {[
              { label: 'Central de Verticalizações', href: '/admin/verticalizations' },
              { label: 'Tenants Ativos', href: '/admin/studios' },
              { label: 'Usuários do Sistema', href: '/admin/users' },
              { label: 'Logs do Sistema', href: '/admin/logs' },
            ].map(link => (
              <Link key={link.href} href={link.href}>
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 gap-2">
                  <ArrowRight className="w-3.5 h-3.5" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
