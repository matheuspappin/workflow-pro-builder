"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Settings,
  Building2,
  Bell,
  Shield,
  Palette,
  Users,
  Globe,
  Save,
  Upload,
  Key,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle,
  FireExtinguisher,
  Zap,
  MessageSquare,
  DollarSign,
  Loader2,
  Copy,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function InviteUserButton() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<"finance" | "seller" | "receptionist">("finance")
  const [email, setEmail] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGenerateInvite = async () => {
    const userStr = localStorage.getItem("danceflow_user")
    if (!userStr) {
      toast.error("Usuário não identificado.")
      return
    }
    const storedUser = JSON.parse(userStr)
    const studioId = storedUser.studio_id || storedUser.studioId
    if (!studioId) {
      toast.error("Estúdio não identificado.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/invites/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || null,
          studioId,
          role,
          createdByUserId: storedUser.id,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setInviteLink(data.inviteLink)
        toast.success("Link gerado! Copie e envie ao usuário.")
      } else {
        toast.error(data.error || "Erro ao gerar convite.")
      }
    } catch (e) {
      toast.error("Erro ao gerar convite.")
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast.success("Link copiado!")
  }

  const roleLabels = { finance: "Financeiro", seller: "Vendedor", receptionist: "Recepcionista" }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setInviteLink(""); setEmail("") } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed font-bold">
          <Users className="w-4 h-4 mr-2" />
          Convidar novo usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Convidar usuário (Financeiro / Vendedor / Recepcionista)
          </DialogTitle>
          <DialogDescription>
            Gere um link de convite. O usuário precisará ter uma conta no sistema para aceitar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Tipo de usuário</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finance">Financeiro (Portal Financeiro)</SelectItem>
                <SelectItem value="seller">Vendedor (Portal do Vendedor)</SelectItem>
                <SelectItem value="receptionist">Recepcionista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>E-mail (opcional — para link nominal)</Label>
            <Input
              type="email"
              placeholder="financeiro@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          {!inviteLink ? (
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleGenerateInvite} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Gerar link de convite
            </Button>
          ) : (
            <div className="space-y-2">
              <Label>Link gerado</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={copyLink} title="Copiar">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Envie este link ao {roleLabels[role].toLowerCase()}. Ele fará login e ao acessar o link aceitará o convite.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const tabs = [
  { key: "empresa", label: "Empresa", icon: Building2 },
  { key: "notificacoes", label: "Notificações", icon: Bell },
  { key: "seguranca", label: "Segurança", icon: Shield },
  { key: "integrações", label: "Integrações", icon: Zap },
]

function TabEmpresa({
  studioId,
  data,
}: {
  studioId: string | null
  data: {
    company_name: string
    company_cnpj: string
    company_phone: string
    company_email: string
    company_address: string
    crea_responsavel: string
    alvara_funcionamento: string
    system_name: string
    primary_color: string
  }
}) {
  const [loading, setLoading] = useState(false)
  const [empresa, setEmpresa] = useState(data)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setEmpresa({
      company_name: data.company_name || "",
      company_cnpj: data.company_cnpj || "",
      company_phone: data.company_phone || "",
      company_email: data.company_email || "",
      company_address: data.company_address || "",
      crea_responsavel: data.crea_responsavel || "",
      alvara_funcionamento: data.alvara_funcionamento || "",
      system_name: data.system_name || "FireControl",
      primary_color: data.primary_color || "#dc2626",
    })
  }, [data])

  const handleSave = async () => {
    if (!studioId) {
      toast.error("Estúdio não identificado.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          empresa: {
            company_name: empresa.company_name,
            company_cnpj: empresa.company_cnpj,
            company_phone: empresa.company_phone,
            company_email: empresa.company_email,
            company_address: empresa.company_address,
            crea_responsavel: empresa.crea_responsavel,
            alvara_funcionamento: empresa.alvara_funcionamento,
          },
          personalizacao: {
            system_name: empresa.system_name,
            primary_color: empresa.primary_color,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao salvar")
      setSaved(true)
      toast.success("Dados da empresa salvos!")
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <FireExtinguisher className="w-5 h-5 text-red-600" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>Informações da sua empresa de segurança contra incêndio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-red-600 flex items-center justify-center flex-shrink-0">
              <FireExtinguisher className="w-10 h-10 text-white" />
            </div>
            <div>
              <Button type="button" variant="outline" size="sm" className="font-bold" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Alterar Logo (em breve)
              </Button>
              <p className="text-xs text-slate-400 mt-1">PNG ou JPG, máx. 2 MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Razão Social</Label>
              <Input
                value={empresa.company_name}
                onChange={(e) => setEmpresa((p) => ({ ...p, company_name: e.target.value }))}
                placeholder="FireControl Segurança Ltda."
                className="mt-1"
              />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input
                value={empresa.company_cnpj}
                onChange={(e) => setEmpresa((p) => ({ ...p, company_cnpj: e.target.value }))}
                placeholder="12.345.678/0001-90"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={empresa.company_phone}
                onChange={(e) => setEmpresa((p) => ({ ...p, company_phone: e.target.value }))}
                placeholder="(11) 99000-0000"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>E-mail Comercial</Label>
              <Input
                type="email"
                value={empresa.company_email}
                onChange={(e) => setEmpresa((p) => ({ ...p, company_email: e.target.value }))}
                placeholder="contato@firecontrol.com.br"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={empresa.company_address}
                onChange={(e) => setEmpresa((p) => ({ ...p, company_address: e.target.value }))}
                placeholder="Av. Paulista, 1000 — Bela Vista, São Paulo, SP"
                className="mt-1"
              />
            </div>
            <div>
              <Label>CREA Responsável Técnico</Label>
              <Input
                value={empresa.crea_responsavel}
                onChange={(e) => setEmpresa((p) => ({ ...p, crea_responsavel: e.target.value }))}
                placeholder="CREA-SP 123456"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Alvará de Funcionamento</Label>
              <Input
                value={empresa.alvara_funcionamento}
                onChange={(e) => setEmpresa((p) => ({ ...p, alvara_funcionamento: e.target.value }))}
                placeholder="ALV-2026/000123"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            Personalização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome do Sistema (exibido no menu)</Label>
            <Input
              value={empresa.system_name}
              onChange={(e) => setEmpresa((p) => ({ ...p, system_name: e.target.value }))}
              placeholder="FireControl"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Cor Principal</Label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={empresa.primary_color}
                onChange={(e) => setEmpresa((p) => ({ ...p, primary_color: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
              />
              <Input
                value={empresa.primary_color}
                onChange={(e) => setEmpresa((p) => ({ ...p, primary_color: e.target.value }))}
                className="w-32"
              />
              <span className="text-sm text-slate-500">Cor tema</span>
            </div>
          </div>
          <Button
            className={cn("font-bold", saved ? "bg-emerald-600" : "bg-red-600 hover:bg-red-700 text-white")}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {loading ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function TabNotificacoes({
  studioId,
  data,
  onSaved,
}: {
  studioId: string | null
  data: Record<string, boolean>
  onSaved?: () => void
}) {
  const [notifs, setNotifs] = useState(data)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setNotifs(data)
  }, [data])

  const toggle = (key: keyof typeof notifs) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleSave = async () => {
    if (!studioId) {
      toast.error("Estúdio não identificado.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, notificacoes: notifs }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao salvar")
      toast.success("Preferências de notificação salvas!")
      onSaved?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  const grupos = [
    {
      titulo: "Alertas Operacionais",
      items: [
        { key: "extintor_vencendo", label: "Extintor vencendo (30 dias antes)", sub: "Alerta automático por e-mail e WhatsApp" },
        { key: "vistoria_proxima", label: "Vistoria agendada se aproximando", sub: "Notifica 3 dias antes da vistoria" },
        { key: "os_nova", label: "Nova OS criada", sub: "Notifica o técnico responsável" },
        { key: "os_concluida", label: "OS concluída", sub: "Notifica o cliente automaticamente" },
      ],
    },
    {
      titulo: "Financeiro",
      items: [
        { key: "pagamento_pendente", label: "Pagamento pendente", sub: "Aviso 3 dias antes do vencimento" },
        { key: "relatorio_semanal", label: "Relatório semanal de faturamento", sub: "Toda segunda-feira às 8h" },
      ],
    },
    {
      titulo: "Canais de Notificação",
      items: [
        { key: "email_resumo", label: "Resumo diário por e-mail", sub: "Receba um resumo às 7h toda manhã" },
        { key: "sms_alertas", label: "SMS para alertas críticos", sub: "Extintores vencidos e OS urgentes" },
      ],
    },
  ]

  return (
    <div className="space-y-4">
      {grupos.map((grupo) => (
        <Card key={grupo.titulo} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-600" />
              {grupo.titulo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {grupo.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.sub}</p>
                </div>
                <Switch
                  checked={notifs[item.key as keyof typeof notifs]}
                  onCheckedChange={() => toggle(item.key as keyof typeof notifs)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Button className="bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleSave} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar notificações
      </Button>
    </div>
  )
}

function TabSeguranca() {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState({ current: "", new: "", confirm: "" })

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.new !== password.confirm) {
      toast.error("As senhas não coincidem.")
      return
    }
    if (password.new.length < 8) {
      toast.error("A nova senha deve ter no mínimo 8 caracteres.")
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: password.new })
      if (error) throw error
      toast.success("Senha atualizada com sucesso!")
      setPassword({ current: "", new: "", confirm: "" })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar senha")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Key className="w-5 h-5 text-red-600" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <Label>Senha atual</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password.current}
                onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nova senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password.new}
                onChange={(e) => setPassword((p) => ({ ...p, new: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password.confirm}
                onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Atualizar senha
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Autenticação de Dois Fatores
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">2FA via Autenticador</p>
            <p className="text-xs text-slate-500">Proteja sua conta com verificação extra</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700 border-0 font-bold">Inativo</Badge>
            <Button size="sm" variant="outline" className="font-bold">Ativar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { nome: "Admin Principal", email: "admin@firecontrol.com.br", role: "Administrador", status: "Você" },
            { nome: "Ricardo Alves", email: "ricardo@firecontrol.com.br", role: "Técnico", status: "Ativo" },
            { nome: "Fernanda Souza", email: "fernanda@firecontrol.com.br", role: "Técnico", status: "Ativo" },
          ].map((u) => (
            <div key={u.email} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-black text-sm">
                  {u.nome.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{u.nome}</p>
                  <p className="text-xs text-slate-400">{u.email} · {u.role}</p>
                </div>
              </div>
              <Badge className={cn(
                "text-xs font-bold border-0",
                u.status === "Você" ? "bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400"
              )}>
                {u.status}
              </Badge>
            </div>
          ))}
          <InviteUserButton />
        </CardContent>
      </Card>
    </div>
  )
}

function TabIntegracoes({ studioId, status, onSaved }: { studioId: string | null; status: Record<string, boolean>; onSaved?: () => void }) {
  const [waOpen, setWaOpen] = useState(false)
  const [geminiOpen, setGeminiOpen] = useState(false)
  const [smtpOpen, setSmtpOpen] = useState(false)
  const [mapsOpen, setMapsOpen] = useState(false)
  const [nfeOpen, setNfeOpen] = useState(false)
  const [waKey, setWaKey] = useState("")
  const [waInstance, setWaInstance] = useState("")
  const [geminiKey, setGeminiKey] = useState("")
  const [smtpForm, setSmtpForm] = useState({ host: "", port: "587", user: "", password: "", fromEmail: "", secure: true })
  const [mapsKey, setMapsKey] = useState("")
  const [nfeKey, setNfeKey] = useState("")
  const [loading, setLoading] = useState(false)

  const integracoes = [
    { id: "whatsapp", nome: "WhatsApp Business API", sub: "Envio de mensagens automatizadas", icone: Phone, color: "text-green-600", bg: "bg-green-600/10", configurable: true },
    { id: "gemini", nome: "Chat IA (Gemini)", sub: "Assistente inteligente integrado", icone: MessageSquare, color: "text-purple-600", bg: "bg-purple-600/10", configurable: true },
    { id: "smtp", nome: "E-mail (SMTP)", sub: "Envio de laudos e relatórios", icone: Mail, color: "text-blue-600", bg: "bg-blue-600/10", configurable: true },
    { id: "google_maps", nome: "Google Maps", sub: "Visualização de endereços de clientes", icone: MapPin, color: "text-red-600", bg: "bg-red-600/10", configurable: true },
    { id: "nfe", nome: "Nota Fiscal Eletrônica", sub: "Emissão automática de NF-e", icone: CreditCard, color: "text-amber-600", bg: "bg-amber-600/10", configurable: true },
  ]

  const saveWhatsApp = async () => {
    if (!studioId || !waKey.trim()) {
      toast.error("Informe a API Key do WhatsApp.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          integracoes: {
            whatsapp: { apiKey: waKey.trim(), instanceId: waInstance.trim() || undefined },
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao salvar")
      toast.success("WhatsApp configurado com sucesso!")
      setWaOpen(false)
      onSaved?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  const saveGemini = async () => {
    if (!studioId || !geminiKey.trim()) {
      toast.error("Informe a API Key do Gemini.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          integracoes: {
            gemini: { apiKey: geminiKey.trim() },
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao salvar")
      toast.success("Chat IA (Gemini) configurado com sucesso!")
      setGeminiOpen(false)
      onSaved?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  const saveSmtp = async () => {
    if (!studioId || !smtpForm.host.trim() || !smtpForm.user.trim() || !smtpForm.password) {
      toast.error("Preencha host, usuário e senha.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          integracoes: {
            smtp: {
              host: smtpForm.host.trim(),
              port: smtpForm.port.trim() || "587",
              user: smtpForm.user.trim(),
              password: smtpForm.password,
              fromEmail: smtpForm.fromEmail.trim() || smtpForm.user.trim(),
              secure: smtpForm.secure,
            },
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao salvar")
      toast.success("E-mail (SMTP) configurado com sucesso!")
      setSmtpOpen(false)
      onSaved?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  const saveMaps = async () => {
    if (!studioId || !mapsKey.trim()) {
      toast.error("Informe a API Key do Google Maps.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          integracoes: {
            google_maps: { apiKey: mapsKey.trim() },
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao salvar")
      toast.success("Google Maps configurado com sucesso!")
      setMapsOpen(false)
      onSaved?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  const saveNfe = async () => {
    if (!studioId || !nfeKey.trim()) {
      toast.error("Informe a API Key da NF-e.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/fire-protection/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          integracoes: {
            nfe: { apiKey: nfeKey.trim() },
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao salvar")
      toast.success("Nota Fiscal Eletrônica configurada com sucesso!")
      setNfeOpen(false)
      onSaved?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {integracoes.map((integ) => {
        const ativo = status[integ.id] ?? false
        return (
          <Card key={integ.nome} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", integ.bg)}>
                <integ.icone className={cn("w-5 h-5", integ.color)} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white">{integ.nome}</h3>
                <p className="text-sm text-slate-500">{integ.sub}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={cn(
                  "font-bold border-0 text-xs",
                  ativo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-600/20"
                )}>
                  {ativo ? "Conectado" : "Desconectado"}
                </Badge>
                {integ.configurable && integ.id === "whatsapp" && (
                  <Dialog open={waOpen} onOpenChange={setWaOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="font-bold">{ativo ? "Configurar" : "Conectar"}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>WhatsApp Business API</DialogTitle>
                        <DialogDescription>Informe a chave da API e o ID da instância (Evolution API ou similar).</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label>API Key</Label>
                          <Input type="password" placeholder="Sua API Key" value={waKey} onChange={(e) => setWaKey(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label>ID da Instância (opcional)</Label>
                          <Input placeholder="instance-id" value={waInstance} onChange={(e) => setWaInstance(e.target.value)} className="mt-1" />
                        </div>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={saveWhatsApp} disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Salvar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {integ.configurable && integ.id === "gemini" && (
                  <Dialog open={geminiOpen} onOpenChange={setGeminiOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="font-bold">{ativo ? "Configurar" : "Conectar"}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Chat IA (Gemini)</DialogTitle>
                        <DialogDescription>Informe sua API Key do Google AI Studio.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label>API Key</Label>
                          <Input type="password" placeholder="Sua API Key do Gemini" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="mt-1" autoComplete="off" />
                        </div>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={saveGemini} disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Salvar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {integ.configurable && integ.id === "smtp" && (
                  <Dialog open={smtpOpen} onOpenChange={setSmtpOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="font-bold">{ativo ? "Configurar" : "Conectar"}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>E-mail (SMTP)</DialogTitle>
                        <DialogDescription>Configure o envio de laudos e relatórios por e-mail.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label>Servidor (host)</Label>
                          <Input placeholder="smtp.exemplo.com" value={smtpForm.host} onChange={(e) => setSmtpForm((p) => ({ ...p, host: e.target.value }))} className="mt-1" autoComplete="off" />
                        </div>
                        <div>
                          <Label>Porta</Label>
                          <Input placeholder="587" value={smtpForm.port} onChange={(e) => setSmtpForm((p) => ({ ...p, port: e.target.value }))} className="mt-1" type="number" />
                        </div>
                        <div>
                          <Label>Usuário</Label>
                          <Input type="email" placeholder="noreply@empresa.com" value={smtpForm.user} onChange={(e) => setSmtpForm((p) => ({ ...p, user: e.target.value }))} className="mt-1" autoComplete="off" />
                        </div>
                        <div>
                          <Label>Senha</Label>
                          <Input type="password" placeholder="••••••••" value={smtpForm.password} onChange={(e) => setSmtpForm((p) => ({ ...p, password: e.target.value }))} className="mt-1" autoComplete="new-password" />
                        </div>
                        <div>
                          <Label>E-mail remetente (opcional)</Label>
                          <Input type="email" placeholder="Igual ao usuário se vazio" value={smtpForm.fromEmail} onChange={(e) => setSmtpForm((p) => ({ ...p, fromEmail: e.target.value }))} className="mt-1" autoComplete="off" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={smtpForm.secure} onCheckedChange={(v) => setSmtpForm((p) => ({ ...p, secure: v }))} />
                          <Label>Usar TLS/SSL</Label>
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={saveSmtp} disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Salvar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {integ.configurable && integ.id === "google_maps" && (
                  <Dialog open={mapsOpen} onOpenChange={setMapsOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="font-bold">{ativo ? "Configurar" : "Conectar"}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Google Maps</DialogTitle>
                        <DialogDescription>Informe sua API Key do Google Cloud (Maps JavaScript API habilitada).</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label>API Key</Label>
                          <Input type="password" placeholder="Sua API Key do Google Maps" value={mapsKey} onChange={(e) => setMapsKey(e.target.value)} className="mt-1" autoComplete="off" />
                        </div>
                        <Button className="w-full bg-red-600 hover:bg-red-700" onClick={saveMaps} disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Salvar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {integ.configurable && integ.id === "nfe" && (
                  <Dialog open={nfeOpen} onOpenChange={setNfeOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="font-bold">{ativo ? "Configurar" : "Conectar"}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nota Fiscal Eletrônica</DialogTitle>
                        <DialogDescription>Informe a API Key do seu provedor de NF-e (ex: Focus NFe, NFe.io, etc.).</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label>API Key</Label>
                          <Input type="password" placeholder="Sua API Key da NF-e" value={nfeKey} onChange={(e) => setNfeKey(e.target.value)} className="mt-1" autoComplete="off" />
                        </div>
                        <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={saveNfe} disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Salvar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("empresa")
  const [studioId, setStudioId] = useState<string | null>(null)
  const [config, setConfig] = useState<{
    company_name: string
    company_cnpj: string
    company_phone: string
    company_email: string
    company_address: string
    crea_responsavel: string
    alvara_funcionamento: string
    system_name: string
    primary_color: string
    notificacoes: Record<string, boolean>
    integracoes_status: Record<string, boolean>
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const sid = session?.user?.user_metadata?.studio_id ?? (() => {
        try {
          const u = JSON.parse(localStorage.getItem("danceflow_user") || "{}")
          return u.studio_id || u.studioId || null
        } catch {
          return null
        }
      })()
      if (!mounted || !sid) {
        setLoading(false)
        return
      }
      setStudioId(sid)
      try {
        const res = await fetch(`/api/fire-protection/configuracoes?studioId=${sid}`, { credentials: "include" })
        if (res.ok && mounted) {
          const data = await res.json()
          setConfig({
            company_name: data.company_name || "",
            company_cnpj: data.company_cnpj || "",
            company_phone: data.company_phone || "",
            company_email: data.company_email || "",
            company_address: data.company_address || "",
            crea_responsavel: data.crea_responsavel || "",
            alvara_funcionamento: data.alvara_funcionamento || "",
            system_name: data.system_name || "FireControl",
            primary_color: data.primary_color || "#dc2626",
            notificacoes: data.notificacoes || {
              extintor_vencendo: true,
              vistoria_proxima: true,
              os_nova: true,
              os_concluida: true,
              pagamento_pendente: true,
              relatorio_semanal: false,
              email_resumo: true,
              sms_alertas: false,
            },
            integracoes_status: data.integracoes_status || {},
          })
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const reloadConfig = () => {
    if (!studioId) return
    fetch(`/api/fire-protection/configuracoes?studioId=${studioId}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data)
          setConfig({
            company_name: data.company_name || "",
            company_cnpj: data.company_cnpj || "",
            company_phone: data.company_phone || "",
            company_email: data.company_email || "",
            company_address: data.company_address || "",
            crea_responsavel: data.crea_responsavel || "",
            alvara_funcionamento: data.alvara_funcionamento || "",
            system_name: data.system_name || "FireControl",
            primary_color: data.primary_color || "#dc2626",
            notificacoes: data.notificacoes || {},
            integracoes_status: data.integracoes_status || {},
          })
      })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-red-600" />
          Configurações
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Gerencie as configurações do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "empresa" && config && (
        <TabEmpresa
          studioId={studioId}
          data={{
            company_name: config.company_name,
            company_cnpj: config.company_cnpj,
            company_phone: config.company_phone,
            company_email: config.company_email,
            company_address: config.company_address,
            crea_responsavel: config.crea_responsavel,
            alvara_funcionamento: config.alvara_funcionamento,
            system_name: config.system_name,
            primary_color: config.primary_color,
          }}
        />
      )}
      {activeTab === "notificacoes" && config && (
        <TabNotificacoes studioId={studioId} data={config.notificacoes} onSaved={reloadConfig} />
      )}
      {activeTab === "seguranca" && <TabSeguranca />}
      {activeTab === "integrações" && config && (
        <TabIntegracoes studioId={studioId} status={config.integracoes_status} onSaved={reloadConfig} />
      )}
    </div>
  )
}
