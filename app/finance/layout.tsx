"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/components/providers/organization-provider"
import { supabase } from "@/lib/supabase"

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isLoading, studioId } = useOrganization()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Super Admin SEMPRE vai para o painel global /admin — nunca para o financeiro do estúdio
    const userStr = typeof window !== 'undefined' ? localStorage.getItem("danceflow_user") : null
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role === "super_admin") {
          router.replace("/admin")
          return
        }
      } catch {}
    }

    if (!isLoading) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          router.push("/login")
          return
        }

        const userRole = session.user.user_metadata?.role
        if (userRole !== 'finance' && userRole !== 'admin' && userRole !== 'super_admin') {
          router.push("/dashboard")
          return
        }

        setIsAuthorized(true)
      })
    }
  }, [isLoading, router])

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 tracking-widest uppercase">Portal Financeiro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav isFinance />
      <Sidebar
        isFinance
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
