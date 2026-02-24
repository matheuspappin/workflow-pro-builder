"use client"

import { useState } from "react"
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

function TabEmpresa() {
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
              <Button variant="outline" size="sm" className="font-bold">
                <Upload className="w-4 h-4 mr-2" />
                Alterar Logo
              </Button>
              <p className="text-xs text-slate-400 mt-1">PNG ou JPG, máx. 2 MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Razão Social</Label>
              <Input defaultValue="FireControl Segurança Ltda." className="mt-1" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input defaultValue="12.345.678/0001-90" className="mt-1" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input defaultValue="(11) 99000-0000" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>E-mail Comercial</Label>
              <Input defaultValue="contato@firecontrol.com.br" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Endereço</Label>
              <Input defaultValue="Av. Paulista, 1000 — Bela Vista, São Paulo, SP" className="mt-1" />
            </div>
            <div>
              <Label>CREA Responsável Técnico</Label>
              <Input defaultValue="CREA-SP 123456" className="mt-1" />
            </div>
            <div>
              <Label>Alvará de Funcionamento</Label>
              <Input defaultValue="ALV-2026/000123" className="mt-1" />
            </div>
          </div>

          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
            <Save className="w-4 h-4 mr-2" />
            Salvar alterações
          </Button>
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
            <Input defaultValue="FireControl" className="mt-1" />
          </div>
          <div>
            <Label>Cor Principal</Label>
            <div className="flex items-center gap-3 mt-1">
              <input type="color" defaultValue="#dc2626" className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200" />
              <Input defaultValue="#dc2626" className="w-32" />
              <span className="text-sm text-slate-500">Vermelho (padrão)</span>
            </div>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
            <Save className="w-4 h-4 mr-2" />
            Salvar personalização
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function TabNotificacoes() {
  const [notifs, setNotifs] = useState({
    extintor_vencendo: true,
    vistoria_proxima: true,
    os_nova: true,
    os_concluida: true,
    pagamento_pendente: true,
    relatorio_semanal: false,
    email_resumo: true,
    sms_alertas: false,
  })

  const toggle = (key: keyof typeof notifs) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))

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
    </div>
  )
}

function TabSeguranca() {
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
          <div>
            <Label>Senha atual</Label>
            <Input type="password" placeholder="••••••••" className="mt-1" />
          </div>
          <div>
            <Label>Nova senha</Label>
            <Input type="password" placeholder="••••••••" className="mt-1" />
          </div>
          <div>
            <Label>Confirmar nova senha</Label>
            <Input type="password" placeholder="••••••••" className="mt-1" />
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
            <Save className="w-4 h-4 mr-2" />
            Atualizar senha
          </Button>
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

function TabIntegracoes() {
  const integracoes = [
    { nome: "WhatsApp Business API", sub: "Envio de mensagens automatizadas", ativo: true, icone: Phone, color: "text-green-600", bg: "bg-green-600/10" },
    { nome: "Chat IA (Gemini)", sub: "Assistente inteligente integrado", ativo: true, icone: MessageSquare, color: "text-purple-600", bg: "bg-purple-600/10" },
    { nome: "E-mail (SMTP)", sub: "Envio de laudos e relatórios", ativo: true, icone: Mail, color: "text-blue-600", bg: "bg-blue-600/10" },
    { nome: "Google Maps", sub: "Visualização de endereços de clientes", ativo: false, icone: MapPin, color: "text-red-600", bg: "bg-red-600/10" },
    { nome: "Nota Fiscal Eletrônica", sub: "Emissão automática de NF-e", ativo: false, icone: CreditCard, color: "text-amber-600", bg: "bg-amber-600/10" },
  ]

  return (
    <div className="space-y-3">
      {integracoes.map((integ) => (
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
                integ.ativo
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-600/20"
              )}>
                {integ.ativo ? "Conectado" : "Desconectado"}
              </Badge>
              <Button size="sm" variant="outline" className="font-bold">
                {integ.ativo ? "Configurar" : "Conectar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("empresa")

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

      {activeTab === "empresa" && <TabEmpresa />}
      {activeTab === "notificacoes" && <TabNotificacoes />}
      {activeTab === "seguranca" && <TabSeguranca />}
      {activeTab === "integrações" && <TabIntegracoes />}
    </div>
  )
}
