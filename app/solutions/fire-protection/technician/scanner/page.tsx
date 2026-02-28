"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  QrCode,
  Search,
  Package,
  Building2,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Camera,
  XCircle,
  Info,
  Truck,
  PackageCheck,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { BarcodeScanner } from "@/components/dashboard/barcode-scanner"

type ScanMode = "vistoria" | "retirada" | "entrega"

interface Asset {
  id: string
  name: string
  type?: string
  location?: string
  status?: string
  expiration_date?: string
  qr_code?: string
  last_inspection_at?: string
  studio_id: string
  student_id?: string
  customer?: { name: string; phone?: string }
}

function getExpirationStatus(date?: string): { label: string; color: string; icon: React.ComponentType<{ className?: string }> } {
  if (!date) return { label: "Sem validade", color: "text-slate-500", icon: Info }
  const exp = new Date(date)
  const now = new Date()
  const in30 = new Date(now)
  in30.setDate(in30.getDate() + 30)

  if (exp <= now) return { label: "Vencido", color: "text-rose-600", icon: XCircle }
  if (exp <= in30) return { label: "Vence em breve", color: "text-amber-600", icon: AlertTriangle }
  return { label: "Dentro do prazo", color: "text-emerald-600", icon: CheckCircle2 }
}

export default function TechnicianScannerPage() {
  const { toast } = useToast()
  const [mode, setMode] = useState<ScanMode>("vistoria")
  const [manualCode, setManualCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; title: string; message: string; details?: string } | null>(null)

  const handleSearch = async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return

    setLoading(true)
    setAsset(null)
    setNotFound(false)
    setActionResult(null)

    // Modo Retirada ou Entrega: chamar asset-action direto
    if (mode === "retirada" || mode === "entrega") {
      try {
        const res = await fetch("/api/fire-protection/technician/asset-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            qrCode: trimmed,
            action: mode === "retirada" ? "pickup" : "delivery",
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setActionResult({ type: "success", title: mode === "retirada" ? "Retirado!" : "Entregue!", message: `${data.assetName} — ${data.message}`, details: data.details })
          if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100])
        } else {
          setActionResult({ type: "error", title: "Erro", message: data.error || "Extintor não encontrado" })
          if (window.navigator.vibrate) window.navigator.vibrate(500)
        }
      } catch {
        setActionResult({ type: "error", title: "Erro", message: "Falha ao processar" })
        toast({ title: "Erro ao processar", variant: "destructive" })
      }
      setLoading(false)
      return
    }

    // Modo Vistoria: buscar e mostrar detalhes
    try {
      const res = await fetch(`/api/fire-protection/technician/scanner?code=${encodeURIComponent(trimmed)}`, {
        credentials: "include",
      })
      const data = await res.json()

      if (res.ok && data && !data.error) {
        setAsset(data)
      } else {
        setNotFound(true)
      }
    } catch {
      toast({ title: "Erro ao buscar extintor", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterInspection = async () => {
    if (!asset) return
    setRegistering(true)
    try {
      const res = await fetch(`/api/fire-protection/technician/scanner/inspecionar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ asset_id: asset.id }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ title: "Vistoria registrada!", description: `Extintor ${asset.name} verificado com sucesso.` })
        setAsset(null)
        setManualCode("")
      } else {
        throw new Error(data.error || "Erro ao registrar")
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setRegistering(false)
    }
  }

  const expStatus = asset ? getExpirationStatus(asset.expiration_date) : null
  const ExpIcon = expStatus?.icon ?? Info

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <QrCode className="w-6 h-6 text-orange-600" />
          Scanner de Extintores
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {mode === "vistoria" && "Vistoria no local — validação técnica"}
          {mode === "retirada" && "Retirar para recarga — nosso extintor ou do cliente"}
          {mode === "entrega" && "Entregar após recarga — confirma entrega"}
        </p>
      </div>

      {/* Modo: Vistoria / Retirada / Entrega */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as ScanMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vistoria" className="text-xs font-bold data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
            <CheckCircle2 className="w-4 h-4 mr-1" />Vistoria
          </TabsTrigger>
          <TabsTrigger value="retirada" className="text-xs font-bold data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800">
            <Truck className="w-4 h-4 mr-1" />Retirada
          </TabsTrigger>
          <TabsTrigger value="entrega" className="text-xs font-bold data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
            <PackageCheck className="w-4 h-4 mr-1" />Entrega
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Scanner visual */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-48 h-48 border-4 border-orange-500/60 rounded-2xl flex items-center justify-center bg-slate-950/50">
              <QrCode className="w-16 h-16 text-orange-500/40" />
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-xl" />
            </div>
          </div>
          <Button
            className="font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => {
              setCameraActive(true)
              toast({
                title: "Scanner",
                description: "Em dispositivos móveis, aponte para o QR Code no extintor.",
              })
            }}
          >
            <Camera className="w-4 h-4 mr-2" />
            Usar câmera
          </Button>
        </CardContent>
      </Card>

      <BarcodeScanner
        isOpen={cameraActive}
        onClose={() => setCameraActive(false)}
        onScanSuccess={(decodedText) => {
          setCameraActive(false)
          handleSearch(decodedText)
        }}
      />

      {/* Busca manual */}
      <Card className="bg-white dark:bg-slate-900/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Search className="w-4 h-4 text-orange-600" />
            Busca Manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Código do extintor ou QR Code
            </Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(manualCode)}
                placeholder="Ex: EXT-001, UUID ou código QR..."
                className="flex-1"
              />
              <Button
                onClick={() => handleSearch(manualCode)}
                disabled={loading || !manualCode.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado Retirada/Entrega */}
      {actionResult && (
        <Card className={cn(
          "border-l-4",
          actionResult.type === "success" ? "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "border-l-rose-500 bg-rose-50 dark:bg-rose-900/10"
        )}>
          <CardContent className="p-5 flex items-center gap-4">
            {actionResult.type === "success" ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-10 h-10 text-rose-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-black text-lg">{actionResult.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{actionResult.message}</p>
              {actionResult.details && <p className="text-xs text-slate-500 mt-1">{actionResult.details}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setActionResult(null); setManualCode("") }}>
              <RefreshCw className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {notFound && mode === "vistoria" && (
        <Card className="border-rose-200 bg-rose-50 dark:bg-rose-900/10">
          <CardContent className="p-5 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-rose-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-rose-700 dark:text-rose-400">Extintor não encontrado</p>
              <p className="text-sm text-rose-600/70">Verifique o código e tente novamente.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {asset && expStatus && mode === "vistoria" && (
        <Card className={cn(
          "border-l-4",
          expStatus.icon === XCircle ? "border-l-rose-600" :
          expStatus.icon === AlertTriangle ? "border-l-amber-500" :
          "border-l-emerald-500"
        )}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">{asset.name}</h3>
                  {asset.type && <p className="text-sm text-slate-500">{asset.type}</p>}
                </div>
              </div>
              <Badge className={cn(
                "font-bold text-xs border-0",
                expStatus.icon === XCircle ? "bg-rose-100 text-rose-700" :
                expStatus.icon === AlertTriangle ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              )}>
                <ExpIcon className="w-3 h-3 mr-1" />
                {expStatus.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              {asset.location && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  <span>{asset.location}</span>
                </div>
              )}
              {asset.customer?.name && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Building2 className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  <span>{asset.customer.name}</span>
                </div>
              )}
              {asset.expiration_date && (
                <div className={cn("flex items-center gap-2 font-medium", expStatus.color)}>
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Validade: {new Date(asset.expiration_date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              {asset.last_inspection_at && (
                <div className="flex items-center gap-2 text-slate-500">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Última vistoria: {new Date(asset.last_inspection_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
                onClick={handleRegisterInspection}
                disabled={registering}
              >
                {registering ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Registrar Vistoria deste Extintor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {!asset && !notFound && !actionResult && (
        <Card className="bg-slate-50 dark:bg-slate-900/30 border-dashed">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Como usar</p>
            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>Localize o QR Code colado no extintor</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Escaneie com a câmera ou insira o código manualmente</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>
                  {mode === "vistoria" && "Confira as informações e registre a vistoria"}
                  {mode === "retirada" && "Confirme a retirada do extintor para recarga"}
                  {mode === "entrega" && "Confirme a entrega após recarga (validade +1 ano)"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
