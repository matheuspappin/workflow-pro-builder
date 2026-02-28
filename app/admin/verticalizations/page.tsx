import Link from "next/link"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FireExtinguisher, ExternalLink, Settings, Users, TrendingUp, ArrowRight,
  Plus, Layers, Globe, Zap, Shield, Truck, Building2, Heart, Scissors,
  Dumbbell, ChefHat, Stethoscope, Hammer, Home, BookOpen, Wrench,
  Car, Leaf, Music, Camera, ShoppingCart, Briefcase, GraduationCap,
  Package, Star,
} from "lucide-react"
import { getVerticalizations, type VerticalRecord } from "@/lib/actions/verticalization"

// Mapa de ícones por nome
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FireExtinguisher, Shield, Stethoscope, Wrench, Hammer, Truck, Car,
  Scissors, Dumbbell, ChefHat, Leaf, Music, Camera, Home, BookOpen,
  GraduationCap, ShoppingCart, Briefcase, Package, Heart, Globe, Layers,
  Zap, Star, Users, Settings, Building2,
}

const statusConfig = {
  active: { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  beta: { label: 'Beta', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  coming_soon: { label: 'Em Breve', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

function VerticalCard({ v }: { v: VerticalRecord }) {
  const status = statusConfig[v.status as keyof typeof statusConfig] || statusConfig.coming_soon
  const IconComponent = ICON_MAP[v.icon_name] || Layers

  return (
    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-xl border flex items-center justify-center flex-shrink-0 ${v.icon_bg}`}>
            <IconComponent className={`w-7 h-7 ${v.icon_color}`} />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${status.className}`}>
            {status.label}
          </span>
        </div>
        <CardTitle className="text-xl font-black text-white tracking-tight">
          {v.name}
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm leading-relaxed line-clamp-3">
          {v.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Tags */}
        {v.tags && v.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {v.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-slate-800 text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-slate-800">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-lg font-black text-white">{v.stats?.tenants ?? 0}</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Empresas</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <p className="text-lg font-black text-white">{v.stats?.users ?? 0}</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Usuários</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg font-black text-white">
              {v.stats?.mrr && v.stats.mrr > 0 ? `R$${v.stats.mrr}` : '--'}
            </p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">MRR</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={v.admin_url || `/admin/verticalizations/${v.slug}`} className="flex-1">
            <Button
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              size="sm"
            >
              <Settings className="w-3.5 h-3.5" />
              Gerenciar
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          {v.landing_url && (
            <Link href={v.landing_url} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                title="Abrir landing page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function VerticalizationsPage() {
  const verticalizations = await getVerticalizations()
  const activeCount = verticalizations.filter(v => v.status === 'active').length

  return (
    <div className="flex flex-col min-h-screen pb-10 bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title="Central de Verticalizações" />

      <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">

        {/* Header Explicativo */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-violet-950/30 p-8 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Layers className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white tracking-tight mb-1">
              AKAAI CORE — O Coração do Ecossistema
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
              O <strong className="text-indigo-300">AKAAI CORE</strong> é o coração do ecossistema — a engine central não comercializada diretamente.
              Cada verticalização (Fire Protection, DanceFlow, AgroFlow AI...) é uma solução white-label independente construída sobre esta base.
              Gerencie todas as soluções, tenants e módulos a partir deste painel de controle.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-center">
              <p className="text-3xl font-black text-white">{activeCount}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ativas</p>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">{verticalizations.length}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total</p>
            </div>
          </div>
        </div>

        {/* Grid de Verticalizações */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Soluções Disponíveis
            </h3>
            <Link href="/admin/verticalizations/new">
              <Button
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                Nova Verticalização
              </Button>
            </Link>
          </div>

          {verticalizations.length === 0 ? (
            /* Estado vazio — antes de rodar a migration */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <Card className="bg-slate-900/20 border-slate-800/50 border-dashed opacity-50">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] gap-4 text-center">
                  <div className="w-14 h-14 rounded-xl border border-dashed border-slate-700 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold text-sm">Nova Verticalização</p>
                    <p className="text-slate-700 text-xs mt-1">Em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {verticalizations.map(v => (
                <VerticalCard key={v.id} v={v} />
              ))}

              {/* Card placeholder "Nova Verticalização" */}
              <Link href="/admin/verticalizations/new" className="group">
                <Card className="bg-slate-900/20 border-slate-800/50 border-dashed hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300 h-full min-h-[280px]">
                  <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] gap-4 text-center">
                    <div className="w-14 h-14 rounded-xl border border-dashed border-slate-700 group-hover:border-indigo-500/50 flex items-center justify-center transition-all">
                      <Plus className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div>
                      <p className="text-slate-500 group-hover:text-slate-300 font-bold text-sm transition-colors">
                        Nova Verticalização
                      </p>
                      <p className="text-slate-700 group-hover:text-slate-500 text-xs mt-1 transition-colors">
                        Clique para criar uma nova solução white-label
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}
        </div>

        {/* Arquitetura Info */}
        <Card className="bg-slate-900/30 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2 text-base">
              <Layers className="w-5 h-5 text-indigo-400" />
              Como funciona a arquitetura White-Label
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "AKAAI CORE (Coração)",
                  desc: "O coração do ecossistema — não comercializado. Contém toda a lógica de multi-tenancy, módulos, IA, financeiro e autenticação.",
                  color: "text-indigo-400",
                  bg: "bg-indigo-500/10",
                },
                {
                  step: "02",
                  title: "Verticalização (Produto)",
                  desc: "Cada solução (Fire Protection, DanceFlow, AgroFlow AI) herda o AKAAI CORE e adiciona vocabulário, branding e módulos do nicho. É o que o cliente compra.",
                  color: "text-violet-400",
                  bg: "bg-violet-500/10",
                },
                {
                  step: "03",
                  title: "Tenant (Empresa do Cliente)",
                  desc: "Cada empresa cadastrada recebe um ambiente isolado com seu studioId único. O acesso é configurado pelo time AKAAI CORE.",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-sm font-black ${item.color}`}>{item.step}</span>
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${item.color}`}>{item.title}</p>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
