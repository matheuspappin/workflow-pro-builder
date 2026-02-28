"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, ClipboardList } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const MY_CLASSES = [
  { id: "1", name: "Ballet Infantil",       modality: "Ballet",       schedule: "Seg/Qua 09:00", students: 12, level: "Iniciante",     color: "border-l-pink-500",   gradient: "from-pink-500 to-rose-500" },
  { id: "2", name: "Jazz Adulto",           modality: "Jazz",         schedule: "Ter/Qui 19:00", students: 8,  level: "Intermediário", color: "border-l-violet-500", gradient: "from-violet-500 to-purple-500" },
  { id: "3", name: "Contemporâneo Avançado",modality: "Contemporâneo",schedule: "Sex 18:00",      students: 15, level: "Avançado",     color: "border-l-indigo-500", gradient: "from-indigo-500 to-blue-500" },
]

export default function TeacherTurmasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-pink-600" />
          Minhas Turmas
        </h1>
        <p className="text-slate-500 text-sm mt-1">Turmas sob sua responsabilidade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MY_CLASSES.map((turma) => (
          <Card key={turma.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-lg transition-all overflow-hidden">
            <div className={cn("h-2 bg-gradient-to-r", turma.gradient)} />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">{turma.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{turma.modality}</p>
                </div>
                <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-600/20 dark:text-pink-400 border-0 text-xs font-bold">
                  {turma.level}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <span>{turma.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" />
                  <span>{turma.students} alunos</span>
                </div>
              </div>

              <Link href="/solutions/estudio-de-danca/teacher/chamada">
                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-sm">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Fazer Chamada
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
