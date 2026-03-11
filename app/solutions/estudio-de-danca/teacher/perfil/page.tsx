"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  UserCircle, Mail, Phone, Save, Loader2,
  Building2, CheckCircle, Link2, Link2Off, AlertCircle, RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface VinculoEstudio {
  linked: boolean
  professional_id?: string
  studio?: { id: string; name: string }
}

export default function TeacherPerfilPage() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "" })

  const [vinculo, setVinculo] = useState<VinculoEstudio>({ linked: false })
  const [loadingVinculo, setLoadingVinculo] = useState(true)
  const [inviteCode, setInviteCode] = useState("")
  const [vinculando, setVinculando] = useState(false)
  const [desvinculando, setDesvinculando] = useState(false)

  const loadVinculo = async () => {
    setLoadingVinculo(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setVinculo({ linked: false })
        return
      }

      const res = await fetch("/api/dance-studio/vincular", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await res.json()
      setVinculo(data)
    } catch {
      setVinculo({ linked: false })
    } finally {
      setLoadingVinculo(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setForm({
        name: user?.user_metadata?.name || "",
        email: user?.email || "",
        phone: user?.user_metadata?.phone || "",
      })
    })
    loadVinculo()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase.auth.updateUser({ data: { name: form.name, phone: form.phone } })
      toast({ title: "Perfil atualizado!" })
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleVincular = async () => {
    if (!inviteCode.trim()) {
      toast({ title: "Informe o código de convite", variant: "destructive" })
      return
    }
    setVinculando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const res = await fetch("/api/dance-studio/vincular", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ invite_code: inviteCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao vincular")
      toast({ title: "Estúdio vinculado com sucesso!", description: data.message })
      setInviteCode("")
      await loadVinculo()
    } catch (err: any) {
      toast({ title: "Erro ao vincular", description: err.message, variant: "destructive" })
    } finally {
      setVinculando(false)
    }
  }

  const handleDesvincular = async () => {
    if (!confirm("Tem certeza que deseja se desvincular deste estúdio? Você não receberá mais turmas atribuídas por ele.")) return
    setDesvinculando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const res = await fetch("/api/dance-studio/vincular", {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao desvincular")
      toast({ title: "Desvinculado com sucesso", description: data.message })
      await loadVinculo()
    } catch (err: any) {
      toast({ title: "Erro ao desvincular", description: err.message, variant: "destructive" })
    } finally {
      setDesvinculando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-pink-600" />
          Meu Perfil
        </h1>
        <p className="text-slate-500 text-sm mt-1">Seus dados profissionais</p>
      </div>

      {/* Avatar + Info */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-pink-600/20">
          {form.name?.[0]?.toUpperCase() || "P"}
        </div>
        <div>
          <p className="font-black text-slate-900 dark:text-white text-lg">{form.name || "Professor"}</p>
          <p className="text-sm text-slate-500">{form.email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-block px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-600/20 text-pink-700 dark:text-pink-400 text-[10px] font-black uppercase tracking-widest">
              Professor
            </span>
            {vinculo.linked && vinculo.studio && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest">
                <Building2 className="w-3 h-3" />
                {vinculo.studio.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vínculo com Estúdio */}
      <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-pink-600" />
              Estúdio Vinculado
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-slate-400 hover:text-slate-700"
              onClick={loadVinculo}
              disabled={loadingVinculo}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loadingVinculo && "animate-spin")} />
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Vincule-se a um estúdio para receber turmas e aulas
          </p>
        </CardHeader>
        <CardContent>
          {loadingVinculo ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-pink-600" />
            </div>
          ) : vinculo.linked && vinculo.studio ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-600/10 border border-emerald-200 dark:border-emerald-600/20">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">Vinculado com sucesso</p>
                  <p className="text-emerald-700 dark:text-emerald-300 font-black text-base mt-0.5 truncate">
                    {vinculo.studio.name}
                  </p>
                  <p className="text-emerald-600/70 text-xs mt-1">
                    Você receberá as turmas atribuídas por este estúdio
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-bold rounded-xl"
                onClick={handleDesvincular}
                disabled={desvinculando}
              >
                {desvinculando ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Link2Off className="w-4 h-4 mr-2" />
                )}
                Desvincular deste Estúdio
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-600/10 border border-amber-200 dark:border-amber-600/20">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-400 text-sm">Nenhum estúdio vinculado</p>
                  <p className="text-amber-700/80 dark:text-amber-300/80 text-xs mt-0.5">
                    Solicite o código de professor ao administrador do estúdio e insira abaixo.
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Código de Convite (Professor)
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      className="pl-9 font-mono uppercase tracking-widest"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Ex: A1B2C3D4"
                      maxLength={10}
                    />
                  </div>
                  <Button
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl px-5"
                    onClick={handleVincular}
                    disabled={vinculando || !inviteCode.trim()}
                  >
                    {vinculando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  O código é fornecido pelo administrador do estúdio no painel DanceFlow.
                </p>
              </div>
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl"
                onClick={handleVincular}
                disabled={vinculando || !inviteCode.trim()}
              >
                {vinculando ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Vincular ao Estúdio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form de Perfil */}
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Dados Profissionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nome Completo</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3" /> E-mail
            </Label>
            <Input
              value={form.email}
              disabled
              className="bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl h-11 opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Phone className="w-3 h-3" /> WhatsApp
            </Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl h-11"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl w-full h-11"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
