"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  UserCircle,
  Ruler,
  Phone,
  Mail,
  Building2,
  Loader2,
  Save,
  Flame,
  CheckCircle2,
  Clock,
  FolderKanban,
  Link as LinkIcon,
  Plus,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getEngineerStats, joinStudioByLink, getLinkedCompanies } from "@/lib/actions/engineer"
import { cn } from "@/lib/utils"

interface LinkedCompany {
  id: string
  studio: {
    id: string
    name: string
    slug: string
    plan: string
    settings: { setting_key: string; setting_value: string }[]
    organization: { niche: string }[]
  }
  role: string
  created_at: string
}

export default function ArchitectPerfilPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ pending: 0, active: 0, finished: 0, total: 0 })
  const [form, setForm] = useState({ name: "", phone: "", email: "", cau: "" })
  const [companies, setCompanies] = useState<LinkedCompany[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [inviteLink, setInviteLink] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)
      setForm({
        name: user.user_metadata?.name || "",
        phone: user.user_metadata?.phone || "",
        email: user.email || "",
        cau: user.user_metadata?.cau_registration || user.user_metadata?.cau || "",
      })

      try {
        const statsResult = await getEngineerStats(user.id)
        if (statsResult.success && statsResult.data) setStats(statsResult.data)
      } catch {}

      fetchLinkedCompanies(user.id)
      setLoading(false)
    }
    load()
  }, [])

  async function fetchLinkedCompanies(userId: string) {
    try {
      const result = await getLinkedCompanies(userId)
      if (!result.success) throw new Error(result.error)
      setCompanies(result.data as any || [])
    } catch {
      toast({ title: "Erro ao carregar empresas", variant: "destructive" })
    } finally {
      setLoadingCompanies(false)
    }
  }

  async function handleLinkCompany() {
    if (!inviteLink.trim()) {
      toast({ title: "Insira o link do convite", variant: "destructive" })
      return
    }
    setIsValidating(true)
    try {
      const result = await joinStudioByLink(inviteLink, user.id, user.email)
      if (result.success) {
        toast({ title: (result as any).message || "Empresa vinculada com sucesso!" })
        setInviteLink("")
        await supabase.auth.refreshSession()
        fetchLinkedCompanies(user.id)
      } else {
        toast({ title: result.error || "Erro ao vincular empresa", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro ao processar solicitação", variant: "destructive" })
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: form.name, phone: form.phone, cau_registration: form.cau },
      })
      if (error) throw error
      toast({ title: "Perfil atualizado com sucesso!" })
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-violet-600" />
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Suas informações como arquiteto parceiro
        </p>
      </div>

      <Card className="bg-gradient-to-br from-violet-700 via-violet-600 to-purple-600 border-none text-white">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Ruler className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">{form.name || "Arquiteto"}</h2>
            <p className="text-violet-100 text-sm">{form.email}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-white/20 text-white text-xs font-bold border-0">
                Arquiteto Parceiro
              </Badge>
              {form.cau && (
                <Badge className="bg-white/10 text-white text-xs font-mono border-0">
                  CAU: {form.cau}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Aguardando", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10", icon: Clock },
          { label: "Em Andamento", value: stats.active, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/10", icon: Flame },
          { label: "Concluídos", value: stats.finished, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10", icon: CheckCircle2 },
          { label: "Total", value: stats.total, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800", icon: FolderKanban },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className={cn("p-4 text-center", s.bg)}>
              <s.icon className={cn("w-5 h-5 mx-auto mb-1", s.color)} />
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white dark:bg-slate-900/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Building2 className="w-4 h-4 text-violet-600" />
            Empresas Vinculadas
          </CardTitle>
          <CardDescription>Gerencie as empresas onde você atua como arquiteto parceiro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-6 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Carregando empresas...
              </div>
            ) : companies.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-violet-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/20 rounded-lg flex items-center justify-center text-violet-600">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                        Ativo
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                      {company.studio?.name || company.studio?.slug || "Empresa sem nome"}
                    </h4>
                    <p className="text-xs text-slate-500 capitalize">{company.role || "Arquiteto"}</p>
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Vinculado em {new Date(company.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium text-sm">Nenhuma empresa vinculada</p>
                <p className="text-xs text-slate-400 mt-0.5">Use o campo abaixo para se vincular via convite.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <LinkIcon className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Vincular Nova Empresa</p>
                <p className="text-xs text-slate-500">Cole o link ou o código de convite recebido pela empresa</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Link (ex: .../setup/invite/xxx) ou código (ex: ABC12DEF)"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                className="h-10 flex-1"
              />
              <Button
                onClick={handleLinkCompany}
                disabled={isValidating || !inviteLink.trim()}
                className="h-10 font-bold bg-violet-600 hover:bg-violet-700 text-white min-w-[120px]"
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                {isValidating ? "Validando..." : "Vincular"}
              </Button>
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>Ao vincular, você concorda em compartilhar seu perfil profissional com os administradores da empresa.</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">CAU / Registro Profissional</Label>
              <div className="relative mt-1.5">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  value={form.cau}
                  onChange={(e) => setForm({ ...form, cau: e.target.value })}
                  placeholder="Ex: CAU/SP A12345"
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
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">O e-mail não pode ser alterado aqui.</p>
            </div>
            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl"
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
