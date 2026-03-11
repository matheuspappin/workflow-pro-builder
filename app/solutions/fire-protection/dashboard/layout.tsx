"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  FireExtinguisher,
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Building2,
  Bell,
  UserCircle,
  Loader2,
  Package,
  Calendar,
  DollarSign,
  Phone,
  MessageSquare,
  TrendingUp,
  ShoppingCart,
  UserCheck,
  HardHat,
  Ruler,
} from "lucide-react"

const navGroups = [
  {
    label: "Operacional",
    items: [
      { href: "/solutions/fire-protection/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/solutions/fire-protection/dashboard/clientes", label: "Clientes / Edificações", icon: Building2 },
      { href: "/solutions/fire-protection/dashboard/tecnicos", label: "Técnicos", icon: Wrench },
      { href: "/solutions/fire-protection/dashboard/engenheiros", label: "Engenheiros", icon: HardHat },
      { href: "/solutions/fire-protection/dashboard/arquitetos", label: "Arquitetos", icon: Ruler },
      { href: "/solutions/fire-protection/dashboard/os", label: "Ordens de Serviço", icon: ClipboardList },
      { href: "/solutions/fire-protection/dashboard/extintores", label: "Extintores", icon: Package },
      { href: "/solutions/fire-protection/dashboard/vistorias", label: "Vistorias", icon: Calendar },
    ],
  },
  {
    label: "Comercial",
    items: [
      { href: "/solutions/fire-protection/dashboard/vendas", label: "PDV — Vendas", icon: ShoppingCart },
      { href: "/solutions/fire-protection/dashboard/portal-vendedor", label: "Portal do Vendedor", icon: UserCheck },
      { href: "/solutions/fire-protection/dashboard/leads", label: "Leads / CRM", icon: TrendingUp },
      { href: "/solutions/fire-protection/dashboard/whatsapp", label: "WhatsApp", icon: Phone },
      { href: "/solutions/fire-protection/dashboard/chat", label: "Chat IA", icon: MessageSquare },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/solutions/fire-protection/dashboard/financeiro", label: "Financeiro", icon: DollarSign },
      { href: "/solutions/fire-protection/dashboard/planos", label: "Planos e Assinatura", icon: Package },
      { href: "/solutions/fire-protection/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/solutions/fire-protection/dashboard/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
]

const navItems = navGroups.flatMap((g) => g.items)

function FireSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await supabase.auth.signOut()
    localStorage.removeItem("danceflow_user")
    router.push("/solutions/fire-protection")
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
          <Link href="/solutions/fire-protection" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <FireExtinguisher className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white tracking-tighter text-sm">
              Fire<span className="text-red-400">Control</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center mx-auto">
            <FireExtinguisher className="w-4 h-4 text-white" />
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
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                      isActive
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : "text-white/50 hover:text-white hover:bg-white/5",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
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
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-red-400 hover:bg-red-600/10 transition-all w-full",
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

function FireMobileHeader({ onOpen, onLogout }: { onOpen: () => void; onLogout: () => void }) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-white/10 flex items-center justify-between px-4 z-40">
      <Link href="/solutions/fire-protection" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
          <FireExtinguisher className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-white tracking-tighter text-sm">
          Fire<span className="text-red-400">Control</span>
        </span>
      </Link>
      <div className="flex items-center gap-1">
        <button
          onClick={onLogout}
          className="text-white/50 hover:text-red-400 p-2 rounded-lg hover:bg-red-600/10 transition-all"
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

export default function FireDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    // Super Admin SEMPRE vai para o painel global /admin — nunca para Fire Control
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/solutions/fire-protection/login")
      } else {
        const role = session.user.user_metadata?.role
        if (role === 'super_admin') {
          router.replace("/admin")
          return
        }
        if (role === 'engineer') {
          router.push("/solutions/fire-protection/engineer")
          return
        }
        if (role === 'architect') {
          router.push("/solutions/fire-protection/architect")
          return
        }
        if (role === 'technician' || role === 'teacher') {
          router.push("/solutions/fire-protection/technician")
          return
        }
        if (role === 'student') {
          router.push("/solutions/fire-protection/client")
          return
        }
        setAuthorized(true)
      }
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await supabase.auth.signOut()
    localStorage.removeItem("danceflow_user")
    router.push("/solutions/fire-protection")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <FireSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 bg-slate-950 border-r border-white/10 w-72">
          <div className="flex items-center gap-2 p-4 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <FireExtinguisher className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white tracking-tighter text-sm">
              Fire<span className="text-red-400">Control</span>
            </span>
          </div>
          <nav className="p-2 overflow-y-auto max-h-[calc(100vh-80px)]">
            {navGroups.map((group, gi) => (
              <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <FireMobileHeader onOpen={() => setMobileOpen(true)} onLogout={handleLogout} />

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
