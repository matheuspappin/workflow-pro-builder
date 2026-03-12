"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AffiliateHeader } from "@/components/dashboard/affiliate-header"
import { 
  Users, 
  Wallet, 
  Building2, 
  ArrowUpRight, 
  Loader2,
  Sparkles
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  partnerId?: string;
}

export default function AffiliateDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
           toast({
             title: "Acesso restrito",
             description: "Esta área é apenas para afiliados.",
             variant: "destructive"
           })
           router.push("/portal/login")
           return
        }
        setUser(parsedUser)
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [router, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <AffiliateHeader 
        title="Visão Geral" 
        description="Acompanhe o desempenho dos seus estúdios indicados." 
      />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estúdios Ativos
              </CardTitle>
              <Building2 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-slate-500">
                +0% em relação ao mês passado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Membros Totais
              </CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-slate-500">
                Somando todos os estúdios
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Comissões (Mês)
              </CardTitle>
              <Wallet className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">R$ 0,00</div>
              <p className="text-xs text-slate-500">
                Disponível para saque
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conversão
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-slate-500">
                Leads vs. Vendas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity or List */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Seus Parceiros</CardTitle>
            <CardDescription>
              Lista de parceiros que você indicou e estão ativos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="bg-slate-100 p-4 rounded-full">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Nenhuma empresa encontrada</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  voce ainda nao tem empresas vinculadas a sua conta de afiliado
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/portal/affiliate/ecosystems/new">
                  <Button className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Criar Novo Sistema
                  </Button>
                </Link>
                <Button variant="outline">
                  Gerar Link Genérico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
