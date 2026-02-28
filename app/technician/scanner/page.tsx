"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Truck,
  PackageCheck,
  ClipboardCheck
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Html5Qrcode } from "html5-qrcode"
import { useVocabulary } from "@/hooks/use-vocabulary"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TeacherScannerPage() {
  const { t } = useVocabulary()
  const { toast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [mode, setMode] = useState<'pickup' | 'delivery' | 'inspection'>('pickup')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
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
        try { await scannerRef.current.stop() } catch (e) {}
        scannerRef.current = null
      }

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) throw new Error("Câmera não encontrada");

      const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')) || devices[0];

      const html5QrCode = new Html5Qrcode("scanner-container");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        backCamera.id, 
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, disableFlip: true }, 
        (decodedText) => processScan(decodedText),
        () => {} 
      );

    } catch (err: any) {
      handleScannerError(err);
    }
  };

  const handleScannerError = (err: any) => {
    logger.error("❌ Erro no scanner:", err);
    setCameraError("Erro ao acessar câmera. Verifique permissões.");
    setIsScanning(false);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current = null; } catch (err) {}
    }
    setIsScanning(false)
  }

  const processScan = async (scannedCode: string) => {
    if (loading) return
    const cleanedCode = scannedCode.trim().toUpperCase(); // Assumindo UUID ou Hash direto

    setLoading(true)
    await stopScanner()

    try {
      // Chamar Server Action ou API Route
      // Como não criei a action ainda, vou simular ou criar API
      // Vou usar uma chamada direta ao supabase client-side por simplicidade se as policies permitirem,
      // mas "Atualizar data de validade" requer update permissions.
      // O Teacher deve ter permissão de update em assets? 
      // Vou criar uma API Route específica para essa operação segura: /api/teacher/asset-action
      
      const response = await fetch('/api/teacher/asset-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            qrCode: cleanedCode, 
            action: mode 
        })
      })

      const data = await response.json()

      if (data.success) {
        setLastResult({
          type: 'success',
          title: mode === 'pickup' ? 'Coletado!' : 'Entregue!',
          message: `${data.assetName} - ${data.message}`,
          details: data.details
        })
        if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100])
      } else {
        setLastResult({
          type: 'error',
          title: 'Erro',
          message: data.error
        })
        if (window.navigator.vibrate) window.navigator.vibrate(500)
      }
    } catch (error: any) {
        setLastResult({ type: 'error', title: 'Erro de Conexão', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b p-4 flex items-center gap-4 sticky top-0 z-10">
            <Link href="/teacher">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h2 className="text-xl font-bold tracking-tight">Scanner Técnico</h2>
      </div>
      
      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-6">
        
        <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="pickup" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800 font-bold text-[10px]">
                    <Truck className="w-4 h-4 mr-1" /> Retirada
                </TabsTrigger>
                <TabsTrigger value="inspection" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-800 font-bold text-[10px]">
                    <ClipboardCheck className="w-4 h-4 mr-1" /> Inspeção
                </TabsTrigger>
                <TabsTrigger value="delivery" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 font-bold text-[10px]">
                    <PackageCheck className="w-4 h-4 mr-1" /> Entrega
                </TabsTrigger>
            </TabsList>
        </Tabs>

        <Card className={`border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border-t-4 ${mode === 'pickup' ? 'border-t-amber-500' : 'border-t-emerald-500'}`}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-primary flex items-center justify-center gap-2">
              <QrCodeIcon className="w-6 h-6" />
              {mode === 'pickup' ? 'Ler para Retirar' : mode === 'inspection' ? 'Ler para Inspecionar' : 'Ler para Entregar'}
            </CardTitle>
            <CardDescription>
              {mode === 'inspection' ? 'Realize a vistoria técnica no local' : 'Aponte para o selo do equipamento'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center gap-6">
            
            <div className="w-full aspect-square rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
              {!isScanning ? (
                <div className="text-center p-6 flex flex-col items-center">
                  <Camera className="w-20 h-20 text-slate-300 mb-4" />
                  {cameraError && <p className="text-rose-500 text-xs mb-4">{cameraError}</p>}
                  <Button className="bg-primary hover:bg-primary/90 font-bold px-10 h-14 text-lg shadow-lg" onClick={startScanner}>
                    Abrir Câmera
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full h-full relative">
                   <div id="scanner-container" className="w-full h-full absolute inset-0"></div>
                   <div className="absolute inset-0 pointer-events-none border-2 border-primary/50 m-12 rounded-lg" />
                   <Button variant="ghost" className="absolute bottom-4 z-10 bg-white/80" onClick={stopScanner}>Fechar</Button>
                </div>
              )}
            </div>

            {loading && <Loader2 className="w-8 h-8 animate-spin text-primary" />}

            {lastResult && !loading && (
              <div className={`w-full p-4 rounded-xl border flex items-center gap-4 ${
                lastResult.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
              }`}>
                {lastResult.type === 'success' ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <XCircle className="w-8 h-8 text-rose-600" />}
                <div>
                    <p className="font-black text-lg">{lastResult.title}</p>
                    <p className="text-sm">{lastResult.message}</p>
                    {lastResult.details && <p className="text-xs text-muted-foreground mt-1">{lastResult.details}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setLastResult(null); startScanner(); }}>
                    <RefreshCw className="w-5 h-5" />
                </Button>
              </div>
            )}
            
            <div className="w-full flex gap-2">
                <Input placeholder="Código manual" value={manualCode} onChange={e => setManualCode(e.target.value)} />
                <Button onClick={() => processScan(manualCode)}>Validar</Button>
            </div>

          </CardContent>
        </Card>
      </main>
    </div>
  )
}
