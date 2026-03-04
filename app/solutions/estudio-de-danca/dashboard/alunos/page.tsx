"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, UserCheck, UserX, Phone, Mail, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [studioId, setStudioId] = useState<string | null>(null)
  const [businessModel, setBusinessModel] = useState<'CREDIT' | 'MONETARY'>('MONETARY')
  const [editStudent, setEditStudent] = useState<any>(null)
  const [studentCredits, setStudentCredits] = useState<{remaining: number, id?: string} | null>(null)
  const [adjustAmount, setAdjustAmount] = useState<number>(0)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid)

      if (sid) {
        try {
          // Carregar business model
          const { data: studio } = await supabase
            .from('studios')
            .select('business_model')
            .eq('id', sid)
            .single()
          setBusinessModel(studio?.business_model || 'MONETARY')

          // Carregar alunos com créditos se for modelo CREDIT
          if (studio?.business_model === 'CREDIT') {
            const { data: studentsData, error } = await supabase
              .from('students')
              .select(`
                *,
                student_lesson_credits (
                  remaining_credits,
                  total_credits,
                  expiry_date
                )
              `)
              .eq('studio_id', sid)
              .order('name')
            
            if (!error && studentsData) {
              setAlunos(studentsData.map((student: any) => ({
                ...student,
                credits: student.student_lesson_credits?.[0]?.remaining_credits || 0,
                totalCredits: student.student_lesson_credits?.[0]?.total_credits || 0,
                expiryDate: student.student_lesson_credits?.[0]?.expiry_date
              })))
            }
          } else {
            // Modelo MONETARY - carregar alunos sem créditos
            const res = await fetch(`/api/fire-protection/customers?studioId=${sid}`)
            const data = await res.json()
            setAlunos(Array.isArray(data) ? data : [])
          }
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

  const getStatusBadge = (credits: number = 0, expiryDate?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = expiryDate ? new Date(expiryDate) : null;
    const isExpired = expiry && expiry < today;

    if (isExpired && credits > 0) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1" /> Congelado
        </Badge>
      );
    }

    if (credits > 0) {
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>
    } else {
      return <Badge variant="secondary">Sem créditos</Badge>
    }
  }

  const loadStudentCredits = async (studentUuid: string, studentStudioId?: string) => {
    try {
      let sid = studentStudioId

      if (!sid) {
        const stored = localStorage.getItem("danceflow_user")
        if (stored) {
          const parsed = JSON.parse(stored)
          sid = parsed.studioId || parsed.studio_id
        }
      }

      if (!sid) return

      const { data, error } = await supabase
        .from('student_lesson_credits')
        .select('remaining_credits, id')
        .eq('student_id', studentUuid)
        .eq('studio_id', sid)
        .maybeSingle()

      if (error) throw error
      setStudentCredits(data ? { remaining: data.remaining_credits, id: data.id } : { remaining: 0 })
    } catch (e) {
      console.error('Erro ao carregar créditos do aluno:', e)
    }
  }

  const handleAdjustCredits = async (type: 'add' | 'remove') => {
    if (!editStudent || !editStudent.id || adjustAmount <= 0) return
    
    setIsAdjusting(true)
    try {
      const amount = type === 'add' ? adjustAmount : -adjustAmount
      const sid = studioId

      console.log('🔄 Ajustando créditos:', { student_id: editStudent.id, studio_id: sid, amount })

      const { data, error } = await supabase.rpc('adjust_student_credits', {
        p_student_id: editStudent.id,
        p_studio_id: sid,
        p_amount: amount
      })

      if (error) throw error

      toast({
        title: "Créditos ajustados!",
        description: `${data.message} Novo saldo: ${data.new_balance}`,
      })
      setAdjustAmount(0)
      setStudentCredits({ remaining: data.new_balance })
      
      // Atualizar na lista
      setAlunos(prev => 
        prev.map(s => 
          s.id === editStudent.id ? { ...s, credits: data.new_balance } : s
        )
      )
    } catch (error: any) {
      toast({
        title: "Erro ao ajustar créditos",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsAdjusting(false)
    }
  }

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
            <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
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
                  {businessModel === 'CREDIT' && (
                    <div className="flex items-center gap-2 mr-2">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 font-bold">
                        {aluno.credits ?? 0} créditos
                      </Badge>
                      {getStatusBadge(aluno.credits, aluno.expiryDate)}
                    </div>
                  )}
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
                  {businessModel === 'CREDIT' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditStudent(aluno)
                        loadStudentCredits(aluno.id, studioId || undefined)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      Ajustar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Diálogo de Ajuste de Créditos */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Créditos - {editStudent?.name}</DialogTitle>
            <DialogDescription>
              Saldo atual: {studentCredits?.remaining || 0} créditos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustAmount">Quantidade</Label>
              <Input
                id="adjustAmount"
                type="number"
                min="1"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                placeholder="Digite a quantidade"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleAdjustCredits('add')}
                disabled={isAdjusting || adjustAmount <= 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Adicionar
              </Button>
              <Button
                onClick={() => handleAdjustCredits('remove')}
                disabled={isAdjusting || adjustAmount <= 0}
                variant="destructive"
                className="flex-1"
              >
                {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserX className="w-4 h-4 mr-2" />}
                Remover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
