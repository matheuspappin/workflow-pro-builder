"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import {
  FireExtinguisher,
  LayoutDashboard,
  Package,
  FileText,
  UserCircle,
  LogOut,
  Loader2,
} from "lucide-react"

const navItems = [
  { href: "/solutions/fire-protection/client", label: "Início", icon: LayoutDashboard },
  { href: "/solutions/fire-protection/client/extintores", label: "Meus Extintores", icon: Package },
  { href: "/solutions/fire-protection/client/documentos", label: "Documentos", icon: FileText },
  { href: "/solutions/fire-protection/client/perfil", label: "Meu Perfil", icon: UserCircle },
]

export default function FireClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const checkAuth = (session: { user: { user_metadata?: { role?: string } } } | null) => {
    if (!session) {
      router.push("/solutions/fire-protection/login")
      return false
    }
    const role = session.user.user_metadata?.role
    if (role !== "student" && role !== "super_admin") {
      router.push("/solutions/fire-protection/login")
      return false
    }
    setAuthorized(true)
    return true
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuth(session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/solutions/fire-protection/login")
        setAuthorized(false)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      await supabase.auth.signOut()
      localStorage.removeItem("danceflow_user")
      router.push("/solutions/fire-protection/login")
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        <p className="text-slate-400 text-sm font-medium">Carregando...</p>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header - sticky com backdrop blur */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between gap-4 px-4 md:px-6 bg-slate-950/95 dark:bg-slate-950 border-b border-white/10 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/80">
        <Link
          href="/solutions/fire-protection/client"
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/25 group-hover:shadow-red-600/40 transition-shadow">
            <FireExtinguisher className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-white tracking-tighter text-base block leading-tight">
              FireControl
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              Portal do Cliente
            </span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-600/10 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          Sair
        </button>
      </header>

      {/* Desktop: tabs horizontais com estado ativo */}
      <nav className="hidden md:flex bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/10 px-4 md:px-6">
        <div className="flex gap-1 max-w-4xl w-full">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/solutions/fire-protection/client" &&
                pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 -mb-px transition-all",
                  isActive
                    ? "text-red-600 border-red-600 dark:text-red-500 dark:border-red-500"
                    : "text-slate-500 hover:text-red-600 border-transparent hover:border-red-600/50 dark:text-slate-400 dark:hover:text-red-500"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Conteúdo principal - padding inferior no mobile para não ficar sob o bottom nav */}
      <main className="flex-1 w-full p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>

      {/* Mobile: bottom nav com estado ativo e safe area */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/solutions/fire-protection/client" &&
              pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors",
                isActive
                  ? "text-red-600 dark:text-red-500 bg-red-50/50 dark:bg-red-600/10"
                  : "text-slate-400 hover:text-red-600 dark:hover:text-red-500"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-sm")} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
