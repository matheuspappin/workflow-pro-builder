"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void
  isOpen: boolean
  onClose: () => void
}

export function BarcodeScanner({ onScanSuccess, isOpen, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        startScanner()
      }, 100)
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isOpen])

  const startScanner = async () => {
    try {
      const element = document.getElementById("reader")
      if (!element) return

      // Se já existe, garante que para antes de reiniciar
      if (scannerRef.current) {
        await stopScanner()
      }

      const scanner = new Html5Qrcode("reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 30,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.min(viewfinderWidth * 0.85, 400)
            const height = Math.min(viewfinderHeight * 0.3, 150)
            return { width, height }
          },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        } as any,
        (decodedText) => {
          // Sucesso
          onScanSuccess(decodedText)
          stopScanner()
          onClose()
        },
        (errorMessage) => {
          // Erro de leitura (frame vazio, normal)
        }
      )

      // Tentar forçar o foco contínuo se o navegador suportar
      try {
        const videoElement = element.querySelector('video');
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities() as any;
          
          if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            await track.applyConstraints({
              advanced: [{ focusMode: 'continuous' }] as any
            });
          }
        }
      } catch (e) {
        console.warn("Não foi possível aplicar foco automático avançado:", e);
      }
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err)
      setError("Não foi possível acessar a câmera. Verifique as permissões.")
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch (e) {
        console.error("Erro ao parar scanner:", e)
      }
      scannerRef.current = null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" /> Escanear Código de Barras
          </DialogTitle>
          <DialogDescription>Aponte a câmera para o código de barras ou QR Code para escanear.</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center min-h-[300px] p-4 bg-muted/20 rounded-lg relative overflow-hidden">
          {error ? (
            <div className="text-center text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => { setError(null); startScanner(); }}>
                <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
              </Button>
            </div>
          ) : (
            <>
              <div id="reader" className="w-full h-full rounded-lg overflow-hidden"></div>
              {/* Linha de Scanner Visual */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse z-10 pointer-events-none"></div>
            </>
          )}
          <p className="text-xs text-muted-foreground mt-4 text-center px-4">
            Aponte a câmera para o código de barras. <br/>
            <span className="text-[10px] opacity-70">Dica: Tente aproximar ou afastar lentamente para ajudar no foco.</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
