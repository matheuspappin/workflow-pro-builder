"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Package,
  Truck,
  Loader2,
  CheckCircle2,
  MapPin,
  Wrench,
  Building2,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const EVOLUTION_OPTIONS = [
  { value: "no_cliente", label: "No Cliente", icon: Building2 },
  { value: "retirado", label: "Retirado", icon: Truck },
  { value: "em_recarga", label: "Em Recarga", icon: Wrench },
  { value: "pronto_entrega", label: "Pronto para Entrega", icon: Package },
  { value: "entregue", label: "Entregue", icon: CheckCircle2 },
] as const

interface Asset {
  id: string
  name: string
  qr_code?: string
  agent_type?: string
  capacity?: string
  status?: string
  location?: string
  expiration_date?: string
  evolution_status?: string
  student_id?: string
  student?: { id: string; name: string; phone?: string }
}

export default function TechnicianOSExtintoresPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { toast } = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [os, setOs] = useState<{ id: string; title: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/fire-protection/technician/os/${id}/extintores`, { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao carregar")
      setAssets(data.assets || [])
      setOs(data.os || null)
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleEvolutionChange = async (assetId: string, evolution_status: string) => {
    setUpdating(assetId)
    try {
      const res = await fetch(`/api/fire-protection/technician/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ evolution_status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar")
      setAssets((prev) =>
        prev.map((a) => (a.id === assetId ? { ...a, evolution_status, ...data } : a))
      )
      toast({ title: "Evolução atualizada!", description: `${data.name} → ${EVOLUTION_OPTIONS.find((e) => e.value === evolution_status)?.label}` })
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  const handleLocationChange = async (assetId: string, location: string, currentLocation?: string) => {
    if (location.trim() === (currentLocation || "").trim()) return
    setUpdating(assetId)
    try {
      const res = await fetch(`/api/fire-protection/technician/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ location }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar")
      setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, location } : a)))
      toast({ title: "Localização atualizada!" })
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  const entreguesCount = assets.filter((a) => (a.evolution_status || "no_cliente") === "entregue").length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} asChild>
          <Link href="/solutions/fire-protection/technician/os">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-600" />
            Evolução dos Extintores
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {os?.title || "Carregando..."} — {entreguesCount}/{assets.length} entregues
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      ) : assets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum extintor vinculado a esta OS</p>
            <p className="text-sm mt-1">
              Gere os adesivos QR na tela da OS ou escaneie os extintores no modo Retirada para vinculá-los.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/solutions/fire-protection/technician/os">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Minhas OS
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assets.map((asset) => {
            const ev = asset.evolution_status || "no_cliente"
            const opt = EVOLUTION_OPTIONS.find((e) => e.value === ev)
            const EvIcon = opt?.icon ?? Package

            return (
              <Card key={asset.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{asset.name}</h3>
                      {(asset.agent_type || asset.capacity) && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {[asset.agent_type, asset.capacity].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {asset.student?.name && (
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {asset.student.name}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        ev === "entregue" && "bg-emerald-100 text-emerald-700",
                        ev === "em_recarga" && "bg-amber-100 text-amber-700",
                        ev === "retirado" && "bg-blue-100 text-blue-700",
                        ev === "pronto_entrega" && "bg-indigo-100 text-indigo-700",
                        ev === "no_cliente" && "bg-slate-100 text-slate-600"
                      )}
                    >
                      <EvIcon className="w-3 h-3 mr-1" />
                      {opt?.label ?? ev}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-bold uppercase text-slate-500">Evolução</Label>
                      <Select
                        value={ev}
                        onValueChange={(v) => handleEvolutionChange(asset.id, v)}
                        disabled={!!updating}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVOLUTION_OPTIONS.map((e) => (
                            <SelectItem key={e.value} value={e.value}>
                              <div className="flex items-center gap-2">
                                <e.icon className="w-4 h-4" />
                                {e.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase text-slate-500">Local / Empresa</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={asset.location || ""}
                          onChange={(e) =>
                            setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, location: e.target.value } : a)))
                          }
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            handleLocationChange(asset.id, v, asset.location || "")
                          }}
                          placeholder="Ex: Oficina, Cliente X..."
                          className="flex-1"
                        />
                        {updating === asset.id && <Loader2 className="w-5 h-5 animate-spin text-orange-600 flex-shrink-0" />}
                      </div>
                    </div>
                  </div>

                  {asset.expiration_date && ev === "entregue" && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Validade: {new Date(asset.expiration_date).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Atualizar
            </Button>
            <Button asChild>
              <Link href="/solutions/fire-protection/technician/scanner">
                Abrir Scanner
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/solutions/fire-protection/technician/os">Voltar para OS</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
