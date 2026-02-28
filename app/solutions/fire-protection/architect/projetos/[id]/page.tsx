"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getSupabaseClient } from "@/lib/supabase"
import {
  getEngineerProjectDetails,
  updateEngineerProjectStatus,
  addEngineerComment,
} from "@/lib/actions/engineer"
import { PPCIMilestonesEngineer } from "@/components/engineer/ppci-milestones-engineer"
import {
  ArrowLeft,
  Loader2,
  Building2,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Send,
  FileText,
  ExternalLink,
  Info,
  Tag,
  ClipboardCheck,
  XCircle,
  ChevronRight,
  User,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const PROJECTS_PATH = "/solutions/fire-protection/architect/projetos"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending_acceptance: { label: "Aguardando Aceite", color: "bg-amber-100 text-amber-700", icon: Clock },
  open:              { label: "Aberto",             color: "bg-blue-100 text-blue-700",   icon: ClipboardCheck },
  in_progress:       { label: "Em Andamento",       color: "bg-violet-100 text-violet-700",     icon: Tag },
  waiting_parts:     { label: "Aguardando Materiais", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  finished:          { label: "Concluído",          color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled:         { label: "Cancelado",          color: "bg-slate-100 text-slate-600", icon: XCircle },
  draft:             { label: "Rascunho",           color: "bg-gray-100 text-gray-700",   icon: ClipboardCheck },
}

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  in_progress: [
    { label: "Aguardando Material/Aprovação", next: "waiting_parts", color: "bg-orange-100 text-orange-700 hover:bg-orange-200" },
    { label: "Marcar como Concluído", next: "finished", color: "bg-emerald-600 text-white hover:bg-emerald-700" },
  ],
  waiting_parts: [
    { label: "Retomar Andamento", next: "in_progress", color: "bg-violet-100 text-violet-700 hover:bg-violet-200" },
    { label: "Marcar como Concluído", next: "finished", color: "bg-emerald-600 text-white hover:bg-emerald-700" },
  ],
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</div>
      </div>
    </div>
  )
}

export default function FireArchitectProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [commentText, setCommentText] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)

  const supabase = getSupabaseClient()

  const loadProject = useCallback(async (uid: string) => {
    const result = await getEngineerProjectDetails(projectId, uid)
    if (result.success && result.data) {
      setProject(result.data)
    } else {
      toast.error(result.error || "Projeto não encontrado.")
      router.push(PROJECTS_PATH)
    }
  }, [projectId, router])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await loadProject(user.id)
      }
      setLoading(false)
    }
    init()
  }, [supabase, loadProject])

  async function handleStatusChange(newStatus: "in_progress" | "waiting_parts" | "finished") {
    if (!userId) return
    if (newStatus === "finished") {
      setConfirmFinish(true)
      return
    }
    setStatusLoading(true)
    try {
      const result = await updateEngineerProjectStatus(projectId, userId, newStatus)
      if (result.success) {
        toast.success("Status atualizado!")
        await loadProject(userId)
      } else {
        toast.error(result.error || "Erro ao atualizar status.")
      }
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleConfirmFinish() {
    if (!userId) return
    setStatusLoading(true)
    setConfirmFinish(false)
    try {
      const result = await updateEngineerProjectStatus(projectId, userId, "finished")
      if (result.success) {
        toast.success("Projeto PPCI marcado como concluído!")
        await loadProject(userId)
      } else {
        toast.error(result.error || "Erro ao finalizar projeto.")
      }
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleSendComment() {
    if (!userId || !commentText.trim()) return
    setCommentLoading(true)
    try {
      const result = await addEngineerComment(projectId, userId, commentText)
      if (result.success) {
        setCommentText("")
        await loadProject(userId)
        toast.success("Comentário enviado.")
      } else {
        toast.error(result.error || "Erro ao enviar comentário.")
      }
    } finally {
      setCommentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!project) return null

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.open
  const StatusIcon = statusCfg.icon
  const isActive = project.status === "in_progress" || project.status === "waiting_parts"
  const transitions = STATUS_TRANSITIONS[project.status] || []
  const milestones = project.milestones || []
  const documents = project.documents || []
  const comments = project.comments || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(PROJECTS_PATH)} className="flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="text-sm text-slate-400 flex items-center gap-1">
          <Link href={PROJECTS_PATH} className="hover:text-violet-600 transition-colors">Meus Projetos</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
            {project.title || `Projeto #${project.id.slice(0, 8)}`}
          </span>
        </div>
      </div>

      <Card className="border-l-4 border-l-violet-600">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                <Flame className="w-7 h-7 text-violet-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    {project.title || `Projeto #${project.id.slice(0, 8)}`}
                  </h1>
                  <Badge className="bg-violet-100 text-violet-700 font-bold">PPCI</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={cn("font-semibold", statusCfg.color)}>
                    <StatusIcon className="w-3.5 h-3.5 mr-1" />
                    {statusCfg.label}
                  </Badge>
                  {project.tracking_code && (
                    <span className="text-xs font-mono text-slate-400">#{project.tracking_code}</span>
                  )}
                </div>
              </div>
            </div>

            {isActive && transitions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {transitions.map((t) => (
                  <Button
                    key={t.next}
                    size="sm"
                    disabled={statusLoading}
                    className={cn("font-semibold", t.color)}
                    onClick={() => handleStatusChange(t.next as any)}
                  >
                    {statusLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                    {t.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {milestones.length > 0 && (
            <PPCIMilestonesEngineer
              milestones={milestones}
              projectId={projectId}
              userId={userId || ""}
              isActive={isActive}
            />
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-600" />
                Comunicação do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    Nenhum comentário ainda. Inicie a comunicação com a empresa.
                  </p>
                ) : (
                  comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                        <p className="text-sm text-slate-800 dark:text-slate-200">{comment.content}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Textarea
                  placeholder="Escreva uma mensagem para a empresa..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  className="resize-none flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) handleSendComment()
                  }}
                />
                <Button
                  size="icon"
                  className="h-full px-4 bg-violet-600 hover:bg-violet-700 text-white flex-shrink-0"
                  onClick={handleSendComment}
                  disabled={commentLoading || !commentText.trim()}
                >
                  {commentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                Documentos do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Nenhum documento anexado a este projeto.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.file_name}</p>
                          {doc.description && (
                            <p className="text-xs text-slate-400">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.signed_at && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Assinado</Badge>
                        )}
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-600">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Empresa Contratante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.studio ? (
                <>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{project.studio.name}</p>
                  {project.studio.slug && (
                    <p className="text-sm text-slate-400">@{project.studio.slug}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Empresa não identificada</p>
              )}
            </CardContent>
          </Card>

          {project.customer && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente / Local
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{project.customer.name}</p>
                {project.customer.email && (
                  <p className="text-sm text-slate-400">{project.customer.email}</p>
                )}
                {project.customer.phone && (
                  <p className="text-sm text-slate-400">{project.customer.phone}</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4" />
                Detalhes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem
                icon={Tag}
                label="Tipo de Projeto"
                value={
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-violet-600" />
                    PPCI — Proteção e Combate a Incêndio
                  </span>
                }
              />
              {project.opened_at && (
                <InfoItem
                  icon={Calendar}
                  label="Data de Abertura"
                  value={format(new Date(project.opened_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                />
              )}
              {project.scheduled_at && (
                <InfoItem
                  icon={Calendar}
                  label="Data Agendada"
                  value={format(new Date(project.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                />
              )}
              {project.engineer_accepted_at && (
                <InfoItem
                  icon={CheckCircle2}
                  label="Aceito em"
                  value={format(new Date(project.engineer_accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                />
              )}
              {project.finished_at && (
                <InfoItem
                  icon={CheckCircle2}
                  label="Concluído em"
                  value={format(new Date(project.finished_at), "dd/MM/yyyy", { locale: ptBR })}
                />
              )}
            </CardContent>
          </Card>

          {project.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>
          )}

          {project.observations && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Observações Técnicas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{project.observations}</p>
              </CardContent>
            </Card>
          )}

          {project.professional_commission_value > 0 && (
            <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Valor de Comissão</p>
                <p className="text-2xl font-black text-emerald-700">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    project.professional_commission_value
                  )}
                </p>
                <Badge className={cn(
                  "text-xs mt-2",
                  project.professional_commission_status === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                )}>
                  {project.professional_commission_status === "paid" ? "Pago" : "Pendente"}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirmar Conclusão do Projeto PPCI
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar este projeto como <strong>Concluído</strong>? Esta ação indica que todas as etapas PPCI foram realizadas e o projeto foi entregue ao cliente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmFinish(false)}>Cancelar</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmFinish}
              disabled={statusLoading}
            >
              {statusLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirmar Conclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
