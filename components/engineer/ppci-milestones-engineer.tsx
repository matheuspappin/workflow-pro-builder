"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { updateEngineerMilestone } from "@/lib/actions/engineer"
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Milestone {
  id: string
  title: string
  description?: string | null
  status: "pending" | "completed" | "cancelled"
  completed_at?: string | null
  order_index: number
}

interface PPCIMilestonesEngineerProps {
  milestones: Milestone[]
  projectId: string
  userId: string
  isActive: boolean
}

const STATUS_ICON = {
  completed: CheckCircle2,
  pending: Circle,
  cancelled: AlertTriangle,
}

const STATUS_COLOR = {
  completed: "text-emerald-500",
  pending: "text-slate-400",
  cancelled: "text-red-400",
}

export function PPCIMilestonesEngineer({
  milestones,
  projectId,
  userId,
  isActive,
}: PPCIMilestonesEngineerProps) {
  const [items, setItems] = useState<Milestone[]>(milestones)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const completedCount = items.filter((m) => m.status === "completed").length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  async function toggleMilestone(milestone: Milestone) {
    if (!isActive) return
    const nextStatus = milestone.status === "completed" ? "pending" : "completed"
    setLoadingId(milestone.id)
    try {
      const result = await updateEngineerMilestone(milestone.id, projectId, userId, nextStatus)
      if (result.success) {
        setItems((prev) =>
          prev.map((m) =>
            m.id === milestone.id
              ? {
                  ...m,
                  status: nextStatus,
                  completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
                }
              : m
          )
        )
        toast.success(nextStatus === "completed" ? "Etapa concluída!" : "Etapa reaberta.")
      } else {
        toast.error(result.error || "Erro ao atualizar etapa.")
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Etapas do Projeto PPCI
          </CardTitle>
          <Badge
            className={cn(
              "text-xs font-bold",
              progressPercent === 100
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {completedCount}/{totalCount} etapas — {progressPercent}%
          </Badge>
        </div>

        {/* Barra de progresso */}
        <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progressPercent === 100 ? "bg-emerald-500" : "bg-blue-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {!isActive && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Aceite o projeto para interagir com as etapas.
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {items.map((milestone, idx) => {
          const Icon = STATUS_ICON[milestone.status]
          const isLoading = loadingId === milestone.id
          const isExpanded = expandedId === milestone.id

          return (
            <div
              key={milestone.id}
              className={cn(
                "rounded-xl border transition-all",
                milestone.status === "completed"
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              )}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Step Number / Check */}
                <button
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-all",
                    isActive && milestone.status !== "cancelled"
                      ? "cursor-pointer hover:scale-110"
                      : "cursor-default"
                  )}
                  onClick={() => isActive && toggleMilestone(milestone)}
                  disabled={isLoading || !isActive}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : (
                    <Icon className={cn("w-6 h-6", STATUS_COLOR[milestone.status])} />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 flex-shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold truncate",
                        milestone.status === "completed"
                          ? "line-through text-slate-400"
                          : "text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {milestone.title}
                    </span>
                  </div>
                  {milestone.completed_at && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Concluído em {format(new Date(milestone.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>

                {/* Expand Toggle (if has description) */}
                {milestone.description && (
                  <button
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Description (expandable) */}
              {isExpanded && milestone.description && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-2">
                    {milestone.description}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm">
            Nenhuma etapa definida para este projeto.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
