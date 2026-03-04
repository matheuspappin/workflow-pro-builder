"use client"

import { AlertTriangle } from "lucide-react"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-3">Sistema em Manutenção</h1>
        <p className="text-muted-foreground text-lg mb-6">
          Estamos realizando uma manutenção programada para melhorar sua experiência.
          Por favor, tente novamente em alguns minutos.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
