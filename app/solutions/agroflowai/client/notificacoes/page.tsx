"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2, AlertTriangle, Info, Loader2, CheckCheck, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "error"
  title: string
  body: string
  read: boolean
  created_at: string
}

const typeConfig = {
  success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-l-emerald-400" },
  warning: { icon: AlertTriangle,  color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-l-amber-400" },
  info:    { icon: Info,           color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-l-blue-400" },
  error:   { icon: XCircle,        color: "text-red-400",    bg: "bg-red-400/10",    border: "border-l-red-400" },
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return "Agora mesmo"
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  const days = Math.floor(diff / 86400)
  if (days === 1) return "Ontem"
  if (days < 7) return `${days} dias atrás`
  return date.toLocaleDateString("pt-BR")
}

export default function ClientNotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [markingAll, setMarkingAll] = useState(false)
  const { toast } = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const stored = localStorage.getItem("workflow_user")
      if (!stored) return
      const parsed = JSON.parse(stored)
      const sid = parsed.studioId || parsed.studio_id
      const cid = parsed.customerId || parsed.customer_id || user.id
      if (!sid) return

      setStudioId(sid)
      setCustomerId(cid)

      const res = await fetch(`/api/agroflowai/notificacoes?studioId=${sid}&customerId=${cid}`)
      const data = await res.json()
      if (Array.isArray(data)) setNotifications(data)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/agroflowai/notificacoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, studioId, read: true }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {
      // silencioso
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch("/api/agroflowai/notificacoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, markAllRead: true, customerId }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast({ title: "Todas as notificações marcadas como lidas" })
    } catch {
      toast({ title: "Erro ao marcar notificações", variant: "destructive" })
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Notificações</h1>
          <p className="text-slate-400 mt-1">
            Alertas e avisos sobre sua propriedade e serviços
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-white rounded-xl"
          >
            {markingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-2" />}
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-semibold">Nenhuma notificação</p>
            <p className="text-slate-600 text-sm mt-1">Você está em dia! Novos alertas aparecerão aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const cfg = typeConfig[notif.type] || typeConfig.info
            const Icon = cfg.icon
            return (
              <Card
                key={notif.id}
                className={cn(
                  "border-l-4 transition-colors cursor-pointer",
                  notif.read ? "bg-slate-900/30 border-slate-800" : "bg-slate-900/60 border-slate-800",
                  cfg.border
                )}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
                    <Icon className={cn("w-5 h-5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("font-bold text-sm", notif.read ? "text-slate-400" : "text-white")}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{notif.body}</p>
                    <p className="text-xs text-slate-600 mt-1.5">{formatTime(notif.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
