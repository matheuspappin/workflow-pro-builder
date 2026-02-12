"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function PartnerDashboard() {
  const [loading, setLoading] = useState(false)
  
  // Placeholder para dashboard do parceiro
  // Aqui listaria os sistemas criados por ele
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <header className="h-16 bg-white dark:bg-slate-900 border-b flex items-center px-8 justify-between">
        <div className="font-bold text-lg">Partner Portal</div>
        <Button size="sm">Novo Sistema</Button>
      </header>
      
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Meus Sistemas</CardTitle>
              <CardDescription>Total de ecossistemas ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Comissão</CardTitle>
              <CardDescription>Receita estimada</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">R$ 0,00</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Você ainda não tem clientes cadastrados.</p>
            <Button className="mt-4" onClick={() => window.location.href='/admin/ecosystems/new'}>
              Criar Primeiro Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
