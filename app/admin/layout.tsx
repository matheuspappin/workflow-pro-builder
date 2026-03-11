import React from "react"
import { redirect } from "next/navigation"
import { AdminSidebarClient } from "@/components/admin/admin-sidebar-client"
import { AdminHeader } from "@/components/admin/admin-header"
import { checkSuperAdminDetailed } from "@/lib/actions/super-admin"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificação server-side segura
  const { isAdmin } = await checkSuperAdminDetailed()
  
  if (!isAdmin) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminSidebarClient />
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden h-16 bg-black border-b border-white/10 flex items-center px-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <span className="text-white font-black text-xs">AK</span>
          </div>
          <span className="text-white font-black text-sm tracking-tight">AKAAI HUB</span>
        </div>
      </div>

      <main className="min-h-screen flex flex-col lg:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
