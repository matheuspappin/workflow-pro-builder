"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MessageCircle, Send, Users, Bell, CheckCircle2, Zap } from "lucide-react"
import Link from "next/link"

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Phone className="w-6 h-6 text-emerald-500" />
          WhatsApp
        </h1>
        <p className="text-slate-500 text-sm mt-1">Comunicação automática com alunos e responsáveis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {
            icon: Bell,
            title: "Avisos de Falta",
            desc: "Notificação automática para responsáveis quando o aluno não comparecer.",
            color: "text-amber-500 bg-amber-100 dark:bg-amber-600/20",
            status: "Automático",
            statusColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400",
          },
          {
            icon: Send,
            title: "Cobranças de Mensalidade",
            desc: "Lembrete automático antes e após vencimento da mensalidade.",
            color: "text-violet-500 bg-violet-100 dark:bg-violet-600/20",
            status: "Automático",
            statusColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400",
          },
          {
            icon: MessageCircle,
            title: "Comunicados do Estúdio",
            desc: "Envie avisos de reposições, recitais e feriados para todos.",
            color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-600/20",
            status: "Manual",
            statusColor: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400",
          },
          {
            icon: Users,
            title: "Boas-vindas Automáticas",
            desc: "Mensagem de boas-vindas para novos alunos matriculados.",
            color: "text-pink-500 bg-pink-100 dark:bg-pink-600/20",
            status: "Automático",
            statusColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400",
          },
          {
            icon: CheckCircle2,
            title: "Confirmação de Aula",
            desc: "Lembrete 24h antes da aula para reduzir faltas.",
            color: "text-teal-500 bg-teal-100 dark:bg-teal-600/20",
            status: "Automático",
            statusColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400",
          },
          {
            icon: Zap,
            title: "Campanhas Personalizadas",
            desc: "Crie disparos customizados para segmentos de alunos.",
            color: "text-orange-500 bg-orange-100 dark:bg-orange-600/20",
            status: "Em breve",
            statusColor: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
          },
        ].map((item) => (
          <Card key={item.title} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${item.statusColor}`}>
                  {item.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-emerald-900 to-teal-900 border-0 text-white overflow-hidden">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black mb-2">Conectar WhatsApp</h3>
            <p className="text-emerald-200 text-sm max-w-sm">
              Escaneie o QR Code para vincular seu WhatsApp e ativar todos os envios automáticos.
            </p>
          </div>
          <Link href="/solutions/estudio-de-danca/dashboard/configuracoes">
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-black rounded-xl px-8 h-12 shadow-lg">
              <Phone className="w-5 h-5 mr-2" />
              Conectar Agora
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
