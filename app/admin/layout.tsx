"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userStr = localStorage.getItem("danceflow_user")
    if (!userStr) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userStr)
    
    // Proteção de Super Admin Estrita
    if (user.role !== "super_admin") {
      router.push("/dashboard")
      return
    }
  }, [router])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden h-16 bg-black border-b border-white/10 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <span className="text-white font-black text-xs">AK</span>
          </div>
          <span className="text-white font-black text-sm tracking-tight">AKAAI HUB</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setMobileOpen(true)}
          className="text-white/60 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen flex flex-col",
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
        )}
      >
        {children}
      </main>
    </div>
  )
}
