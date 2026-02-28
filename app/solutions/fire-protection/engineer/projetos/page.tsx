"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseClient } from "@/lib/supabase"
import {
  getEngineerProjects,
  acceptProject,
  rejectProject,
  type EngineerProject,
} from "@/lib/actions/engineer"
import {
  Loader2,
  HardHat,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Flame,
  ClipboardList,
  XCircle,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const BASE_PATH = "/solutions/fire-protection/engineer/projetos"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending_acceptance: { label: "Aguardando Aceite", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  open:              { label: "Aberto",             color: "bg-blue-100 text-blue-700 border-blue-200",   icon: ClipboardList },
  in_progress:       { label: "Em Andamento",       color: "bg-red-100 text-red-700 border-red-200",      icon: HardHat },
  waiting_parts:     { label: "Aguardando",         color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle },
  finished:          { label: "Concluído",          color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  cancelled:         { label: "Cancelado",          color: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle },
  draft:             { label: "Rascunho",           color: "bg-gray-100 text-gray-700 border-gray-200",   icon: ClipboardList },
}

function ProjectCard({
  project,
  onAccept,
  onReject,
}: {
  project: EngineerProject
  onAccept: (p: EngineerProject) => void
  onReject: (p: EngineerProject) => void
}) {
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.open
  const StatusIcon = statusCfg.icon
  const isPending = project.status === "pending_acceptance" || project.status === "open"
  const progress =
    project.milestones_count && project.milestones_count > 0
      ? Math.round(((project.completed_milestones_count || 0) / project.milestones_count) * 100)
      : null

  return (
    <Card className="hover:shadow-md transition-all border-l-4 border-l-red-600">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-red-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-slate-900 dark:text-white truncate">
                  {project.title || `Projeto #${project.id.slice(0, 8)}`}
                </h4>
                <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-bold uppercase">
                  PPCI
                </Badge>
                <Badge className={cn("text-[10px] font-bold border", statusCfg.color)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusCfg.label}
                </Badge>
              </div>

              {project.studio && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  {project.studio.name}
                </p>
              )}

              {project.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{project.description}</p>
              )}

              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {project.opened_at && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(project.opened_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
                {project.tracking_code && (
                  <span className="text-xs font-mono text-slate-400">#{project.tracking_code}</span>
                )}
                {progress !== null && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    {progress}% concluído ({project.completed_milestones_count}/{project.milestones_count} etapas)
                  </span>
                )}
              </div>

              {progress !== null && (
                <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full max-w-xs">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={(e) => { e.preventDefault(); onReject(project) }}
                >
                  <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                  Recusar
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={(e) => { e.preventDefault(); onAccept(project) }}
                >
                  <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                  Aceitar
                </Button>
              </>
            )}
            {!isPending && (
              <Link href={`${BASE_PATH}/${project.id}`}>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-600">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FireEngineerProjectsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<EngineerProject[]>([])
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("pending")

  const [acceptTarget, setAcceptTarget] = useState<EngineerProject | null>(null)
  const [rejectTarget, setRejectTarget] = useState<EngineerProject | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const supabase = getSupabaseClient()

  const loadProjects = useCallback(async (uid: string) => {
    setLoading(true)
    try {
      const result = await getEngineerProjects(uid, { search: search || undefined })
      if (result.success) {
        setProjects(result.data)
      }
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await loadProjects(user.id)
      } else {
        setLoading(false)
      }
    }
    init()
  }, [supabase, loadProjects])

  const handleAccept = async () => {
    if (!acceptTarget || !userId) return
    setActionLoading(true)
    try {
      const result = await acceptProject(acceptTarget.id, userId)
      if (result.success) {
        toast.success("Projeto aceito! As etapas PPCI foram criadas automaticamente.")
        setAcceptTarget(null)
        await loadProjects(userId)
      } else {
        toast.error(result.error || "Erro ao aceitar projeto.")
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !userId) return
    setActionLoading(true)
    try {
      const result = await rejectProject(rejectTarget.id, userId, rejectReason)
      if (result.success) {
        toast.success("Projeto recusado.")
        setRejectTarget(null)
        setRejectReason("")
        await loadProjects(userId)
      } else {
        toast.error(result.error || "Erro ao recusar projeto.")
      }
    } finally {
      setActionLoading(false)
    }
  }

  const pending = projects.filter(p => p.status === "pending_acceptance" || p.status === "open")
  const active  = projects.filter(p => p.status === "in_progress" || p.status === "waiting_parts")
  const done    = projects.filter(p => p.status === "finished" || p.status === "cancelled")

  const tabProjects: Record<string, EngineerProject[]> = { pending, active, done }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Projetos PPCI</h1>
          </div>
          <p className="text-slate-500 mt-1 ml-10">Gerencie seus projetos de proteção e combate a incêndio</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Aguardando Aceite", value: pending.length, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800" },
          { label: "Em Andamento",      value: active.length,  color: "text-red-600",   bg: "bg-red-50 dark:bg-red-900/10",     border: "border-red-200 dark:border-red-800" },
          { label: "Concluídos",        value: done.filter(p => p.status === "finished").length, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800" },
          { label: "Total",             value: projects.length, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" },
        ].map((stat) => (
          <Card key={stat.label} className={cn("border", stat.border, stat.bg)}>
            <CardContent className="p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className={cn("text-3xl font-black mt-1", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por título, código de rastreio..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && userId && loadProjects(userId)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Aguardando Aceite
            {pending.length > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] ml-1 h-4 min-w-[16px] px-1">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            Em Andamento
            {active.length > 0 && (
              <Badge className="bg-red-600 text-white text-[10px] ml-1 h-4 min-w-[16px] px-1">
                {active.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="done" className="gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : (
          ["pending", "active", "done"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {tabProjects[tab].length === 0 ? (
                <Card className="border-dashed border-2 bg-slate-50 dark:bg-slate-900/20">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
                      <Flame className="w-7 h-7 text-red-400" />
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">Nenhum projeto aqui</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      {tab === "pending"
                        ? "Nenhum projeto PPCI aguardando seu aceite no momento."
                        : tab === "active"
                        ? "Você não tem projetos PPCI em andamento."
                        : "Nenhum projeto PPCI concluído ou cancelado."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                tabProjects[tab].map((project) => (
                  <Link
                    key={project.id}
                    href={
                      project.status === "pending_acceptance" || project.status === "open"
                        ? "#"
                        : `${BASE_PATH}/${project.id}`
                    }
                    onClick={(e) => {
                      if (project.status === "pending_acceptance" || project.status === "open") {
                        e.preventDefault()
                      }
                    }}
                  >
                    <ProjectCard
                      project={project}
                      onAccept={setAcceptTarget}
                      onReject={setRejectTarget}
                    />
                  </Link>
                ))
              )}
            </TabsContent>
          ))
        )}
      </Tabs>

      {/* Dialog Aceitar */}
      <Dialog open={!!acceptTarget} onOpenChange={(open) => !open && setAcceptTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-emerald-600" />
              Aceitar Projeto PPCI
            </DialogTitle>
            <DialogDescription>
              Ao aceitar, você confirma a responsabilidade técnica por este projeto de proteção contra incêndio. As etapas PPCI serão criadas automaticamente.
            </DialogDescription>
          </DialogHeader>

          {acceptTarget && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 space-y-2 text-sm border border-red-100 dark:border-red-900/30">
              <p className="font-bold text-slate-900 dark:text-white">
                {acceptTarget.title || `Projeto #${acceptTarget.id.slice(0, 8)}`}
              </p>
              {acceptTarget.studio && (
                <p className="text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {acceptTarget.studio.name}
                </p>
              )}
              <Badge className="bg-red-100 text-red-700 text-xs">Projeto PPCI</Badge>
              {acceptTarget.description && (
                <p className="text-slate-500 text-xs">{acceptTarget.description}</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAcceptTarget(null)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ThumbsUp className="w-4 h-4 mr-2" />}
              Confirmar Aceite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Recusar */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              Recusar Projeto PPCI
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa. O projeto voltará à fila da empresa para ser reatribuído a outro engenheiro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {rejectTarget && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                {rejectTarget.title || `Projeto #${rejectTarget.id.slice(0, 8)}`}
                {rejectTarget.studio && (
                  <span className="text-slate-400"> — {rejectTarget.studio.name}</span>
                )}
              </div>
            )}
            <Textarea
              placeholder="Motivo da recusa (opcional, mas recomendado)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setRejectTarget(null); setRejectReason("") }}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ThumbsDown className="w-4 h-4 mr-2" />}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
