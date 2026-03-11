"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/components/providers/organization-provider"
import { supabase } from "@/lib/supabase"

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Skeleton (Desktop) */}
      <div className="w-64 bg-slate-950 border-r border-white/10 hidden md:flex flex-col p-4 space-y-6 z-50">
        <div className="h-10 bg-white/10 rounded-xl animate-pulse w-3/4" />
        <div className="space-y-2 mt-4">
           {[1,2,3,4,5,6,7,8].map(i => (
             <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
           ))}
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Mobile Header Skeleton */}
        <div className="md:hidden h-16 border-b flex items-center px-4 gap-4">
          <div className="w-8 h-8 bg-slate-200 rounded animate-pulse" />
          <div className="h-6 bg-slate-200 rounded animate-pulse w-32" />
        </div>

        <main className="p-6 space-y-8 animate-in fade-in duration-500">
           <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-48 mb-6" />
           
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
           </div>

           <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </main>
      </div>
    </div>
  )
}

export function DashboardSkeletonClient({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isLoading, studioId, niche } = useOrganization()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!studioId) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push("/login")
            } else {
                setIsAuthorized(true)
            }
        })
      } else {
        setIsAuthorized(true)
      }
    }
  }, [isLoading, studioId, router])

  // Melhoria de UX: Skeleton Screen em vez de Spinner centralizado
  if (isLoading || !isAuthorized) {
    return <DashboardSkeleton />
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
          "transition-all duration-300 min-h-screen pt-16 md:pt-0 pointer-events-auto relative z-10",
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-64"
        )}
      >
        {children}
      </main>
    </div>
  )
}
