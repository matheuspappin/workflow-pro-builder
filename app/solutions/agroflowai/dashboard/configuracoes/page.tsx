"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Settings, Building2, Bell, Shield, Satellite, Globe,
  Save, Loader2, User, Mail, Phone, MapPin, FileText,
  Eye, EyeOff, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<"empresa" | "notificacoes" | "seguranca" | "modulos">("empresa")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  const [empresa, setEmpresa] = useState({
    name: "",
    email: "",
    phone: "",
    cnpj: "",
    address: "",
    crea_responsible: "",
    responsible_name: "",
    website: "",
  })

  const [notifications, setNotifications] = useState({
    satellite_alerts: true,
    os_updates: true,
    new_leads: true,
    car_expiry: true,
    financial_overdue: true,
    email_reports: false,
    whatsapp_alerts: false,
  })

  const [modules, setModules] = useState({
    satellite_monitor: true,
    car_regularization: true,
    work_orders: true,
    laudos: true,
    financial: true,
    leads_crm: true,
    client_portal: true,
    reports: true,
  })

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const getStudioId = () => {
    try { return JSON.parse(localStorage.getItem("workflow_user") || "{}").studioId || "" } catch { return "" }
  }

  useEffect(() => {
    async function loadData() {
      const studioId = getStudioId()
      if (!studioId) return
      try {
        const res = await fetch(`/api/agroflowai/configuracoes?studioId=${studioId}`)
        if (!res.ok) return
        const data = await res.json()
        setEmpresa({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          cnpj: data.cnpj || "",
          address: data.address || "",
          crea_responsible: data.crea_responsible || "",
          responsible_name: data.responsible_name || "",
          website: data.website || "",
        })
        if (data.modules && Object.keys(data.modules).length > 0) {
          setModules(prev => ({ ...prev, ...data.modules }))
        }
      } catch {}
    }
    loadData()
  }, [])

  const handleSaveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const studioId = getStudioId()
      const res = await fetch("/api/agroflowai/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, empresa }),
      })
      if (!res.ok) throw new Error("Erro ao salvar")
      setSaved(true)
      toast({ title: "Configurações salvas!", description: "Dados da empresa atualizados com sucesso." })
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast({ title: "Erro ao salvar configurações", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.new !== password.confirm) {
      toast({ title: "Senhas não coincidem", variant: "destructive" })
      return
    }
    if (password.new.length < 8) {
      toast({ title: "Senha muito curta", description: "Mínimo 8 caracteres", variant: "destructive" })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: password.new })
    setLoading(false)
    if (error) {
      toast({ title: "Erro ao atualizar senha", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Senha atualizada com sucesso!" })
      setPassword({ current: "", new: "", confirm: "" })
    }
  }

  const tabs = [
    { key: "empresa", label: "Empresa", icon: Building2 },
    { key: "notificacoes", label: "Notificações", icon: Bell },
    { key: "modulos", label: "Módulos", icon: Settings },
    { key: "seguranca", label: "Segurança", icon: Shield },
  ] as const

  const modulesList = [
    { key: "satellite_monitor", label: "Monitor Satelital", desc: "NDVI, alertas INPE, MapBiomas", icon: Satellite },
    { key: "car_regularization", label: "Regularização CAR", desc: "Laudos e cadastro ambiental rural", icon: FileText },
    { key: "work_orders", label: "Ordens de Serviço", desc: "Gestão de OS e vistorias", icon: Settings },
    { key: "laudos", label: "Laudos Técnicos", desc: "Emissão e gestão de laudos", icon: FileText },
    { key: "financial", label: "Financeiro", desc: "Controle de receitas e despesas", icon: Building2 },
    { key: "leads_crm", label: "Leads / CRM", desc: "Pipeline de captação de clientes", icon: User },
    { key: "client_portal", label: "Portal do Cliente", desc: "Acesso do proprietário rural", icon: Globe },
    { key: "reports", label: "Relatórios & CAR", desc: "Geração de relatórios ambientais", icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Configurações</h1>
        <p className="text-slate-400 mt-1">Gerencie sua empresa, notificações, módulos e segurança</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === t.key
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Empresa Tab */}
      {activeTab === "empresa" && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Dados da Consultoria Ambiental
            </CardTitle>
            <CardDescription className="text-slate-500">
              Informações que aparecem nos laudos e documentos emitidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveEmpresa} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2 col-span-full">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome da Consultoria</Label>
                  <Input
                    value={empresa.name}
                    onChange={(e) => setEmpresa({ ...empresa, name: e.target.value })}
                    placeholder="Ex: Consultoria Ambiental Verde"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Engenheiro Responsável</Label>
                  <Input
                    value={empresa.responsible_name}
                    onChange={(e) => setEmpresa({ ...empresa, responsible_name: e.target.value })}
                    placeholder="Nome completo"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">CREA</Label>
                  <Input
                    value={empresa.crea_responsible}
                    onChange={(e) => setEmpresa({ ...empresa, crea_responsible: e.target.value })}
                    placeholder="Ex: CREA-SP 000000"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail Corporativo</Label>
                  <Input
                    type="email"
                    value={empresa.email}
                    onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                    placeholder="contato@consultoria.com"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Telefone / WhatsApp</Label>
                  <Input
                    value={empresa.phone}
                    onChange={(e) => setEmpresa({ ...empresa, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">CNPJ</Label>
                  <Input
                    value={empresa.cnpj}
                    onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2 col-span-full">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Endereço</Label>
                  <Input
                    value={empresa.address}
                    onChange={(e) => setEmpresa({ ...empresa, address: e.target.value })}
                    placeholder="Rua, Cidade, Estado, CEP"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2 col-span-full">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Website (opcional)</Label>
                  <Input
                    value={empresa.website}
                    onChange={(e) => setEmpresa({ ...empresa, website: e.target.value })}
                    placeholder="https://suaconsultoria.com"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full sm:w-auto font-bold rounded-xl h-11 px-8",
                  saved ? "bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                ) : saved ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Salvo!</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />Salvar Configurações</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notificações Tab */}
      {activeTab === "notificacoes" && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              Preferências de Notificações
            </CardTitle>
            <CardDescription className="text-slate-500">
              Escolha quais alertas e notificações deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "satellite_alerts", label: "Alertas Satelitais", desc: "Desmatamento, focos de incêndio, NDVI crítico" },
              { key: "os_updates", label: "Atualizações de OS", desc: "Mudanças de status em ordens de serviço" },
              { key: "new_leads", label: "Novos Leads", desc: "Notificações quando um lead é cadastrado" },
              { key: "car_expiry", label: "Vencimento de CAR", desc: "Alertas de regularizações próximas do vencimento" },
              { key: "financial_overdue", label: "Cobranças Vencidas", desc: "Receitas e cobranças em atraso" },
              { key: "email_reports", label: "Relatórios por E-mail", desc: "Relatórios mensais automáticos no e-mail" },
              { key: "whatsapp_alerts", label: "Alertas por WhatsApp", desc: "Notificações críticas via WhatsApp" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div>
                  <p className="font-bold text-white text-sm">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(v) => setNotifications(prev => ({ ...prev, [item.key]: v }))}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            ))}
            <Button
              onClick={() => {
                toast({ title: "Notificações salvas!" })
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Módulos Tab */}
      {activeTab === "modulos" && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Módulos do Sistema
            </CardTitle>
            <CardDescription className="text-slate-500">
              Ative ou desative funcionalidades conforme seu plano
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {modulesList.map(mod => {
              const Icon = mod.icon
              return (
                <div key={mod.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      modules[mod.key as keyof typeof modules] ? "bg-emerald-600/20" : "bg-slate-700"
                    )}>
                      <Icon className={cn("w-4 h-4", modules[mod.key as keyof typeof modules] ? "text-emerald-400" : "text-slate-500")} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{mod.label}</p>
                      <p className="text-xs text-slate-500">{mod.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={modules[mod.key as keyof typeof modules]}
                    onCheckedChange={async (v) => {
                      const updated = { ...modules, [mod.key]: v }
                      setModules(updated)
                      const studioId = getStudioId()
                      if (studioId) {
                        await fetch("/api/agroflowai/configuracoes", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ studioId, modules: { [mod.key]: v } }),
                        })
                      }
                    }}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Segurança Tab */}
      {activeTab === "seguranca" && (
        <div className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password.current}
                      onChange={(e) => setPassword({ ...password, current: e.target.value })}
                      placeholder="••••••••"
                      className="bg-slate-800 border-slate-700 text-white rounded-xl h-11 pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nova Senha</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirmar Nova Senha</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                    placeholder="Repita a nova senha"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Alterar Senha
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Segurança da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Autenticação de Dois Fatores (2FA)", desc: "Proteja sua conta com código extra de verificação", enabled: false },
                { label: "Sessões Ativas", desc: "Gerencie dispositivos conectados à sua conta", enabled: true },
                { label: "Histórico de Acesso", desc: "Registro de logins e atividades recentes", enabled: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                  <div>
                    <p className="font-bold text-white text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-slate-700 text-slate-400 hover:text-white rounded-xl">
                    {item.enabled ? "Gerenciar" : "Ativar"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
