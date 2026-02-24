"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  UserCircle,
  Wrench,
  Phone,
  Mail,
  Building2,
  CheckCircle,
  Loader2,
  Save,
  Link2,
  Link2Off,
  AlertCircle,
  Copy,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface VinculoEmpresa {
  linked: boolean
  professional_id?: string
  studio?: {
    id: string
    name: string
    invite_code: string
  }
}

export default function TechnicianPerfilPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vinculando, setVinculando] = useState(false)
  const [desvinculando, setDesvinculando] = useState(false)
  const [stats, setStats] = useState({ total: 0, concluidas: 0, vistorias: 0 })
  const [form, setForm] = useState({ name: "", phone: "", email: "" })
  const [vinculo, setVinculo] = useState<VinculoEmpresa>({ linked: false })
  const [inviteCode, setInviteCode] = useState("")
  const [loadingVinculo, setLoadingVinculo] = useState(true)

  const loadVinculo = async () => {
    setLoadingVinculo(true)
    try {
      const res = await fetch("/api/fire-protection/technician/vincular", { credentials: "include" })
      const data = await res.json()
      setVinculo(data)
    } catch {
      setVinculo({ linked: false })
    } finally {
      setLoadingVinculo(false)
    }
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)
      setForm({
        name: user.user_metadata?.name || "",
        phone: user.user_metadata?.phone || "",
        email: user.email || "",
      })

      try {
        const res = await fetch("/api/fire-protection/technician/os?tipo=all", { credentials: "include" })
        const data = await res.json()
        if (Array.isArray(data)) {
          setStats({
            total: data.length,
            concluidas: data.filter((o: any) => o.status === "finished").length,
            vistorias: data.filter((o: any) => o.project_type === "vistoria").length,
          })
        }
      } catch {}

      setLoading(false)
    }
    load()
    loadVinculo()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: form.name, phone: form.phone },
      })
      if (error) throw error
      toast({ title: "Perfil atualizado com sucesso!" })
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
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
      const res = await fetch("/api/fire-protection/technician/vincular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invite_code: inviteCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao vincular")
      toast({ title: "Empresa vinculada com sucesso!", description: data.message })
      setInviteCode("")
      await loadVinculo()
    } catch (err: any) {
      toast({ title: "Erro ao vincular", description: err.message, variant: "destructive" })
    } finally {
      setVinculando(false)
    }
  }

  const handleDesvincular = async () => {
    if (!confirm("Tem certeza que deseja se desvincular desta empresa? Você não receberá mais OS atribuídas por ela.")) return
    setDesvinculando(true)
    try {
      const res = await fetch("/api/fire-protection/technician/vincular", {
        method: "DELETE",
        credentials: "include",
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

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-orange-600" />
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Suas informações como técnico de campo
        </p>
      </div>

      {/* Avatar + Info */}
      <Card className="bg-gradient-to-br from-orange-600 to-red-600 border-none text-white">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">{form.name || "Técnico"}</h2>
            <p className="text-orange-100 text-sm">{form.email}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-white/20 text-white text-xs font-bold border-0">
                Técnico de Campo
              </Badge>
              {vinculo.linked && vinculo.studio && (
                <Badge className="bg-white/20 text-white text-xs font-bold border-0 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {vinculo.studio.name}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total OS", value: stats.total, color: "text-orange-600" },
          { label: "Concluídas", value: stats.concluidas, color: "text-emerald-600" },
          { label: "Vistorias", value: stats.vistorias, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 shadow-sm border-none">
            <CardContent className="p-4 text-center">
              <p className={cn("text-3xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vínculo com Empresa */}
      <Card className="bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200 dark:border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-600" />
              Empresa Vinculada
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
            Vincule-se a uma empresa para receber Ordens de Serviço
          </p>
        </CardHeader>
        <CardContent>
          {loadingVinculo ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
            </div>
          ) : vinculo.linked && vinculo.studio ? (
            /* Estado: Vinculado */
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
                    Você receberá as OS atribuídas por esta empresa
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
                Desvincular desta Empresa
              </Button>
            </div>
          ) : (
            /* Estado: Não vinculado */
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-600/10 border border-amber-200 dark:border-amber-600/20">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-400 text-sm">Nenhuma empresa vinculada</p>
                  <p className="text-amber-700/80 dark:text-amber-300/80 text-xs mt-0.5">
                    Solicite o código de convite ao administrador da empresa e insira abaixo para se vincular.
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Código de Convite da Empresa
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
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl px-5"
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
                  O código é fornecido pelo administrador da empresa no painel FireControl.
                </p>
              </div>

              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
                onClick={handleVincular}
                disabled={vinculando || !inviteCode.trim()}
              >
                {vinculando ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Vincular à Empresa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form de Perfil */}
      <Card className="bg-white dark:bg-slate-900/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Editar Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome completo</Label>
              <div className="relative mt-1.5">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Telefone / WhatsApp</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(XX) XXXXX-XXXX"
                  type="tel"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">E-mail</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  value={form.email}
                  disabled
                  readOnly
                  placeholder="Seu e-mail"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">O e-mail não pode ser alterado aqui.</p>
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
