"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { getEngineerProjects, getEngineerStats } from "@/lib/actions/engineer"
import {
  Loader2,
  HardHat,
  Calendar,
  ChevronRight,
  Flame,
  Building2,
  Clock,
  AlertTriangle,
  FolderKanban,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function FireEngineerDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState({ pending: 0, active: 0, finished: 0, total: 0 })

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        try {
          const [projectsResult, statsResult] = await Promise.all([
            getEngineerProjects(user.id),
            getEngineerStats(user.id),
          ])
          if (projectsResult.success) setProjects(projectsResult.data.slice(0, 5))
          if (statsResult.success && statsResult.data) setStats(statsResult.data)
        } catch (e) {
          console.error("Erro ao carregar projetos", e)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  const statCards = [
    { label: "Aguardando Aceite", value: stats.pending, color: "text-amber-500", icon: Clock },
    { label: "Em Andamento", value: stats.active, color: "text-red-600", icon: HardHat },
    { label: "Concluídos", value: stats.finished, color: "text-emerald-500", icon: null },
    { label: "Total de Projetos", value: stats.total, color: "text-slate-700 dark:text-slate-300", icon: null },
  ]

  const statusLabels: Record<string, string> = {
    pending_acceptance: "Aguardando Aceite",
    open: "Aberto",
    in_progress: "Em Andamento",
    waiting_parts: "Aguardando",
    finished: "Concluído",
    cancelled: "Cancelado",
  }
  const statusColors: Record<string, string> = {
    pending_acceptance: "bg-amber-100 text-amber-700",
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-red-100 text-red-700",
    waiting_parts: "bg-orange-100 text-orange-700",
    finished: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-700",
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bem-vindo, {user?.user_metadata?.name || "Engenheiro"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Portal de Engenharia — Projetos PPCI & Vistorias
          </p>
        </div>
        <Link href="/solutions/fire-protection/engineer/projetos">
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20">
            <FolderKanban className="w-4 h-4 mr-2" />
            Gerenciar Projetos
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-md bg-white dark:bg-slate-900/50">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-4xl font-black", stat.color)}>{stat.value}</div>
              {stats.pending > 0 && stat.label === "Aguardando Aceite" && (
                <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Ação necessária
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Projetos Recentes</h2>
          <Link href="/solutions/fire-protection/engineer/projetos" className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline">
            Ver todos
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50 dark:bg-slate-900/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <HardHat className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum projeto encontrado</h3>
              <p className="text-slate-500 max-w-md mt-2">Você ainda não tem projetos atribuídos. Aguarde novas atribuições.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {projects.map((project: any) => {
              const isPPCI = project.project_type === "ppci"
              const isPending = project.status === "pending_acceptance" || project.status === "open"
              return (
                <Link
                  href={isPending ? "/solutions/fire-protection/engineer/projetos" : `/solutions/fire-protection/engineer/projetos/${project.id}`}
                  key={project.id}
                >
                  <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-red-600">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", isPPCI ? "bg-red-50" : "bg-orange-50")}>
                          {isPPCI ? <Flame className="w-5 h-5 text-red-600" /> : <HardHat className="w-5 h-5 text-orange-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                              {project.title || `Projeto #${project.id.slice(0, 8)}`}
                            </h4>
                            {isPPCI && <Badge className="bg-red-100 text-red-700 text-[10px]">PPCI</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {project.studio?.name && (
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> {project.studio.name}
                              </p>
                            )}
                            {project.opened_at && (
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(project.opened_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={cn("px-2 py-0.5 rounded-full text-xs font-bold", statusColors[project.status] || "bg-gray-100 text-gray-700")}>
                          {statusLabels[project.status] || project.status}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
