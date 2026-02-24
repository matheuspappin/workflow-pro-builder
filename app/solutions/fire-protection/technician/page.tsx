"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Wrench,
  ClipboardList,
  QrCode,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Calendar,
  Building2,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface OS {
  id: string
  tracking_code: string
  title: string
  status: string
  priority?: string
  project_type: string
  scheduled_at?: string
  finished_at?: string
  customer?: { name: string; phone?: string; address?: string }
}

function formatHour(d?: string) {
  if (!d) return null
  return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function isToday(d?: string) {
  if (!d) return false
  const date = new Date(d)
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

export default function FireTechnicianDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [osList, setOsList] = useState<OS[]>([])

  const fetchData = useCallback(async (userId: string) => {
    try {
      const res = await fetch("/api/fire-protection/technician/os?tipo=all", { credentials: "include" })
      const data = await res.json()
      if (Array.isArray(data)) setOsList(data)
    } catch {}
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchData(user.id).finally(() => setLoading(false))
      else setLoading(false)
    })
  }, [fetchData])

  const today = osList.filter(o => isToday(o.scheduled_at) && (o.status === "open" || o.status === "in_progress"))
  const proximas = osList.filter(o => !isToday(o.scheduled_at) && (o.status === "open" || o.status === "in_progress"))
  const abertas = osList.filter(o => o.status === "open").length
  const andamento = osList.filter(o => o.status === "in_progress").length
  const concluidasHoje = osList.filter(o => o.status === "finished" && isToday(o.finished_at)).length
  const urgentes = osList.filter(o => o.priority === "urgente" && (o.status === "open" || o.status === "in_progress")).length

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Olá, {user?.user_metadata?.name?.split(" ")[0] || "Técnico"}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            {today.length > 0
              ? `${today.length} OS/vistoria${today.length > 1 ? "s" : ""} agendada${today.length > 1 ? "s" : ""} para hoje`
              : "Nenhuma OS agendada para hoje"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => user && fetchData(user.id)}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link href="/solutions/fire-protection/technician/scanner">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20">
              <QrCode className="w-4 h-4 mr-2" />
              Scanner
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "OS Abertas", value: abertas, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-600/10", icon: ClipboardList },
          { label: "Em Andamento", value: andamento, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-600/10", icon: Wrench },
          { label: "Concluídas Hoje", value: concluidasHoje, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-600/10", icon: CheckCircle },
          { label: "Urgentes", value: urgentes, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-600/10", icon: AlertTriangle },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-md bg-white dark:bg-slate-900/50">
            <CardContent className="p-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <p className={cn("text-3xl font-black", stat.color)}>{stat.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS do dia */}
        <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-600" />
              OS de Hoje
            </CardTitle>
            <Link href="/solutions/fire-protection/technician/os">
              <Button variant="ghost" size="sm" className="text-orange-600 font-bold text-xs">
                Ver todas <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="font-medium text-sm">Nenhuma OS para hoje</p>
                <p className="text-xs mt-1">Fique atento às novas atribuições.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {today.slice(0, 4).map(os => (
                  <Link href="/solutions/fire-protection/technician/os" key={os.id}>
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-l-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                      os.project_type === "vistoria" ? "border-l-red-500" : "border-l-orange-500"
                    )}>
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        os.project_type === "vistoria" ? "bg-red-100" : "bg-orange-100"
                      )}>
                        {os.project_type === "vistoria"
                          ? <Calendar className="w-4 h-4 text-red-600" />
                          : <Wrench className="w-4 h-4 text-orange-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{os.title}</p>
                        {os.customer && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 flex-shrink-0" />{os.customer.name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {os.scheduled_at && (
                          <span className="text-xs font-bold text-slate-500">{formatHour(os.scheduled_at)}</span>
                        )}
                        {os.priority === "urgente" && (
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximas vistorias / OS */}
        <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-600" />
              Próximas Atribuições
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximas.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="font-medium text-sm">Nenhuma OS futura</p>
                <p className="text-xs mt-1">Atribuições aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximas.slice(0, 4).map(os => (
                  <Link href="/solutions/fire-protection/technician/os" key={os.id}>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{os.title}</p>
                        {os.customer && (
                          <p className="text-xs text-slate-500 truncate">{os.customer.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {os.scheduled_at && (
                          <span className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                            {formatDate(os.scheduled_at)}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scanner Quick Access */}
      <Link href="/solutions/fire-protection/technician/scanner">
        <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-none shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-black text-xl">Scanner de Extintores</p>
                <p className="text-orange-100 text-sm">Escaneie o QR code para registrar vistoria</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 opacity-60" />
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
