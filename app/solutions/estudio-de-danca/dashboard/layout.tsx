"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Music, LogOut, Menu, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { getFilteredDanceStudioNav } from "@/config/dance-studio-nav"
import { getSessionKey, clearLocalUser } from "@/lib/constants/storage-keys"

const DANCE_SESSION_KEY = getSessionKey('estudio-de-danca')

function DanceSidebar({
  collapsed,
  onToggle,
  navGroups,
}: {
  collapsed: boolean
  onToggle: () => void
  navGroups: ReturnType<typeof getFilteredDanceStudioNav>
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await supabase.auth.signOut()
    clearLocalUser('estudio-de-danca')
    router.push("/solutions/estudio-de-danca")
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed top-0 left-0 h-full bg-slate-950 border-r border-white/10 z-50 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/solutions/estudio-de-danca" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white tracking-tighter text-sm">
              Dance<span className="text-violet-400">Flow</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center mx-auto">
            <Music className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn("text-white/40 hover:text-white transition-colors", collapsed && "mx-auto mt-2")}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">
                {group.label}
              </p>
            )}
            {gi > 0 && collapsed && <div className="my-2 border-t border-white/10" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                      isActive
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                        : "text-white/50 hover:text-white hover:bg-white/5",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-violet-400 hover:bg-violet-600/10 transition-all w-full",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}

function DanceMobileHeader({ onOpen, onLogout }: { onOpen: () => void; onLogout: () => void }) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-white/10 flex items-center justify-between px-4 z-40">
      <Link href="/solutions/estudio-de-danca" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <Music className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-white tracking-tighter text-sm">
          Dance<span className="text-violet-400">Flow</span>
        </span>
      </Link>
      <div className="flex items-center gap-1">
        <button
          onClick={onLogout}
          className="text-white/50 hover:text-violet-400 p-2 rounded-lg hover:bg-violet-600/10 transition-all"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
        <button onClick={onOpen} className="text-white/60 hover:text-white p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

export default function DanceDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean> | undefined>(undefined)
  const pathname = usePathname()
  const navGroups = getFilteredDanceStudioNav(enabledModules)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Módulos controlados 100% pelo admin via planos (organization_settings.enabled_modules)
  useEffect(() => {
    if (!authorized) return
    const loadConfig = async () => {
      let studioId: string | null = null
      const stored = typeof window !== 'undefined' ? localStorage.getItem(DANCE_SESSION_KEY) : null
      if (stored) {
        try {
          const user = JSON.parse(stored)
          studioId = user.studio_id || user.studioId || null
        } catch {}
      }
      if (!studioId) {
        const { data: { session } } = await supabase.auth.getSession()
        studioId = session?.user?.user_metadata?.studio_id ?? null
      }
      if (!studioId) return
      try {
        const res = await fetch(`/api/dance-studio/config?studioId=${encodeURIComponent(studioId)}`, { credentials: 'include' })
        const data = await res.json()
        if (res.ok && data.enabledModules && Object.keys(data.enabledModules).length > 0) {
          setEnabledModules(data.enabledModules)
        }
      } catch {}
    }
    loadConfig()
  }, [authorized])

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem(DANCE_SESSION_KEY) : null
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role === "super_admin") {
          router.replace("/admin")
          return
        }
      } catch {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/solutions/estudio-de-danca/login")
        return
      }
      const role = session.user.user_metadata?.role
      if (role === 'super_admin') {
        router.replace("/admin")
        return
      }
      if (role === 'student') {
        router.push("/solutions/estudio-de-danca/student")
        return
      }
      if (role === 'teacher') {
        router.push("/solutions/estudio-de-danca/teacher")
        return
      }
      setAuthorized(true)
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await supabase.auth.signOut()
    clearLocalUser('estudio-de-danca')
    router.push("/solutions/estudio-de-danca")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DanceSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} navGroups={navGroups} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 bg-slate-950 border-r border-white/10 w-72">
          <div className="flex items-center gap-2 p-4 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white tracking-tighter text-sm">
              Dance<span className="text-violet-400">Flow</span>
            </span>
          </div>
          <nav className="p-2 overflow-y-auto max-h-[calc(100vh-80px)]">
            {navGroups.map((group, gi) => (
              <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <DanceMobileHeader onOpen={() => setMobileOpen(true)} onLogout={handleLogout} />

      <main
        className={cn(
          "transition-all duration-300 min-h-screen pt-16 md:pt-0",
          collapsed ? "md:ml-[72px]" : "md:ml-64"
        )}
      >
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
