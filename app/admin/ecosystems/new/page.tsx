"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Copy, Check, Sparkles, Building2 } from "lucide-react"
import { nicheDictionary, NicheType } from "@/config/niche-dictionary"
import { createEcosystemInvite } from "@/lib/actions/ecosystem"
import { getDefaultModulesForNiche } from "@/config/niche-modules"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { pluralize } from "@/lib/pluralize"
import { useVocabulary } from "@/hooks/use-vocabulary"

const GET_AVAILABLE_MODULES = (vocabulary: any, t: any) => [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'students', label: `Gestão de ${pluralize(vocabulary.client)}` },
  { id: 'classes', label: `Gestão de ${pluralize(vocabulary.service)}` },
  { id: 'financial', label: 'Financeiro' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'ai_chat', label: 'IA Chat' },
  { id: 'pos', label: 'PDV (Ponto de Venda)' },
  { id: 'scanner', label: 'Scanner' },
  { id: 'inventory', label: 'Estoque/Inventário' },
  { id: 'leads', label: 'Leads (CRM)' },
  { id: 'gamification', label: 'Gamificação' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'multi_unit', label: 'Multi-unidade' },
  { id: 'erp', label: 'ERP' },
  { id: 'service_orders', label: t.service_orders.title },
]

type PackageType = 'custom' | 'basic' | 'pro'

const PACKAGES = {
  basic: {
    label: 'Básico (3 Módulos)',
    modules: ['dashboard', 'students', 'classes'],
    limit: 3
  },
  pro: {
    label: 'Profissional (11 Módulos)',
    modules: ['dashboard', 'students', 'classes', 'financial', 'whatsapp', 'ai_chat', 'pos', 'scanner', 'marketplace', 'erp', 'service_orders'],
    limit: 11
  }
}

export default function NewEcosystemPage() {
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [packageType, setPackageType] = useState<PackageType>('custom')
  const { t, vocabulary } = useVocabulary()
  const [formData, setFormData] = useState({
    name: "",
    clientEmail: "",
    niche: "law" as NicheType,
    businessModel: "CREDIT" as "CREDIT" | "MONETARY",
    studioSlug: "",
  })
  const [modules, setModules] = useState<Record<string, boolean>>(getDefaultModulesForNiche("law"))

  const currentVocabulary = nicheDictionary.pt[formData.niche] || nicheDictionary.pt.dance
  const availableModules = GET_AVAILABLE_MODULES(currentVocabulary, t)

  const handleNicheChange = (niche: NicheType) => {
    setFormData(prev => ({ ...prev, niche }))
    // Ao mudar o nicho, carregamos os módulos padrão dele
    const defaultModules = getDefaultModulesForNiche(niche)
    setModules(defaultModules)
  }

  const handlePackageChange = (type: PackageType) => {
    setPackageType(type)
    if (type === 'custom') return

    const newModules: Record<string, boolean> = {}
    availableModules.forEach(m => {
      newModules[m.id] = PACKAGES[type].modules.includes(m.id)
    })
    setModules(newModules)
  }

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    if (packageType !== 'custom') {
      setPackageType('custom')
    }
    setModules(prev => ({...prev, [moduleId]: checked}))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 1. Validar Sessão Client-Side
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session || !session.access_token) {
         console.error("❌ Sessão inválida no client:", sessionError)
         toast.error("Sessão expirada ou inválida. Por favor, faça login novamente.")
         // Opcional: Redirecionar para login
         // window.location.href = '/login'
         return
      }

      console.log("🔑 Token encontrado, enviando para server action...")

        const result = await createEcosystemInvite({
        name: formData.name,
        niche: formData.niche,
        clientEmail: formData.clientEmail,
        businessModel: formData.businessModel,
        modules: modules,
        accessToken: session.access_token // Passar token garantido
      })
      
      setInviteUrl(result.inviteUrl)
      toast.success("Ecossistema criado com sucesso!")
    } catch (error: any) {
      console.error("❌ Erro no submit:", error)
      toast.error(error.message || "Erro ao criar ecossistema")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      toast.success("Link copiado!")
    }
  }

  if (inviteUrl) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
        <AdminHeader title="Sistema Criado" />
        <div className="p-8 max-w-2xl mx-auto w-full">
          <Card className="border-emerald-500/50 bg-emerald-500/5">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <CardTitle className="text-2xl">Pronto para ativação!</CardTitle>
              <CardDescription>
                O sistema <strong>{formData.name}</strong> foi configurado. Envie o link abaixo para o seu cliente criar a conta e assumir o controle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Link de Resgate</Label>
                <div className="flex gap-2">
                  <Input value={inviteUrl} readOnly className="bg-white dark:bg-slate-900 font-mono" />
                  <Button onClick={copyToClipboard} variant="outline">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => setInviteUrl(null)} variant="outline" className="w-full">
                  Criar Outro
                </Button>
                <Button className="w-full" onClick={() => window.open(inviteUrl, '_blank')}>
                  Testar Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <AdminHeader title="Novo Ecossistema" />
      
      <div className="p-8 max-w-[1200px] mx-auto w-full">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Informações básicas para configurar o ambiente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Negócio</Label>
                  <Input 
                    placeholder="Ex: Studio Viva Vida" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email do Cliente (Opcional)</Label>
                  <Input 
                    placeholder="cliente@email.com" 
                    type="email"
                    value={formData.clientEmail}
                    onChange={e => setFormData({...formData, clientEmail: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Usado apenas para registro, o link de ativação será gerado para você.</p>
                </div>
                <div className="space-y-2">
                  <Label>Nicho de Atuação</Label>
                  <Select 
                    value={formData.niche} 
                    onValueChange={v => handleNicheChange(v as NicheType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(nicheDictionary.pt).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          <span className="font-bold">{value.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground italic">
                            ({value.establishment}, {value.client}, {value.service})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modelo de Cobrança</Label>
                  <Select 
                    value={formData.businessModel} 
                    onValueChange={v => setFormData({...formData, businessModel: v as "CREDIT" | "MONETARY"})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDIT">
                        <span className="font-bold">Créditos (Flex Pass)</span>
                        <span className="ml-2 text-xs text-muted-foreground italic">
                          (Ideal para pacotes de aulas)
                        </span>
                      </SelectItem>
                      <SelectItem value="MONETARY">
                        <span className="font-bold">Monetário (Direto)</span>
                        <span className="ml-2 text-xs text-muted-foreground italic">
                          (Cobrança em moeda por serviço)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Módulos Ativos</CardTitle>
                    <CardDescription>Selecione o que estará disponível neste plano.</CardDescription>
                  </div>
                  <Select 
                    value={packageType} 
                    onValueChange={(v: PackageType) => handlePackageChange(v)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione um pacote" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Personalizado</SelectItem>
                      <SelectItem value="basic">Básico (3 Módulos)</SelectItem>
                      <SelectItem value="pro">Profissional (Completo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableModules.map(mod => (
                    <div key={mod.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <Label htmlFor={mod.id} className="cursor-pointer flex flex-col">
                        <span>{mod.label}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Módulo {mod.id}</span>
                      </Label>
                      <Switch 
                        id={mod.id}
                        checked={modules[mod.id] || false}
                        onCheckedChange={c => handleModuleToggle(mod.id, c)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader>
                <CardTitle className="text-indigo-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" /> Vocabulário Adaptado
                </CardTitle>
                <CardDescription>Como o sistema será apresentado para este nicho.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-600 font-bold uppercase">Estabelecimento</span>
                    <p className="text-lg font-medium">{currentVocabulary.establishment}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-600 font-bold uppercase">Cliente</span>
                    <p className="text-lg font-medium">{currentVocabulary.client}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-600 font-bold uppercase">Profissional</span>
                    <p className="text-lg font-medium">{currentVocabulary.provider}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-600 font-bold uppercase">Serviço</span>
                    <p className="text-lg font-medium">{currentVocabulary.service}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-600 font-bold uppercase">Categoria</span>
                    <p className="text-lg font-medium">{currentVocabulary.category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-indigo-600 text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Feature Builder
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  {packageType === 'custom' 
                    ? "Você está criando um sistema personalizado." 
                    : `Pacote selecionado: ${PACKAGES[packageType as keyof typeof PACKAGES]?.label || 'Personalizado'}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/10 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Módulos:</span>
                    <span className="font-bold">{Object.values(modules).filter(Boolean).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Nicho:</span>
                    <span className="font-bold capitalize">{formData.niche}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tipo:</span>
                    <span className="font-bold capitalize">
                      {packageType === 'custom' ? 'Personalizado' : packageType}
                    </span>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold h-12"
                  disabled={loading || !formData.name}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar Ecossistema"}
                </Button>
              </CardContent>
            </Card>
          </div>

        </form>
      </div>
    </div>
  )
}
