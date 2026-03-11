"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ModuleGuard } from "@/components/providers/module-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import logger from "@/lib/logger"
import {
  QrCode as QrCodeIcon,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Camera,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Html5Qrcode } from "html5-qrcode"

const SCANNER_TEXTS = {
  title: "Scanner de Portaria",
  gate: "Portaria",
  validateEntry: "Validar Entrada",
  scanDesc: "Escaneie o QR Code do aluno ou digite o código manual.",
  openCamera: "Abrir Câmera",
  simulate: "Simular Scanner",
  pointToQr: "Aponte para o QR Code",
  closeCamera: "Fechar Câmera",
  validating: "Validando acesso...",
  accessAllowed: "ACESSO PERMITIDO",
  accessBlocked: "ACESSO BLOQUEADO",
  manualCode: "Ou digite o código manualmente",
  validate: "Validar",
  autoCheck: "O sistema verifica automaticamente se o aluno possui créditos disponíveis antes de liberar a entrada.",
  cameraError: "A câmera pode não abrir fora de HTTPS. Use localhost ou URL segura.",
  cameraPermission: "Permissão negada. Ative a câmera nas configurações do site.",
  cameraNotFound: "Câmera não encontrada.",
  invalidCode: "Código Inválido",
  formatNotRecognized: "Formato não reconhecido: {code}",
  successMessage: "Presença validada com sucesso!",
  connError: "Falha na conexão com o servidor.",
  validationError: "Erro ao validar presença.",
  manualPlaceholder: "DF-XXXXXXXX ou 8 caracteres",
}

export default function DanceFlowScannerPage() {
  const { toast } = useToast()
  const [adminData, setAdminData] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("danceflow_user")
    if (userStr) {
      try {
        setAdminData(JSON.parse(userStr))
      } catch {}
    }

    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    if (!isSecure) {
      setCameraError(SCANNER_TEXTS.cameraError)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startScanner = async () => {
    setCameraError(null)
    setIsScanning(true)
    setLastResult(null)

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
        } catch {}
        scannerRef.current = null
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        stream.getTracks().forEach((t) => t.stop())
      } catch {}

      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        throw new Error(SCANNER_TEXTS.cameraNotFound)
      }

      const backCamera =
        devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("traseira") ||
            d.label.toLowerCase().includes("environment")
        ) || devices[devices.length - 1]

      const html5QrCode = new Html5Qrcode("danceflow-scanner-container")
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        backCamera.id,
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, disableFlip: true },
        (decodedText) => processScan(decodedText),
        () => {}
      )
    } catch (err: any) {
      logger.error("Erro no scanner DanceFlow:", err)
      let msg = SCANNER_TEXTS.cameraPermission
      if (err.name === "NotAllowedError" || err.toString().includes("Permission denied")) {
        msg = SCANNER_TEXTS.cameraPermission
      } else if (err.toString().includes("NotFoundError")) {
        msg = SCANNER_TEXTS.cameraNotFound
      }
      setCameraError(msg)
      setIsScanning(false)
      toast({ title: "Falha na Câmera", description: msg, variant: "destructive" })
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch {}
    }
    setIsScanning(false)
  }

  const processScan = async (scannedCode: string) => {
    if (loading) return

    const cleanedCode = scannedCode.trim().toUpperCase()
    let attendanceId = ""

    if (cleanedCode.startsWith("DANCEFLOW_ATTENDANCE_")) {
      attendanceId = cleanedCode.replace("DANCEFLOW_ATTENDANCE_", "")
    } else if (cleanedCode.startsWith("DF-") && cleanedCode.length > 3) {
      attendanceId = cleanedCode
    } else if (cleanedCode.length === 8 && /^[A-Z0-9]+$/.test(cleanedCode)) {
      attendanceId = `DF-${cleanedCode}`
    } else if (
      cleanedCode.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/)
    ) {
      attendanceId = cleanedCode
    }

    if (!attendanceId) {
      toast({
        title: SCANNER_TEXTS.invalidCode,
        description: SCANNER_TEXTS.formatNotRecognized.replace("{code}", scannedCode),
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    await stopScanner()

    try {
      const response = await fetch("/api/admin/confirm-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, adminId: adminData?.id }),
      })

      const data = await response.json()

      if (data.type === "asset") {
        setLastResult({
          type: data.status === "expired" ? "error" : data.status === "warning" ? "warning" : "success",
          student: data.studentName,
          class: data.className,
          message: data.message,
        })
        if (window.navigator.vibrate) window.navigator.vibrate(500)
      } else if (data.success) {
        setLastResult({
          type: "success",
          student: data.studentName,
          class: data.className,
          message: SCANNER_TEXTS.successMessage,
        })
        if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100])
      } else {
        setLastResult({ type: "error", message: data.error || SCANNER_TEXTS.validationError })
        if (window.navigator.vibrate) window.navigator.vibrate(500)
      }
    } catch {
      setLastResult({ type: "error", message: SCANNER_TEXTS.connError })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModuleGuard module="scanner" showFullError>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/solutions/estudio-de-danca/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {SCANNER_TEXTS.gate}
          </h1>
          <p className="text-sm text-slate-500">Valide a entrada dos alunos via QR Code</p>
        </div>
      </div>

      <Card className="border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-2 text-violet-600">
            <QrCodeIcon className="w-6 h-6" />
            {SCANNER_TEXTS.validateEntry}
          </CardTitle>
          <CardDescription>{SCANNER_TEXTS.scanDesc}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center gap-6">
          <div className="w-full aspect-square max-w-md rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
            {!isScanning ? (
              <div className="text-center p-6 flex flex-col items-center">
                <Camera className="w-20 h-20 text-slate-300 mb-4" />
                {cameraError && (
                  <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 p-3 rounded-lg text-xs font-medium mb-4 text-left flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{cameraError}</p>
                  </div>
                )}
                <Button
                  className="bg-violet-600 hover:bg-violet-700 font-bold px-10 h-14 text-lg"
                  onClick={startScanner}
                >
                  {SCANNER_TEXTS.openCamera}
                </Button>
                <Button
                  variant="ghost"
                  className="text-slate-400 text-xs mt-2"
                  onClick={() => manualCode && processScan(manualCode)}
                >
                  {SCANNER_TEXTS.simulate}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full h-full relative">
                <div
                  id="danceflow-scanner-container"
                  className="w-full h-full absolute inset-0 rounded-3xl overflow-hidden"
                />
                <p className="relative z-10 text-white font-bold bg-black/60 px-4 py-2 rounded-full backdrop-blur-md mt-4 text-[10px] uppercase tracking-wider">
                  {SCANNER_TEXTS.pointToQr}
                </p>
                <Button
                  variant="ghost"
                  className="absolute bottom-4 z-10 text-white hover:bg-white/10 bg-black/40 border border-white/20"
                  onClick={stopScanner}
                >
                  {SCANNER_TEXTS.closeCamera}
                </Button>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              <p className="text-sm font-medium animate-pulse">{SCANNER_TEXTS.validating}</p>
            </div>
          )}

          {lastResult && !loading && (
            <div
              className={`w-full p-4 rounded-2xl border flex items-center gap-4 ${
                lastResult.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200"
                  : lastResult.type === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200"
              }`}
            >
              {lastResult.type === "success" ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              ) : lastResult.type === "warning" ? (
                <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-500 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-black text-[10px] uppercase tracking-widest">
                  {lastResult.type === "success"
                    ? SCANNER_TEXTS.accessAllowed
                    : lastResult.type === "warning"
                      ? "ATENÇÃO"
                      : SCANNER_TEXTS.accessBlocked}
                </p>
                {lastResult.student && (
                  <p className="font-bold text-lg leading-tight">{lastResult.student}</p>
                )}
                <p className="text-xs opacity-90">{lastResult.message}</p>
                {lastResult.class && (
                  <p className="text-xs opacity-70 mt-1">{lastResult.class}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setLastResult(null)
                  startScanner()
                }}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          )}

          {!isScanning && !loading && !lastResult && (
            <div className="w-full space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-center uppercase tracking-widest font-bold text-slate-400">
                {SCANNER_TEXTS.manualCode}
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder={SCANNER_TEXTS.manualPlaceholder}
                  className="h-12 text-sm font-mono bg-slate-50 dark:bg-slate-800"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <Button
                  size="lg"
                  className="h-12 px-6 bg-violet-600 hover:bg-violet-700"
                  onClick={() => processScan(manualCode)}
                >
                  {SCANNER_TEXTS.validate}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-violet-50 dark:bg-violet-950/20">
        <CardContent className="p-4 flex gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <p className="text-xs text-violet-800 dark:text-violet-200 leading-relaxed">
            {SCANNER_TEXTS.autoCheck}
          </p>
        </CardContent>
      </Card>

      <style jsx global>{`
        #danceflow-scanner-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1.5rem;
        }
      `}</style>
    </div>
    </ModuleGuard>
  )
}
