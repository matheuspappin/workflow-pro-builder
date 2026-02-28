"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users, GraduationCap, Calendar, DollarSign, TrendingUp,
  Plus, ArrowRight, Music, Copy, Check, UserPlus, Trophy,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function DanceStudioDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [studioSlug, setStudioSlug] = useState("")
  const [copyingRole, setCopyingRole] = useState<string | null>(null)
  const [stats, setStats] = useState({
    alunos: 0,
    professores: 0,
    turmas: 0,
    faturamento: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const stored = localStorage.getItem("danceflow_user")
      if (stored) {
        const parsed = JSON.parse(stored)
        const slug = parsed.studioSlug || parsed.studio_slug || (parsed.studio && parsed.studio.slug) || ""
        setStudioSlug(slug)

        const sid = parsed.studioId || parsed.studio_id || user?.user_metadata?.studio_id
        if (sid) {
          try {
            const [studentsRes, teachersRes, classesRes] = await Promise.all([
              fetch(`/api/dance-studio/students?studioId=${sid}`).then(r => r.json()).catch(() => []),
              fetch(`/api/dance-studio/teachers?studioId=${sid}`).then(r => r.json()).catch(() => []),
              fetch(`/api/dance-studio/classes?studioId=${sid}`).then(r => r.json()).catch(() => ({ classes: [] })),
            ])
            setStats({
              alunos: Array.isArray(studentsRes) ? studentsRes.length : 0,
              professores: Array.isArray(teachersRes) ? teachersRes.length : 0,
              turmas: Array.isArray(classesRes?.classes) ? classesRes.classes.length : 0,
              faturamento: 0,
            })
          } catch {}
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleCopyLink = async (role: string) => {
    if (!studioSlug) {
      toast({ title: "Slug não encontrado", description: "Faça logout e entre novamente.", variant: "destructive" })
      return
    }
    const link = `${window.location.origin}/s/${studioSlug}/join?role=${role}`
    try {
      await navigator.clipboard.writeText(link)
      setCopyingRole(role)
      toast({ title: "Link copiado!", description: `Convite copiado com sucesso.` })
      setTimeout(() => setCopyingRole(null), 2000)
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" })
    }
  }

  const statCards = [
    {
      label: "Alunos Ativos",
      value: loading ? "..." : String(stats.alunos),
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-600/10",
      border: "border-l-violet-600",
      href: "/solutions/estudio-de-danca/dashboard/alunos"
    },
    {
      label: "Professores",
      value: loading ? "..." : String(stats.professores),
      icon: GraduationCap,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      border: "border-l-pink-500",
      href: "/solutions/estudio-de-danca/dashboard/professores"
    },
    {
      label: "Turmas Ativas",
      value: loading ? "..." : String(stats.turmas),
      icon: Calendar,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-l-indigo-500",
      href: "/solutions/estudio-de-danca/dashboard/turmas"
    },
    {
      label: "Faturamento (mês)",
      value: loading ? "..." : `R$ ${stats.faturamento.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-l-emerald-500",
      href: "/solutions/estudio-de-danca/dashboard/financeiro"
    },
  ]

  const quickActions = [
    { label: "Novo Aluno", sub: "Matricular aluno", href: "/solutions/estudio-de-danca/dashboard/alunos", icon: UserPlus, color: "bg-violet-600 hover:bg-violet-700" },
    { label: "Nova Turma", sub: "Criar turma de dança", href: "/solutions/estudio-de-danca/dashboard/turmas", icon: Calendar, color: "bg-pink-600 hover:bg-pink-700" },
    { label: "Financeiro", sub: "Cobranças e pagamentos", href: "/solutions/estudio-de-danca/dashboard/financeiro", icon: DollarSign, color: "bg-emerald-600 hover:bg-emerald-700" },
  ]

  const invites = [
    { role: "professional", label: "Convidar Professor", icon: GraduationCap, color: "text-pink-500", bg: "bg-pink-500/10" },
    { role: "client", label: "Convidar Aluno", icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Olá, {user?.user_metadata?.name || "Admin"} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Painel de Controle — Estúdio de Dança
          </p>
        </div>
        <Link href="/solutions/estudio-de-danca/dashboard/alunos">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20">
            <Plus className="w-4 h-4 mr-2" />
            Novo Aluno
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className={cn("text-white border-none shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]", action.color)}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-base">{action.label}</p>
                    <p className="text-xs text-white/70">{action.sub}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 opacity-60" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={cn("border-l-4 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer", stat.border)}>
              <CardContent className="p-5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <p className={cn("text-3xl font-black", stat.color)}>{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Aulas */}
        <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                Turmas de Hoje
              </CardTitle>
              <CardDescription>Aulas programadas para hoje</CardDescription>
            </div>
            <Link href="/solutions/estudio-de-danca/dashboard/turmas">
              <Button variant="ghost" size="sm" className="text-violet-600 font-bold text-xs">
                Ver todas <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-slate-400">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma turma cadastrada ainda</p>
              <Link href="/solutions/estudio-de-danca/dashboard/turmas">
                <Button className="mt-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Criar primeira turma
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Convites e Gamificação */}
        <div className="space-y-4">
          {/* Destaque Gamificação */}
          <Card className="bg-gradient-to-br from-violet-600 to-pink-600 text-white border-none shadow-lg">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">Gamificação de Alunos</p>
                <p className="text-sm text-white/70">Rankings, conquistas e engajamento</p>
              </div>
              <Link href="/solutions/estudio-de-danca/dashboard/gamificacao">
                <Button size="sm" variant="secondary" className="font-bold rounded-xl">
                  Ver
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Links de convite */}
          {studioSlug && (
            <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Convites de Acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.role} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", inv.bg)}>
                        <inv.icon className={cn("w-4 h-4", inv.color)} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.label}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs font-bold rounded-lg"
                      onClick={() => handleCopyLink(inv.role)}
                    >
                      {copyingRole === inv.role ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copyingRole === inv.role ? "Copiado" : "Copiar link"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Leads */}
          <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-indigo-200 dark:border-indigo-600/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Captação de Alunos</p>
                <p className="text-sm text-slate-500">Gerencie leads e novas matrículas</p>
              </div>
              <Link href="/solutions/estudio-de-danca/dashboard/leads" className="ml-auto">
                <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl">
                  Ver
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
