"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GlassCard } from "@/components/admin/ui/glass-card"
import { 
  Building2, 
  DollarSign, 
  Activity,
  TrendingUp,
  Server,
  Zap,
  LayoutGrid,
  Users,
  ShieldAlert,
  BarChart3
} from "lucide-react"
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts'
import { getGlobalSystemStats } from "@/lib/actions/super-admin"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { AdminDashboardSkeleton } from "@/components/admin/admin-dashboard-skeleton"
import { CustomTooltip, renderCustomizedLabel } from "@/components/admin/custom-recharts"

const CHART_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#a855f7', '#14b8a6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const data = await getGlobalSystemStats(session?.access_token)
        setStats(data)
      } catch (error) {
        console.error(error)
        toast.error("Falha ao carregar métricas estratégicas")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <AdminDashboardSkeleton />

  return (
    <div className="flex flex-col min-h-screen pb-10 bg-black">
      <AdminHeader title="Cockpit Estratégico" />
      
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        
        {/* KPI Cards — cores semânticas: ícone identifica tipo, badge indica status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-slate-500/20 rounded-lg"><Building2 className="w-5 h-5 text-slate-300"/></div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">+Ativo</span>
            </div>
            <h3 className="text-3xl font-black text-white">{stats?.overview.totalTenants}</h3>
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Total Empresas</p>
          </GlassCard>

          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-400"/></div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">+0%</span>
            </div>
            <h3 className="text-3xl font-black text-white">R$ {stats?.overview.mrr.toFixed(2)}</h3>
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Receita Recorrente (MRR)</p>
          </GlassCard>

          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-amber-500/20 rounded-lg"><Activity className="w-5 h-5 text-amber-400"/></div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">Operacional</span>
            </div>
            <h3 className="text-3xl font-black text-white">{stats?.systemHealth?.uptime || '99.9'}%</h3>
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Uptime do Sistema</p>
          </GlassCard>

          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-violet-500/20 rounded-lg"><Zap className="w-5 h-5 text-violet-400"/></div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">High</span>
            </div>
            <h3 className="text-3xl font-black text-white">{stats?.moduleData?.length || 0}</h3>
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Módulos Ativos</p>
          </GlassCard>

          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-cyan-500/20 rounded-lg"><Users className="w-5 h-5 text-cyan-400"/></div>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">Parceiros</span>
            </div>
            <h3 className="text-3xl font-black text-white">{stats?.overview.totalPartners || 0}</h3>
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Total Afiliados</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Nichos — cores na legenda diferenciam categorias */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <LayoutGrid className="w-5 h-5 text-violet-400" />
                Distribuição de Nichos
              </CardTitle>
              <CardDescription className="text-white/50">Segmentação da base de clientes por tipo de negócio</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.nicheData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    innerRadius={80}
                    outerRadius={120}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.nicheData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={<CustomTooltip chartType="pie" />}
                  />
                  <Legend 
                    iconSize={10} 
                    wrapperStyle={{fontSize: "12px", color: "rgba(255,255,255,0.8)"}} 
                    verticalAlign="bottom" 
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Adoção de Módulos — cores nas barras indicam módulo */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Adoção de Funcionalidades
              </CardTitle>
              <CardDescription className="text-white/50">Quais módulos estão sendo mais utilizados?</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.moduleData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: 'rgba(255,255,255,0.8)'}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats?.moduleData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* System Health — verde = operacional, vermelho seria usado para alertas */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-l-4 border-l-emerald-500 bg-white/5 border-white/10">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-full">
                  <Server className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white">
                    {stats?.systemHealth?.status === 'operational' ? 'Sistema Operacional' : 'Sistema com Problemas'}
                  </h4>
                  <p className="text-sm text-white/50">
                    {stats?.systemHealth?.message || 'Todos os serviços rodando conforme esperado.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  stats?.systemHealth?.database === 'ok' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  Database: {stats?.systemHealth?.database || 'OK'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  stats?.systemHealth?.storage === 'ok' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  Storage: {stats?.systemHealth?.storage || 'OK'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  stats?.systemHealth?.auth === 'ok' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  Auth: {stats?.systemHealth?.auth || 'OK'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
