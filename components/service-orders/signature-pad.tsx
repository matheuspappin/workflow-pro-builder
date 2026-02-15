'use client'

import React, { useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2, Check } from 'lucide-react'

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void
  onClear?: () => void
  defaultValue?: string
}

export function SignaturePad({ onSave, onClear, defaultValue }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)

  const clear = () => {
    sigCanvas.current?.clear()
    if (onClear) onClear()
  }

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
    if (dataUrl) {
      onSave(dataUrl)
    }
  }

  return (
    <Card className="p-4 w-full max-w-md mx-auto">
      <div className="border rounded-md bg-white mb-4">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: 'signature-canvas w-full h-48 cursor-crosshair',
          }}
        />
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={clear} type="button">
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar
        </Button>
        <Button variant="default" size="sm" onClick={save} type="button">
          <Check className="w-4 h-4 mr-2" />
          Confirmar Assinatura
        </Button>
      </div>
    </Card>
  )
}
