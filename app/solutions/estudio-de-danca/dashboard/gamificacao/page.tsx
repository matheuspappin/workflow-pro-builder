"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Zap, Award, TrendingUp, Users, Medal, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

const RANKING = [
  { pos: 1, name: "Ana Souza",    points: 1240, badge: "🥇", color: "text-amber-500" },
  { pos: 2, name: "Beatriz Lima", points: 1180, badge: "🥈", color: "text-slate-400" },
  { pos: 3, name: "Clara Dias",   points: 1050, badge: "🥉", color: "text-amber-700" },
  { pos: 4, name: "Diana Costa",  points: 940,  badge: "4°",  color: "text-slate-500" },
  { pos: 5, name: "Elena Freitas",points: 890,  badge: "5°",  color: "text-slate-500" },
]

const ACHIEVEMENTS = [
  { icon: Star,      label: "Frequência Perfeita",  desc: "Nunca faltou em um mês",       color: "text-amber-500 bg-amber-100 dark:bg-amber-600/20",   points: 100 },
  { icon: Zap,       label: "Primeiro Mês",          desc: "Completou o primeiro mês",      color: "text-violet-500 bg-violet-100 dark:bg-violet-600/20", points: 50  },
  { icon: TrendingUp,label: "Em Evolução",           desc: "5 semanas consecutivas",        color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-600/20",points: 75 },
  { icon: Award,     label: "Destaque da Turma",     desc: "Melhor frequência da turma",    color: "text-pink-500 bg-pink-100 dark:bg-pink-600/20",       points: 150 },
  { icon: Crown,     label: "Campeã do Mês",         desc: "1º lugar no ranking mensal",    color: "text-amber-500 bg-amber-100 dark:bg-amber-600/20",   points: 200 },
  { icon: Medal,     label: "6 Meses de Dança",      desc: "Meia ano sem parar",            color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-600/20", points: 300 },
]

export default function GamificacaoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          Gamificação
        </h1>
        <p className="text-slate-500 text-sm mt-1">Rankings, conquistas e engajamento dos alunos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking */}
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
              <Trophy className="w-5 h-5 text-amber-500" />
              Ranking Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {RANKING.map((item) => (
              <div
                key={item.pos}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all",
                  item.pos <= 3
                    ? "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-600/10 dark:to-transparent border border-amber-100 dark:border-amber-600/20"
                    : "bg-slate-50 dark:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{item.badge}</span>
                  <div className="w-9 h-9 rounded-full bg-violet-600/10 flex items-center justify-center font-black text-violet-600 text-sm">
                    {item.name[0]}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span className={cn("font-black text-sm", item.color)}>{item.points} pts</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conquistas */}
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
              <Award className="w-5 h-5 text-pink-500" />
              Conquistas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ACHIEVEMENTS.map((ach) => (
              <div key={ach.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", ach.color)}>
                    <ach.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{ach.label}</p>
                    <p className="text-xs text-slate-500">{ach.desc}</p>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400 border-0 text-xs font-black">
                  +{ach.points}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Alunos Ativos", value: "124", icon: Users, color: "text-violet-600 bg-violet-100 dark:bg-violet-600/20" },
          { label: "Conquistas Desbloqueadas", value: "348", icon: Award, color: "text-pink-600 bg-pink-100 dark:bg-pink-600/20" },
          { label: "Pontos Distribuídos", value: "42k", icon: Star, color: "text-amber-600 bg-amber-100 dark:bg-amber-600/20" },
          { label: "Taxa de Engajamento", value: "94%", icon: TrendingUp, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-600/20" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
            <CardContent className="p-5 text-center">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3", s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
