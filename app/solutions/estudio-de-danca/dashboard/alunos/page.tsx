"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, UserCheck, UserX, Phone, Mail, Loader2, AlertTriangle, CheckCircle, Link2, Copy, RefreshCw, CheckCheck, ExternalLink, Share2, Pencil, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Activity } from "lucide-react"

function InviteCodeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const loadCode = useCallback(async () => {
    if (!open) return
    setLoading(true)
    try {
      const res = await fetch("/api/dance-studio/studio/invite-code", { credentials: "include" })
      const data = await res.json()
      if (data.student_invite_code) setCode(data.student_invite_code)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fbdb915b-b580-4e5e-9b0e-147b06a71f4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d99f83'},body:JSON.stringify({sessionId:'d99f83',runId:'pre-fix-1',hypothesisId:'H1',location:'app/solutions/estudio-de-danca/dashboard/alunos/page.tsx:loadCode',message:'Loaded student invite code for InviteCodeDialog',data:{studentInviteCode:data.student_invite_code ?? null},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
    } catch {
      setCode("—")
    } finally {
      setLoading(false)
    }
  }, [open])

  useEffect(() => { loadCode() }, [loadCode])

  const getInviteLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/solutions/estudio-de-danca/register?role=student&code=${code}`
  }

  const getMatriculaLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/solutions/estudio-de-danca/matricula/${code}`
  }

  const handleCopyCode = () => {
    if (!code || code === "—") return
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    toast({ title: "Código copiado!", description: "Compartilhe com o aluno para que insira em Meu Perfil." })
    setTimeout(() => setCopiedCode(false), 2500)
  }

  const handleCopyLink = () => {
    if (!code || code === "—") return
    navigator.clipboard.writeText(getInviteLink())
    setCopiedLink(true)
    toast({ title: "Link copiado!", description: "Envie este link para o aluno criar a conta e já entrar vinculado." })
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleShareWhatsApp = () => {
    if (!code || code === "—") return
    const msg = encodeURIComponent(`Olá! Você está convidado(a) para se matricular no nosso estúdio 🎵\n\nAcesse o link abaixo para criar sua conta:\n${getInviteLink()}\n\nOu se já tem conta, use o código: *${code}*`)
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }

  const handleRegenerate = async () => {
    if (!confirm("Gerar novo código invalida o atual. Alunos que ainda não se vincularam precisarão do novo código. Continuar?")) return
    setRegenerating(true)
    try {
      const res = await fetch("/api/dance-studio/studio/invite-code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "student" }),
      })
      const data = await res.json()
      if (data.invite_code) { setCode(data.invite_code); toast({ title: "Novo código gerado!" }) }
    } catch {
      toast({ title: "Erro ao regenerar", variant: "destructive" })
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-violet-600">
            <Share2 className="w-5 h-5" /> Convidar Aluno
          </DialogTitle>
          <DialogDescription>
            Escolha como prefere convidar: envie o link direto (recomendado) ou compartilhe apenas o código.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Código */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código de Convite</p>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={handleRegenerate} disabled={regenerating} title="Gerar novo código">
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${regenerating ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-[0.3em] flex-1">
                  {code || "—"}
                </p>
                <Button size="sm" variant="outline" className={`rounded-lg h-8 text-xs font-bold transition-all ${copiedCode ? "bg-emerald-50 border-emerald-300 text-emerald-600" : ""}`} onClick={handleCopyCode}>
                  {copiedCode ? <><CheckCheck className="w-3.5 h-3.5 mr-1.5" />Copiado</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copiar</>}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Para alunos que já têm conta: acesse <strong>Meu Perfil → Estúdio Vinculado</strong>.</p>
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ou</span>
              <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
            </div>

            {/* Link direto */}
            <div className="rounded-xl bg-violet-50 dark:bg-violet-600/10 border border-violet-200 dark:border-violet-500/20 p-4 space-y-3">
              <div>
                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">Link de Cadastro Direto ✨ Recomendado</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">O aluno clica, cria a conta e já entra vinculado ao estúdio automaticamente.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  className={`flex-1 font-bold rounded-xl text-sm transition-all ${copiedLink ? "bg-emerald-600 hover:bg-emerald-700" : "bg-violet-600 hover:bg-violet-700"} text-white`}
                  onClick={handleCopyLink}
                >
                  {copiedLink ? <><CheckCheck className="w-4 h-4 mr-2" />Link Copiado!</> : <><ExternalLink className="w-4 h-4 mr-2" />Copiar Link</>}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl font-bold border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600/30 dark:text-green-400 dark:hover:bg-green-600/10"
                  onClick={handleShareWhatsApp}
                  title="Enviar pelo WhatsApp"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

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
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", email: "", phone: "" })
  const [editForm, setEditForm] = useState<{
    name: string; email: string; phone: string; status: string;
    tags?: string[]; source?: string; language?: string; category?: string; company?: string; address?: string;
    email_subscriber_status?: string; sms_subscriber_status?: string;
    last_activity_description?: string; last_activity_at?: string;
  }>({ name: "", email: "", phone: "", status: "active" })
  const [isSaving, setIsSaving] = useState(false)
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
            const res = await fetch(`/api/dance-studio/students?studioId=${sid}`)
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

  const handleCreateStudent = async () => {
    if (!newForm.name.trim() || !studioId) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/dance-studio/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studioId, ...newForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar aluno')
      setAlunos(prev => [data, ...prev])
      setNewForm({ name: "", email: "", phone: "" })
      setIsNewDialogOpen(false)
      toast({ title: "Aluno cadastrado!", description: `${data.name} foi adicionado com sucesso.` })
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar aluno", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

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

  const handleUpdateStudent = async () => {
    if (!editStudent || !editStudent.id || !studioId) return
    if (!editForm.name?.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" })
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/dance-studio/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editStudent.id,
          studioId,
          name: editForm.name.trim(),
          email: editForm.email?.trim() || null,
          phone: editForm.phone?.trim() || null,
          status: editForm.status,
          tags: editForm.tags?.length ? editForm.tags : null,
          source: editForm.source?.trim() || null,
          language: editForm.language?.trim() || null,
          category: editForm.category?.trim() || null,
          company: editForm.company?.trim() || null,
          address: editForm.address?.trim() || null,
          email_subscriber_status: editForm.email_subscriber_status?.trim() || null,
          sms_subscriber_status: editForm.sms_subscriber_status?.trim() || null,
          last_activity_description: editForm.last_activity_description?.trim() || null,
          last_activity_at: editForm.last_activity_at?.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar aluno')
      setAlunos(prev =>
        prev.map(s => (s.id === editStudent.id ? { ...s, ...data } : s))
      )
      setEditStudent((prev: any) => prev ? { ...prev, ...data } : null)
      toast({ title: "Aluno atualizado!", description: "Dados salvos com sucesso." })
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
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
      <InviteCodeDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" />
            Alunos
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie todos os alunos matriculados</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsInviteOpen(true)}
            className="font-bold rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Convidar
          </Button>
          <Button
            onClick={() => setIsNewDialogOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Aluno
          </Button>
        </div>
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
                : "Matricule alunos diretamente ou compartilhe o código de convite do estúdio."}
            </p>
            {!search && (
              <div className="flex gap-3 flex-wrap justify-center">
                <Button
                  onClick={() => setIsNewDialogOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Matricular Primeiro Aluno
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteOpen(true)}
                  className="border-violet-200 text-violet-600 hover:bg-violet-50 font-bold rounded-xl"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Ver Código de Convite
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((aluno, idx) => (
            <Card key={aluno.id ?? `aluno-${idx}`} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-600/10 flex items-center justify-center font-black text-violet-600 text-lg flex-shrink-0">
                    {aluno.name?.[0]?.toUpperCase() || "A"}
                  </div>
                    <div>
                    <p className="font-bold text-slate-900 dark:text-white">{aluno.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {(aluno.phone || aluno.phone_1) && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {aluno.phone || aluno.phone_1}
                        </span>
                      )}
                      {aluno.email && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="w-3 h-3" /> {aluno.email}
                        </span>
                      )}
                      {aluno.source && (
                        <Badge variant="outline" className="text-[10px] font-normal text-slate-500 border-slate-200">
                          {aluno.source}
                        </Badge>
                      )}
                      {Array.isArray(aluno.tags) && aluno.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {aluno.tags.slice(0, 3).map((t: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-normal">{t}</Badge>
                          ))}
                          {aluno.tags.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">+{aluno.tags.length - 3}</Badge>
                          )}
                        </div>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditStudent(aluno)
                      setEditForm({
                        name: aluno.name || "",
                        email: aluno.email || "",
                        phone: aluno.phone || aluno.phone_1 || "",
                        status: aluno.status || "active",
                        tags: Array.isArray(aluno.tags) ? aluno.tags : [],
                        source: aluno.source || "",
                        language: aluno.language || "",
                        category: aluno.category || "",
                        company: aluno.company || "",
                        address: aluno.address || "",
                        email_subscriber_status: aluno.email_subscriber_status || "",
                        sms_subscriber_status: aluno.sms_subscriber_status || "",
                        last_activity_description: aluno.last_activity_description || "",
                        last_activity_at: aluno.last_activity_at ? aluno.last_activity_at.slice(0, 16) : "",
                      })
                      loadStudentCredits(aluno.id, studioId || undefined)
                      setAdjustAmount(0)
                      setIsEditDialogOpen(true)
                    }}
                    className="font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Diálogo Novo Aluno */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Aluno</DialogTitle>
            <DialogDescription>Preencha os dados do aluno para matriculá-lo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newName">Nome *</Label>
              <Input
                id="newName"
                placeholder="Nome completo"
                value={newForm.name}
                onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="newEmail">E-mail</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newForm.email}
                onChange={(e) => setNewForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="newPhone">Telefone</Label>
              <Input
                id="newPhone"
                placeholder="(00) 00000-0000"
                value={newForm.phone}
                onChange={(e) => setNewForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateStudent}
                disabled={isSaving || !newForm.name.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Matricular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Editar Aluno + Créditos manuais */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setEditStudent(null)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-violet-600" />
              Editar Aluno
            </DialogTitle>
            <DialogDescription>
              Altere os dados do aluno ou adicione créditos manualmente (ajuste pontual).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Dados do aluno */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dados pessoais</p>
              <div>
                <Label htmlFor="editName">Nome *</Label>
                <Input
                  id="editName"
                  placeholder="Nome completo"
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editEmail">E-mail</Label>
                <Input
                  id="editEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editPhone">Telefone</Label>
                <Input
                  id="editPhone"
                  placeholder="(00) 00000-0000"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <select
                  id="editStatus"
                  value={editForm.status}
                  onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>
            </div>

            {/* Detalhes CRM — Etiquetas, Fonte, Idioma, Status assinante, Última atividade */}
            <Collapsible defaultOpen={!!(editForm.source || editForm.tags?.length || editForm.last_activity_description)}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700">
                <Activity className="w-3.5 h-3.5" />
                Detalhes CRM (Etiquetas, Fonte, Última atividade)
                <ChevronDown className="w-3.5 h-3.5 ml-auto" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editTags">Etiquetas</Label>
                    <Input
                      id="editTags"
                      placeholder="Ex: vip, prospect, Bailão"
                      value={Array.isArray(editForm.tags) ? editForm.tags.join(", ") : ""}
                      onChange={(e) => setEditForm(f => ({ ...f, tags: e.target.value.split(/[,;]/).map(s => s.trim()).filter(Boolean) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editSource">Fonte</Label>
                    <Input
                      id="editSource"
                      placeholder="Ex: Col, Ext, Me"
                      value={editForm.source || ""}
                      onChange={(e) => setEditForm(f => ({ ...f, source: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLanguage">Idioma</Label>
                    <Input
                      id="editLanguage"
                      placeholder="Ex: pt"
                      value={editForm.language || ""}
                      onChange={(e) => setEditForm(f => ({ ...f, language: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCategory">Categoria</Label>
                    <Input
                      id="editCategory"
                      placeholder="Ex: geral, marketplace, curso"
                      value={editForm.category || ""}
                      onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editCompany">Empresa</Label>
                  <Input
                    id="editCompany"
                    placeholder="Nome da empresa"
                    value={editForm.company || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editAddress">Endereço</Label>
                  <Input
                    id="editAddress"
                    placeholder="Endereço completo"
                    value={editForm.address || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editEmailSub">Status assinante email</Label>
                    <Input
                      id="editEmailSub"
                      placeholder="Ex: Nunca fi, Subscribed"
                      value={editForm.email_subscriber_status || ""}
                      onChange={(e) => setEditForm(f => ({ ...f, email_subscriber_status: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editSmsSub">Status assinante SMS</Label>
                    <Input
                      id="editSmsSub"
                      placeholder="Ex: Subscribed"
                      value={editForm.sms_subscriber_status || ""}
                      onChange={(e) => setEditForm(f => ({ ...f, sms_subscriber_status: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editLastActivity">Última atividade</Label>
                  <Input
                    id="editLastActivity"
                    placeholder="Ex: Pagou, Fez login"
                    value={editForm.last_activity_description || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, last_activity_description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastActivityAt">Data da última atividade</Label>
                  <Input
                    id="editLastActivityAt"
                    type="datetime-local"
                    value={editForm.last_activity_at || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, last_activity_at: e.target.value }))}
                  />
                </div>
                {editStudent?.created_at && (
                  <p className="text-xs text-slate-500">
                    Criado às: {new Date(editStudent.created_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Créditos manuais (ajuste pontual - não depende da automação) */}
            <div className="space-y-4 rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5" />
                  Créditos manuais (ajuste pontual)
                </p>
                <p className="text-xs text-slate-500">
                  Saldo atual: <strong>{studentCredits?.remaining ?? 0}</strong> créditos
                </p>
                <div>
                  <Label htmlFor="adjustAmount">Quantidade</Label>
                  <Input
                    id="adjustAmount"
                    type="number"
                    min="1"
                    value={adjustAmount || ""}
                    onChange={(e) => setAdjustAmount(Number(e.target.value) || 0)}
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

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                Fechar
              </Button>
              <Button
                onClick={handleUpdateStudent}
                disabled={isSaving || !editForm.name?.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Salvar dados
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
