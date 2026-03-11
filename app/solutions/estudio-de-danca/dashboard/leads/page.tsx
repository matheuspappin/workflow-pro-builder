"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ModuleGuard } from "@/components/providers/module-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Plus, Search, Phone, Mail, Loader2, UserPlus, MessageCircle, ExternalLink, UserCheck, CheckCheck } from "lucide-react"
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

const stageMap: Record<string, { label: string; color: string }> = {
  new:             { label: "Novo",        color: "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400" },
  contacted:       { label: "Contactado",  color: "bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400" },
  trial_scheduled: { label: "Aula agendada", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-600/20 dark:text-cyan-400" },
  trial_done:      { label: "Aula feita",  color: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
  negotiating:     { label: "Negociando", color: "bg-orange-100 text-orange-700 dark:bg-orange-600/20 dark:text-orange-400" },
  interested:      { label: "Interessado", color: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400" },
  converted:       { label: "Convertido",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  won:             { label: "Convertido (aluno)", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" },
  lost:            { label: "Perdido",    color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [studioId, setStudioId] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", email: "", phone: "", notes: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid)
      if (sid) {
        try {
          const [leadsRes, codeRes] = await Promise.all([
            fetch(`/api/dance-studio/leads?studioId=${sid}`),
            fetch("/api/dance-studio/studio/invite-code", { credentials: "include" }),
          ])
          const leadsData = await leadsRes.json()
          const codeData = await codeRes.json()
          setLeads(Array.isArray(leadsData) ? leadsData : [])
          if (codeData.student_invite_code) setInviteCode(codeData.student_invite_code)
        } catch {
          // sem leads ainda
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleCreateLead = async () => {
    if (!newForm.name.trim() || !studioId) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/dance-studio/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studioId, ...newForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar lead')
      setLeads(prev => [data, ...prev])
      setNewForm({ name: "", email: "", phone: "", notes: "" })
      setIsNewDialogOpen(false)
      toast({ title: "Lead cadastrado!", description: `${data.name} foi adicionado ao CRM.` })
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar lead", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleContatar = (lead: any) => {
    if (lead.phone) {
      const number = lead.phone.replace(/\D/g, '')
      window.open(`https://wa.me/55${number}`, '_blank')
    } else if (lead.email) {
      window.open(`mailto:${lead.email}`, '_blank')
    } else {
      toast({ title: "Sem contato disponível", description: "Este lead não possui telefone ou e-mail.", variant: "destructive" })
    }
  }

  const handleConvidarLead = (lead: any) => {
    if (!inviteCode) {
      toast({ title: "Código de convite não encontrado", variant: "destructive" })
      return
    }
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const link = `${origin}/solutions/estudio-de-danca/register?role=student&code=${inviteCode}`
    const name = lead.name.split(" ")[0]

    if (lead.phone) {
      const number = lead.phone.replace(/\D/g, '')
      const msg = encodeURIComponent(`Olá, ${name}! 🎵\n\nSua vaga no estúdio está aguardando! Acesse o link abaixo para criar sua conta de aluno:\n${link}`)
      window.open(`https://wa.me/55${number}?text=${msg}`, '_blank')
    } else {
      navigator.clipboard.writeText(link)
      setCopiedLinkId(lead.id)
      toast({ title: "Link copiado!", description: `Envie para ${lead.name} pelo canal de sua preferência.` })
      setTimeout(() => setCopiedLinkId(null), 2500)
    }
  }

  const handleConverter = async (lead: any) => {
    if (!studioId) return
    if (lead.converted_to_student_id) {
      toast({ title: "Já convertido", description: "Este cliente já é aluno. Acesse Alunos para gerenciar.", variant: "destructive" })
      return
    }
    setConvertingId(lead.id)
    try {
      const res = await fetch('/api/dance-studio/leads/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, studioId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao converter')
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'won', converted_to_student_id: data.student?.id } : l))
      toast({
        title: `${lead.name} convertido em aluno! ✅`,
        description: "O cliente foi promovido a aluno. Acesse Alunos para gerenciar.",
      })
    } catch (err: any) {
      toast({ title: "Erro ao converter", description: err.message, variant: "destructive" })
    } finally {
      setConvertingId(null)
    }
  }

  const filtered = leads.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search)
  )

  return (
    <ModuleGuard module="leads" showFullError>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Clientes (CRM)
          </h1>
          <p className="text-slate-500 text-sm mt-1">Quem comprou, visitou ou participou — converta em alunos</p>
        </div>
        <Button
          onClick={() => setIsNewDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Kanban resumido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(stageMap).filter(([k]) => k !== 'lost').map(([stage, info]) => {
          const count = leads.filter(l => l.stage === stage || (!l.stage && stage === 'new')).length
          return (
            <Card key={stage} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{count}</p>
                <Badge className={cn("mt-1 text-xs font-bold border-0", info.color)}>{info.label}</Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar lead..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 h-11 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <UserPlus className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Importe clientes ou cadastre quem visitou/comprou para converter em alunos.
            </p>
            <Button
              onClick={() => setIsNewDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Cadastrar Cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((lead) => {
            const stage = stageMap[lead.stage] ?? stageMap.new
            return (
              <Card key={lead.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-indigo-600/10 flex items-center justify-center font-black text-indigo-600 text-base flex-shrink-0">
                      {lead.name?.[0]?.toUpperCase() || "L"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{lead.name}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {lead.email && <span className="flex items-center gap-1 text-xs text-slate-500"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1 text-xs text-slate-500"><Phone className="w-3 h-3" />{lead.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <Badge className={cn("text-xs font-bold border-0", stage.color)}>{stage.label}</Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleContatar(lead)}
                      className="h-7 px-3 text-xs font-bold rounded-lg text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-600/30 dark:text-indigo-400 dark:hover:bg-indigo-600/10"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Contatar
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConvidarLead(lead)}
                      className={cn(
                        "h-7 px-3 text-xs font-bold rounded-lg transition-all",
                        copiedLinkId === lead.id
                          ? "bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-600/10 dark:border-emerald-600/30 dark:text-emerald-400"
                          : "text-violet-600 border-violet-200 hover:bg-violet-50 dark:border-violet-600/30 dark:text-violet-400 dark:hover:bg-violet-600/10"
                      )}
                    >
                      {copiedLinkId === lead.id
                        ? <><CheckCheck className="w-3 h-3 mr-1" />Copiado</>
                        : <><ExternalLink className="w-3 h-3 mr-1" />{lead.phone ? "Convidar" : "Copiar Link"}</>
                      }
                    </Button>

                    {!lead.converted_to_student_id && lead.stage !== 'won' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConverter(lead)}
                        disabled={convertingId === lead.id}
                        className="h-7 px-3 text-xs font-bold rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-600/30 dark:text-emerald-400 dark:hover:bg-emerald-600/10"
                      >
                        {convertingId === lead.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <><UserCheck className="w-3 h-3 mr-1" />Converter em Aluno</>
                        }
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Diálogo Novo Lead */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>Registre quem visitou, comprou ou participou para converter em aluno.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="leadName">Nome *</Label>
              <Input
                id="leadName"
                placeholder="Nome completo"
                value={newForm.name}
                onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="leadEmail">E-mail</Label>
              <Input
                id="leadEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newForm.email}
                onChange={(e) => setNewForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="leadPhone">Telefone / WhatsApp</Label>
              <Input
                id="leadPhone"
                placeholder="(00) 00000-0000"
                value={newForm.phone}
                onChange={(e) => setNewForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="leadNotes">Observações</Label>
              <Input
                id="leadNotes"
                placeholder="Ex: Interessado em Ballet Infantil"
                value={newForm.notes}
                onChange={(e) => setNewForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateLead}
                disabled={isSaving || !newForm.name.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Cadastrar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ModuleGuard>
  )
}
