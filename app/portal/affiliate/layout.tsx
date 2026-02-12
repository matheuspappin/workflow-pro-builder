"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar" // Reutilizaremos o Sidebar existente
import { MobileNav } from "@/components/dashboard/mobile-nav" // Reutilizaremos o MobileNav
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function AffiliatePortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/portal/affiliate/login")
        return
      }

      // Verifica o papel do usuário. Idealmente, isso viria de um perfil do usuário.
      // Por enquanto, vamos assumir que o localStorage tem o papel
      const storedUser = localStorage.getItem("danceflow_user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.role === 'partner' || parsedUser.role === 'admin' || parsedUser.role === 'super_admin') {
          setIsAuthorized(true)
        } else {
          toast({
            title: "Acesso restrito",
            description: "Esta área é apenas para afiliados.",
            variant: "destructive"
          })
          router.push("/portal/login")
        }
      } else {
        // Fallback se não tiver no localStorage. Pode ser necessário buscar o perfil do usuário
        // aqui para determinar a função. Por simplicidade, vamos redirecionar.
        toast({
          title: "Sessão inválida",
          description: "Por favor, faça login novamente.",
          variant: "destructive"
        })
        router.push("/portal/affiliate/login")
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router, toast])

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 tracking-widest uppercase">Carregando Painel do Afiliado...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav isAffiliate={true} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isAffiliate={true} // Nova prop para diferenciar a navegação
      />
      <main
        className={cn(
          "transition-all duration-300 min-h-screen pt-16 md:pt-0",
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-64"
        )}
      >
        {children}
      </main>
    </div>
  )
}
