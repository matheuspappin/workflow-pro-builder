"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, UserCheck, UserX, Phone, Mail, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [studioId, setStudioId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid)

      if (sid) {
        try {
          const res = await fetch(`/api/fire-protection/customers?studioId=${sid}`)
          const data = await res.json()
          setAlunos(Array.isArray(data) ? data : [])
        } catch {
          toast({ title: "Erro ao carregar alunos", variant: "destructive" })
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = alunos.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" />
            Alunos
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie todos os alunos matriculados</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar aluno por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 h-11 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              {search ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
            </h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm">
              {search
                ? "Tente buscar por outro nome ou e-mail."
                : "Comece matriculando seu primeiro aluno ou compartilhe o link de cadastro."}
            </p>
            {!search && (
              <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Matricular Primeiro Aluno
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((aluno) => (
            <Card key={aluno.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-600/10 flex items-center justify-center font-black text-violet-600 text-lg flex-shrink-0">
                    {aluno.name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{aluno.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {aluno.email && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="w-3 h-3" /> {aluno.email}
                        </span>
                      )}
                      {aluno.phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {aluno.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    className={cn(
                      "text-xs font-bold border-0",
                      aluno.status === 'active' || !aluno.status
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {aluno.status === 'active' || !aluno.status ? (
                      <><UserCheck className="w-3 h-3 mr-1" />Ativo</>
                    ) : (
                      <><UserX className="w-3 h-3 mr-1" />Inativo</>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
