"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-900/5">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Algo deu errado
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Ocorreu um erro ao carregar o painel. Tente novamente.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
            <Button asChild variant="outline" className="border-slate-200 dark:border-slate-700">
              <Link href="/solutions/estudio-de-danca/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
