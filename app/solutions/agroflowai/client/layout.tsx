"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Leaf, LogOut, Home, FileText, MapPin, Bell, User, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getSessionKey, clearLocalUser } from "@/lib/constants/storage-keys"

const AGRO_SESSION_KEY = getSessionKey('agroflowai')

const CLIENT_NAV = [
  { href: "/solutions/agroflowai/client", label: "Início", icon: Home },
  { href: "/solutions/agroflowai/client/laudos", label: "Meus Laudos", icon: FileText },
  { href: "/solutions/agroflowai/client/propriedades", label: "Propriedades", icon: MapPin },
  { href: "/solutions/agroflowai/client/notificacoes", label: "Notificações", icon: Bell },
  { href: "/solutions/agroflowai/client/perfil", label: "Meu Perfil", icon: User },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const userStr = typeof window !== "undefined" ? localStorage.getItem(AGRO_SESSION_KEY) : null
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role === "super_admin") { router.replace("/admin"); return }
        if (user.role === "admin" || user.role === "engineer" || user.role === "technician") {
          router.replace("/solutions/agroflowai/dashboard"); return
        }
        setUserName(user.name || "")
      } catch {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/solutions/agroflowai/login")
        return
      }
      const role = session.user.user_metadata?.role
      if (role === "super_admin") { router.replace("/admin"); return }
      if (role === "admin" || role === "engineer" || role === "technician") {
        router.replace("/solutions/agroflowai/dashboard"); return
      }
      if (!userName) setUserName(session.user.user_metadata?.name || session.user.email?.split("@")[0] || "")
      setAuthorized(true)
      setLoading(false)
    })
  }, [router, userName])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await supabase.auth.signOut()
    clearLocalUser('agroflowai')
    router.push("/solutions/agroflowai/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center">
            <Leaf className="w-7 h-7 text-white animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Carregando portal...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {CLIENT_NAV.map(item => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => mobile && setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold",
              "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-64 bg-slate-950 border-r border-white/10 z-50">
        <div className="p-5 border-b border-white/10">
          <Link href="/solutions/agroflowai/client" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm tracking-tighter leading-none">
                Agro<span className="text-emerald-400">Flow</span>AI
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Portal do Proprietário</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItems />
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName || "Proprietário"}</p>
              <p className="text-xs text-slate-500">Cliente / Proprietário Rural</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <Link href="/solutions/agroflowai/client" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white text-sm tracking-tighter">
            Agro<span className="text-emerald-400">Flow</span>AI
          </span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400 hover:text-white p-1">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-slate-950 border-b border-white/10 p-4 space-y-1" onClick={e => e.stopPropagation()}>
            <NavItems mobile />
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 w-full">
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
