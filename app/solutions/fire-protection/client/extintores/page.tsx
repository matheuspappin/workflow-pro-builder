"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FireClientExtintoresPage() {
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      fetch("/api/fire-protection/client/dashboard", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (!d.error && d.assets) setAssets(d.assets)
        })
        .finally(() => setLoading(false))
    })
  }, [])

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  const getStatusBadge = (a: any) => {
    const exp = a.expiration_date ? new Date(a.expiration_date) : null
    const now = new Date()
    const in30 = new Date(now)
    in30.setDate(in30.getDate() + 30)
    if (exp && exp <= now) return { label: "Vencido", variant: "destructive" as const }
    if (exp && exp <= in30) return { label: "A vencer", variant: "secondary" as const }
    return { label: "OK", variant: "default" as const }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Meus Extintores
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Lista dos seus equipamentos cadastrados
        </p>
      </div>

      {assets.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-slate-600 dark:text-slate-400">
              Nenhum extintor cadastrado
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Seus extintores aparecerão aqui quando forem registrados pela empresa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assets.map((a) => {
            const status = getStatusBadge(a)
            return (
              <Card
                key={a.id}
                className={cn(
                  "border-l-4 bg-white dark:bg-slate-900/50",
                  status.variant === "destructive" && "border-l-rose-500",
                  status.variant === "secondary" && "border-l-amber-500",
                  status.variant === "default" && "border-l-emerald-500"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4 text-red-600" />
                      {a.name}
                    </CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-1 text-sm text-slate-500">
                  {a.type && <p>Tipo: {a.type}</p>}
                  {a.location && <p>Local: {a.location}</p>}
                  {a.expiration_date && (
                    <p className="flex items-center gap-1">
                      {status.variant === "destructive" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      ) : status.variant === "secondary" ? (
                        <Clock className="w-4 h-4 text-amber-500" />
                      ) : null}
                      Vencimento: {new Date(a.expiration_date).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
