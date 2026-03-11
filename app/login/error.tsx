"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Login page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold">Erro ao carregar o login</h1>
        <p className="text-white/60 text-sm">
          Verifique se o Supabase está configurado no arquivo <code className="bg-white/10 px-1.5 py-0.5 rounded">.env.local</code>:
        </p>
        <pre className="text-left text-xs bg-white/5 p-4 rounded-lg overflow-x-auto text-white/80">
{`NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon`}
        </pre>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Tentar novamente
          </Button>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Link href="/home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao site
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
