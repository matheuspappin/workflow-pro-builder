"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Music, LayoutDashboard, Calendar, DollarSign, UserCircle, LogOut, Loader2, Zap } from "lucide-react"

const navItems = [
  { href: "/solutions/estudio-de-danca/student",            label: "Início",        icon: LayoutDashboard },
  { href: "/solutions/estudio-de-danca/student/turmas",     label: "Minhas Turmas", icon: Calendar },
  { href: "/solutions/estudio-de-danca/student/financeiro", label: "Créditos",      icon: DollarSign },
  { href: "/solutions/estudio-de-danca/student/perfil",     label: "Meu Perfil",    icon: UserCircle },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/solutions/estudio-de-danca/login")
        return
      }
      const role = session.user.user_metadata?.role
      if (role !== "student" && role !== "super_admin") {
        router.push("/solutions/estudio-de-danca/login")
        return
      }
      setAuthorized(true)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/solutions/estudio-de-danca/login")
        setAuthorized(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  // Carregar créditos e business model quando autorizado
  useEffect(() => {
    if (!authorized) return

    let cleanup: (() => void) | undefined

    async function loadCredits() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const studioId = user.user_metadata?.studio_id
      if (!studioId) return

      const { data: creditsRow } = await supabase
        .from('student_lesson_credits')
        .select('remaining_credits')
        .eq('student_id', user.id)
        .eq('studio_id', studioId)
        .maybeSingle()

      setCredits(creditsRow?.remaining_credits ?? 0)

      const channel = supabase
        .channel(`layout-credits-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'student_lesson_credits',
          filter: `student_id=eq.${user.id}`,
        }, (payload: any) => {
          if (payload.new?.remaining_credits != null) {
            setCredits(payload.new.remaining_credits)
          }
        })
        .subscribe()

      cleanup = () => supabase.removeChannel(channel)
    }

    loadCredits()
    return () => cleanup?.()
  }, [authorized])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      await supabase.auth.signOut()
      localStorage.removeItem("danceflow_user")
      localStorage.removeItem("danceflow_student_vinculo")
      router.push("/solutions/estudio-de-danca/login")
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
        <p className="text-slate-400 text-sm font-medium">Carregando...</p>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between gap-4 px-4 md:px-6 bg-slate-950/95 border-b border-white/10 backdrop-blur-md">
        <Link href="/solutions/estudio-de-danca/student" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/25">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-white tracking-tighter text-base block leading-tight">DanceFlow</span>
            <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Portal do Aluno</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/solutions/estudio-de-danca/student/financeiro"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 hover:text-white transition-all border border-violet-500/20"
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span className="font-black text-sm tabular-nums">
              {credits != null ? credits : "—"}
            </span>
            <span className="text-[10px] font-bold uppercase opacity-80">créditos</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 hover:text-violet-400 hover:bg-violet-600/10 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sair
          </button>
        </div>
      </header>

      {/* Desktop nav */}
      <nav className="hidden md:flex bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/10 px-4 md:px-6">
        <div className="flex gap-1 max-w-4xl w-full">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/solutions/estudio-de-danca/student" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 -mb-px transition-all",
                  isActive
                    ? "text-violet-600 border-violet-600"
                    : "text-slate-500 hover:text-violet-600 border-transparent hover:border-violet-600/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <main className="flex-1 w-full p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/solutions/estudio-de-danca/student" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors",
                isActive
                  ? "text-violet-600 bg-violet-50/50 dark:bg-violet-600/10"
                  : "text-slate-400 hover:text-violet-600"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
