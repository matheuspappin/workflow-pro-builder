"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/components/providers/organization-provider"
import { supabase } from "@/lib/supabase"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isLoading, studioId } = useOrganization()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!studioId) {
        // Se carregou e não tem studioId, verifica se tem sessão ativa
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push("/login")
            } else {
                // Tem sessão mas não tem studioId (pode ser erro de cadastro ou super admin global)
                // Vamos deixar passar para não travar, mas idealmente redirecionaria para /setup
                setIsAuthorized(true)
            }
        })
      } else {
        setIsAuthorized(true)
      }
    }
  }, [isLoading, studioId, router])

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 tracking-widest uppercase">Carregando Sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
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
