"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Plus, Search, Phone, Mail, Copy, Check, Loader2, Link2, RefreshCw, CheckCheck, ExternalLink, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

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
      if (data.teacher_invite_code) setCode(data.teacher_invite_code)
    } catch {
      setCode("—")
    } finally {
      setLoading(false)
    }
  }, [open])

  useEffect(() => { loadCode() }, [loadCode])

  const getInviteLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/solutions/estudio-de-danca/register?role=teacher&code=${code}`
  }

  const handleCopyCode = () => {
    if (!code || code === "—") return
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    toast({ title: "Código copiado!", description: "Compartilhe com o professor para que insira em Meu Perfil." })
    setTimeout(() => setCopiedCode(false), 2500)
  }

  const handleCopyLink = () => {
    if (!code || code === "—") return
    navigator.clipboard.writeText(getInviteLink())
    setCopiedLink(true)
    toast({ title: "Link copiado!", description: "Envie este link para o professor criar a conta e já entrar vinculado." })
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleShareWhatsApp = () => {
    if (!code || code === "—") return
    const msg = encodeURIComponent(`Olá! Você está convidado(a) para fazer parte da equipe de professores do nosso estúdio 🎵\n\nAcesse o link abaixo para criar sua conta:\n${getInviteLink()}\n\nOu se já tem conta, use o código: *${code}*`)
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }

  const handleRegenerate = async () => {
    if (!confirm("Gerar novo código invalida o atual. Professores que ainda não se vincularam precisarão do novo código. Continuar?")) return
    setRegenerating(true)
    try {
      const res = await fetch("/api/dance-studio/studio/invite-code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "teacher" }),
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
          <DialogTitle className="flex items-center gap-2 text-pink-600">
            <Share2 className="w-5 h-5" /> Convidar Professor
          </DialogTitle>
          <DialogDescription>
            Escolha como prefere convidar: envie o link direto (recomendado) ou compartilhe apenas o código.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
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
              <p className="text-[11px] text-slate-400 mt-2">Para professores que já têm conta: acesse <strong>Meu Perfil → Estúdio Vinculado</strong>.</p>
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ou</span>
              <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
            </div>

            {/* Link direto */}
            <div className="rounded-xl bg-pink-50 dark:bg-pink-600/10 border border-pink-200 dark:border-pink-500/20 p-4 space-y-3">
              <div>
                <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">Link de Cadastro Direto ✨ Recomendado</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">O professor clica, cria a conta e já entra vinculado ao estúdio automaticamente.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  className={`flex-1 font-bold rounded-xl text-sm transition-all ${copiedLink ? "bg-emerald-600 hover:bg-emerald-700" : "bg-pink-600 hover:bg-pink-700"} text-white`}
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

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [studioId, setStudioId] = useState<string | null>(null)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", email: "", phone: "" })
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.user_metadata?.studio_id ?? null
      setStudioId(sid)

      if (sid) {
        try {
          const res = await fetch(`/api/dance-studio/teachers?studioId=${sid}`)
          const data = await res.json()
          setProfessores(Array.isArray(data) ? data : [])
        } catch {
          toast({ title: "Erro ao carregar professores", variant: "destructive" })
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleCreateProfessor = async () => {
    if (!newForm.name.trim() || !studioId) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/dance-studio/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studioId, name: newForm.name, email: newForm.email, phone: newForm.phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar professor')
      setProfessores(prev => [data, ...prev])
      setNewForm({ name: "", email: "", phone: "" })
      setIsNewDialogOpen(false)
      toast({ title: "Professor cadastrado!", description: `${data.name} foi adicionado.` })
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar professor", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = professores.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <InviteCodeDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-pink-500" />
            Professores
          </h1>
          <p className="text-slate-500 text-sm mt-1">Equipe docente do estúdio</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsInviteOpen(true)}
            className="font-bold rounded-xl border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Convidar
          </Button>
          <Button
            onClick={() => setIsNewDialogOpen(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Professor
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar professor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 h-11 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              {search ? "Nenhum professor encontrado" : "Nenhum professor cadastrado"}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Convide professores pelo código de acesso do estúdio.
            </p>
            <Button onClick={() => setIsInviteOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl">
              <Link2 className="w-4 h-4 mr-2" /> Ver Código de Convite
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((prof) => (
            <Card key={prof.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-pink-600/10 flex items-center justify-center font-black text-pink-600 text-lg flex-shrink-0">
                    {prof.name?.[0]?.toUpperCase() || "P"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{prof.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {prof.email && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="w-3 h-3" /> {prof.email}
                        </span>
                      )}
                      {prof.phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {prof.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-600/20 dark:text-pink-400 border-0 text-xs font-bold flex-shrink-0">
                  Professor
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo Novo Professor */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Professor</DialogTitle>
            <DialogDescription>Cadastre um professor diretamente no sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="profName">Nome *</Label>
              <Input
                id="profName"
                placeholder="Nome completo"
                value={newForm.name}
                onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="profEmail">E-mail</Label>
              <Input
                id="profEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newForm.email}
                onChange={(e) => setNewForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="profPhone">Telefone</Label>
              <Input
                id="profPhone"
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
                onClick={handleCreateProfessor}
                disabled={isSaving || !newForm.name.trim()}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Cadastrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
