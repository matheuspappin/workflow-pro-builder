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
  Camera
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Html5Qrcode } from "html5-qrcode"
import { ModuleGuard } from "@/components/providers/module-guard"
import { useVocabulary } from "@/hooks/use-vocabulary"


export default function AdminScannerPage() {
  const { vocabulary, t } = useVocabulary()
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
      setAdminData(JSON.parse(userStr))
    }

    // Verificar se estamos em ambiente seguro (Camera só funciona em localhost ou HTTPS)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (!isSecure) {
      setCameraError(t.scanner.cameraError)
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
      // 1. LIMPEZA PREVENTIVA
      if (scannerRef.current) {
        try { await scannerRef.current.stop() } catch (e) {}
        scannerRef.current = null
      }

      // 2. FORÇAR PERMISSÃO (Fundamental para Chrome Mobile em domínios Vercel/HTTPS)
      logger.debug('🔐 Solicitando permissão de câmera...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        stream.getTracks().forEach(track => track.stop()); // Libera para o scanner usar
      } catch (e: any) {
        logger.warn('Aviso ao solicitar permissão:', e);
        // Não lançamos erro aqui, pois o getCameras pode funcionar se já tiver permissão
      }

      // 3. DESCOBERTA DE DISPOSITIVOS
      logger.debug('🚀 Buscando câmeras disponíveis...');
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        throw new Error(t.scanner.cameraNotFound);
      }

      // 4. SELEÇÃO DA MELHOR CÂMERA
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('traseira') ||
        d.label.toLowerCase().includes('environment') ||
        d.label.toLowerCase().includes('direção 1')
      ) || devices[devices.length - 1];

      logger.debug('📸 Usando câmera:', backCamera.label);

      const html5QrCode = new Html5Qrcode("scanner-container");
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: true
      };

      // 5. INÍCIO
      await html5QrCode.start(
        backCamera.id, 
        config, 
        (decodedText) => processScan(decodedText),
        () => {} 
      );

    } catch (err: any) {
      handleScannerError(err);
    }
  };

  const handleSimulateScan = () => {
    if (manualCode) {
      processScan(manualCode);
    } else {
      toast({
        title: t.scanner.simulationTip,
        description: t.scanner.simulate,
      });
    }
  };

  const handleScannerError = (err: any) => {
    logger.error("❌ Erro no scanner:", err);
    let msg: string = t.scanner.cameraAccessError;
    
    if (err.name === 'NotAllowedError' || err.toString().includes('Permission denied')) {
      msg = t.scanner.cameraPermission;
    } else if (err.name === 'NotReadableError' || err.toString().includes('Could not start video source')) {
      msg = t.scanner.cameraLocked;
    } else if (err.name === 'SecurityError') {
      msg = t.scanner.cameraSecurity;
    } else if (err.toString().includes('NotFoundError')) {
      msg = t.scanner.cameraNotFound;
    }
    
    setCameraError(msg);
    setIsScanning(false);
    toast({
      title: t.scanner.cameraFailure,
      description: msg,
      variant: "destructive"
    });
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (err) {
        logger.error("Erro ao parar scanner:", err)
      }
    }
    setIsScanning(false)
  }

  const processScan = async (scannedCode: string) => {
    if (loading) return

    const cleanedCode = scannedCode.trim().toUpperCase();
    logger.debug('🔍 [DEBUG] Código Bruto:', scannedCode);
    logger.debug('🔍 [DEBUG] Código Limpo:', cleanedCode);

    let attendanceId = "";

    // Lógica Simplificada e Robusta
    
    // CASO 1: Formato Completo (QR Code Antigo)
    if (cleanedCode.startsWith('DANCEFLOW_ATTENDANCE_')) {
      attendanceId = cleanedCode.replace('DANCEFLOW_ATTENDANCE_', '');
      logger.debug('✅ [DEBUG] Detectado: Full ID', attendanceId);
    }
    // CASO 2: Formato Curto com Prefixo (QR Code Novo / Manual com DF-)
    else if (cleanedCode.startsWith('DF-')) {
      // Aceita se tiver pelo menos o prefixo e algum conteúdo depois
      if (cleanedCode.length > 3) {
        attendanceId = cleanedCode;
        logger.debug('✅ [DEBUG] Detectado: Short Code com Prefixo', attendanceId);
      }
    }
    // CASO 3: Formato Curto sem Prefixo (Manual apenas código)
    // Aceita qualquer alfanumérico de 8 caracteres
    else if (cleanedCode.length === 8 && /^[A-Z0-9]+$/.test(cleanedCode)) {
      attendanceId = `DF-${cleanedCode}`;
      logger.debug('✅ [DEBUG] Detectado: Short Code sem Prefixo (Adicionado DF-)', attendanceId);
    }
    // CASO 4: UUID Solto (Fallback)
    else if (cleanedCode.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/)) {
        attendanceId = cleanedCode;
        logger.debug('✅ [DEBUG] Detectado: UUID Puro', attendanceId);
    }

    // Se após todas as tentativas ainda não tivermos um ID
    if (!attendanceId) {
      logger.debug('❌ [DEBUG] Falha: Nenhum formato reconhecido para', cleanedCode);
      toast({
        title: t.scanner.invalidCode,
        description: t.scanner.formatNotRecognized.replace('{code}', cleanedCode),
        variant: "destructive"
      });
      return;
    }

    if (attendanceId === 'pending') {
      toast({
        title: t.scanner.pendingSchedule,
        description: t.scanner.waitAndTry,
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    await stopScanner()

    try {
      logger.debug('🚀 [DEBUG] Enviando para API:', attendanceId);
      const response = await fetch('/api/admin/confirm-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId, adminId: adminData?.id })
      })

      const data = await response.json()

      // Lógica de Ativos (Assets)
      if (data.type === 'asset') {
          if (data.status === 'expired') {
            setLastResult({
                type: 'error',
                student: data.studentName,
                class: data.className,
                message: data.message
            });
            if (window.navigator.vibrate) window.navigator.vibrate(500);
          } else if (data.status === 'warning') {
            setLastResult({
                type: 'warning',
                student: data.studentName,
                class: data.className,
                message: data.message
            });
             if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
          } else {
             setLastResult({
                type: 'success',
                student: data.studentName,
                class: data.className,
                message: data.message
            });
             if (window.navigator.vibrate) window.navigator.vibrate([50, 50]);
          }
          setLoading(false);
          return;
      }

      if (data.success) {
        setLastResult({
          type: 'success',
          student: data.studentName,
          class: data.className,
          message: t.scanner.successMessage
        })
        if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100])
      } else {
        setLastResult({
          type: 'error',
          message: data.error || t.scanner.validationError
        })
        if (window.navigator.vibrate) window.navigator.vibrate(500)
      }
    } catch (error: any) {
      setLastResult({
        type: 'error',
        message: t.scanner.connError
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModuleGuard module="scanner" showFullError>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header title={t.scanner.title} />
        
        <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold tracking-tight">{t.scanner.gate}</h2>
          </div>

          <Card className="border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-primary flex items-center justify-center gap-2">
                <QrCodeIcon className="w-6 h-6" />
                {t.scanner.validateEntry}
              </CardTitle>
              <CardDescription>{t.scanner.scanDesc.replace('{client}', vocabulary.client)}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-6">
              
              {/* Área do Scanner */}
              <div className="w-full aspect-square rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
                {!isScanning ? (
                  <div className="text-center p-6 flex flex-col items-center">
                    <Camera className="w-20 h-20 text-slate-300 mb-4" />
                    {cameraError && (
                      <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-xs font-medium mb-4 flex gap-2 items-start text-left">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{cameraError}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-3 w-full">
                      <Button 
                        className="bg-primary hover:bg-primary/90 font-bold px-10 h-14 text-lg shadow-lg shadow-primary/20"
                        onClick={startScanner}
                      >
                        {t.scanner.openCamera}
                      </Button>
                      <Button 
                        variant="ghost"
                        className="text-slate-400 text-xs hover:text-primary"
                        onClick={handleSimulateScan}
                      >
                        {t.scanner.simulate}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full h-full relative">
                     <div id="scanner-container" className="w-full h-full absolute inset-0"></div>
                     
                     {/* Overlay Visual de Scan */}
                     <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-primary/50 rounded-lg relative">
                           <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-scan-line shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
                        </div>
                     </div>

                     <p className="relative z-10 text-white font-bold bg-black/60 px-4 py-2 rounded-full backdrop-blur-md mt-4 text-[10px] uppercase tracking-wider">
                        {t.scanner.pointToQr}
                     </p>
                     
                     <Button 
                      variant="ghost" 
                      className="absolute bottom-4 z-10 text-white hover:bg-white/10 bg-black/40 border border-white/20"
                      onClick={stopScanner}
                     >
                       {t.scanner.closeCamera}
                     </Button>
                  </div>
                )}
              </div>

              {/* Resultados do Scan */}
              {loading && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm font-medium animate-pulse">{t.scanner.validating}</p>
                </div>
              )}

              {lastResult && !loading && (
                <div className={`w-full p-4 rounded-2xl border flex items-center gap-4 animate-in fade-in zoom-in duration-300 ${
                  lastResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                  lastResult.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                  'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {lastResult.type === 'success' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  ) : lastResult.type === 'warning' ? (
                    <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-rose-500 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-black text-[10px] uppercase tracking-widest">
                        {lastResult.type === 'success' ? t.scanner.accessAllowed : 
                         lastResult.type === 'warning' ? 'ATENÇÃO' :
                         t.scanner.accessBlocked}
                    </p>
                    {lastResult.student && <p className="font-bold text-lg leading-tight">{lastResult.student}</p>}
                    <p className="text-xs opacity-90">{lastResult.message}</p>
                    {lastResult.class && <p className="text-xs opacity-70 mt-1">{lastResult.class}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setLastResult(null); startScanner(); }}>
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {/* Busca Manual Profissional */}
              {!isScanning && !loading && !lastResult && (
                <div className="w-full space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-center uppercase tracking-widest font-bold text-slate-400">{t.scanner.manualCode}</p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder={t.scanner.manualPlaceholder} 
                      className="h-12 text-sm font-mono bg-slate-50"
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                    />
                    <Button size="lg" className="h-12 px-6" onClick={() => processScan(manualCode)}>
                      {t.scanner.validate}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-4 flex gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                {t.scanner.autoCheck.replace('{client}', vocabulary.client.toLowerCase())}
              </p>
            </CardContent>
          </Card>
        </main>

        <style jsx global>{`
          @keyframes scan-line {
            0% { top: 0; }
            100% { top: 100%; }
          }
          .animate-scan-line {
            animation: scan-line 2s linear infinite;
          }
          #scanner-container video {
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
