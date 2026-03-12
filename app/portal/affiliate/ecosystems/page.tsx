"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AffiliateHeader } from "@/components/dashboard/affiliate-header"
import { Building2, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

export default function AffiliateEcosystemsPage() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/portal/affiliate/login")
        return
      }
      const storedUser = localStorage.getItem("danceflow_user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.role !== 'affiliate' && parsedUser.role !== 'partner' && parsedUser.role !== 'admin' && parsedUser.role !== 'super_admin') {
          toast.error("Acesso restrito: Esta área é apenas para afiliados.")
          router.push("/portal/login")
          return
        }
      }
      setIsReady(true)
    }
    checkAuth()
  }, [router])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <AffiliateHeader 
        title="Meus Ecossistemas" 
        description="Gerencie os sistemas que você indicou e acompanhe o desempenho." 
      />

      <Card>
        <CardHeader>
          <CardTitle>Seus Ecossistemas</CardTitle>
          <CardDescription>
            Lista de sistemas/estúdios que você criou ou indicou. Crie um novo para convidar clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="bg-muted p-4 rounded-full">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Nenhum ecossistema encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                Crie um novo sistema para enviar o link de convite ao seu cliente.
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/portal/affiliate/ecosystems/new">
                <Plus className="w-4 h-4" />
                Criar Novo Sistema
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
