"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  FireExtinguisher,
  LayoutDashboard,
  FolderKanban,
  UserCircle,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Ruler,
} from "lucide-react"

const navItems = [
  { href: "/solutions/fire-protection/architect", label: "Dashboard", icon: LayoutDashboard },
  { href: "/solutions/fire-protection/architect/projetos", label: "Meus Projetos", icon: FolderKanban },
  { href: "/solutions/fire-protection/architect/perfil", label: "Meu Perfil", icon: UserCircle },
]

export default function FireArchitectLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/solutions/fire-protection/login")
        return
      }
      const role = session.user.user_metadata?.role
      if (role !== 'architect' && role !== 'super_admin') {
        router.push("/solutions/fire-protection/login")
        return
      }
      setAuthorized(true)
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await supabase.auth.signOut()
    localStorage.removeItem("danceflow_user")
    router.push("/solutions/fire-protection/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!authorized) return null

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <Link href="/solutions/fire-protection" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <FireExtinguisher className="w-4 h-4 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <span className="font-black text-white tracking-tighter text-xs block">FireControl</span>
              <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Arquiteto</span>
            </div>
          )}
        </Link>
        {!isMobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="text-white/40 hover:text-white transition-colors">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
              pathname === item.href
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-white/50 hover:text-white hover:bg-white/5",
              collapsed && !isMobile && "justify-center"
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-red-400 hover:bg-red-600/10 transition-all w-full",
            collapsed && !isMobile && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Sair</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed top-0 left-0 h-full bg-slate-950 border-r border-white/10 z-50 transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-white/10 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Ruler className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white text-sm">FireControl <span className="text-violet-400">Arq</span></span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 bg-slate-950 border-r border-white/10 w-72">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>

      <main
        className={cn(
          "transition-all duration-300 min-h-screen pt-16 md:pt-0",
          collapsed ? "md:ml-[72px]" : "md:ml-64"
        )}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
