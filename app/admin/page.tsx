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

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

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
    <div className="flex flex-col min-h-screen pb-10 bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title="Cockpit Estratégico" />
      
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><Building2 className="w-5 h-5 text-indigo-500"/></div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">+Ativo</span>
            </div>
            <h3 className="text-3xl font-black">{stats?.overview.totalTenants}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Empresas</p>
          </GlassCard>

          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-500"/></div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">+0%</span>
            </div>
            <h3 className="text-3xl font-black">R$ {stats?.overview.mrr.toFixed(2)}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Receita Recorrente (MRR)</p>
          </GlassCard>

          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Activity className="w-5 h-5 text-amber-500"/></div>
              <span className="text-xs font-bold text-slate-500 bg-slate-500/10 px-2 py-1 rounded">Estável</span>
            </div>
            <h3 className="text-3xl font-black">99.9%</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Uptime do Sistema</p>
          </GlassCard>

          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-violet-500/10 rounded-lg"><Zap className="w-5 h-5 text-violet-500"/></div>
              <span className="text-xs font-bold text-violet-500 bg-violet-500/10 px-2 py-1 rounded">High</span>
            </div>
            <h3 className="text-3xl font-black">{stats?.moduleData?.length || 0}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Módulos Ativos</p>
          </GlassCard>

          <GlassCard>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-5 h-5 text-blue-500"/></div>
              <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">Parceiros</span>
            </div>
            <h3 className="text-3xl font-black">{stats?.overview.totalPartners || 0}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Afiliados</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Nichos */}
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-500" />
                Distribuição de Nichos
              </CardTitle>
              <CardDescription>Segmentação da base de clientes por tipo de negócio</CardDescription>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={<CustomTooltip chartType="pie" />}
                  />
                  <Legend 
                    iconSize={10} 
                    wrapperStyle={{fontSize: "12px"}} 
                    verticalAlign="bottom" 
                    align="center" 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Adoção de Módulos */}
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Adoção de Funcionalidades
              </CardTitle>
              <CardDescription>Quais módulos estão sendo mais utilizados?</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.moduleData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats?.moduleData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-950 rounded-full shadow-sm">
                  <Server className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Sistema Operacional</h4>
                  <p className="text-sm text-muted-foreground">Todos os serviços rodando conforme esperado.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white dark:bg-slate-950 rounded-full text-xs font-bold text-emerald-600 border border-emerald-200">Database: OK</span>
                <span className="px-3 py-1 bg-white dark:bg-slate-950 rounded-full text-xs font-bold text-emerald-600 border border-emerald-200">Storage: OK</span>
                <span className="px-3 py-1 bg-white dark:bg-slate-950 rounded-full text-xs font-bold text-emerald-600 border border-emerald-200">Auth: OK</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
