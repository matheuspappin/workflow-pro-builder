"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Copy, Check, Sparkles, Building2, LogOut } from "lucide-react"
import { nicheDictionary, NicheType } from "@/config/niche-dictionary"
import { createEcosystemInvite } from "@/lib/actions/ecosystem"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { pluralize } from "@/lib/pluralize"

const GET_AVAILABLE_MODULES = (vocabulary: any) => [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'students', label: `Gestão de ${pluralize(vocabulary.client)}` },
  { id: 'classes', label: `Gestão de ${pluralize(vocabulary.service)}` },
  { id: 'financial', label: 'Financeiro' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'ai_chat', label: 'IA Chat' },
  { id: 'pos', label: 'PDV (Ponto de Venda)' },
  { id: 'scanner', label: 'Scanner' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'erp', label: 'ERP' },
]

type PackageType = 'custom' | 'basic' | 'pro'

const PACKAGES = {
  basic: {
    label: 'Básico (3 Módulos)',
    modules: ['dashboard', 'students', 'classes'],
    limit: 3
  },
  pro: {
    label: 'Profissional (10 Módulos)',
    modules: ['dashboard', 'students', 'classes', 'financial', 'whatsapp', 'ai_chat', 'pos', 'scanner', 'marketplace', 'erp'],
    limit: 10
  }
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  partnerId?: string;
}

export default function NewAffiliateEcosystemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [packageType, setPackageType] = useState<PackageType>('custom')
  const [user, setUser] = useState<User | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    clientEmail: "",
    niche: "law" as NicheType,
    studioSlug: "",
  })
  const [modules, setModules] = useState<Record<string, boolean>>({
    dashboard: true,
    students: true,
    classes: true,
    financial: true,
    whatsapp: true,
    ai_chat: true,
    pos: true,
    scanner: true,
    marketplace: true,
    erp: true
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/portal/affiliate/login")
        return
      }

      const storedUser = localStorage.getItem("danceflow_user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.role !== 'partner' && parsedUser.role !== 'admin' && parsedUser.role !== 'super_admin') {
           toast.error("Acesso restrito: Esta área é apenas para afiliados.")
           router.push("/portal/login")
           return
        }
        setUser(parsedUser)
      } else {
        // Fallback: if not in localStorage, try to fetch from API
        // For now, redirect to login if not found, to keep it simple
        toast.error("Sessão expirada ou inválida. Faça login novamente.")
        router.push("/portal/affiliate/login")
        return
      }
    }

    checkAuth()
  }, [router])

  const currentVocabulary = nicheDictionary[formData.niche] || nicheDictionary.dance
  const availableModules = GET_AVAILABLE_MODULES(currentVocabulary)

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
    
    if (!user || !user.partnerId) {
      toast.error("Erro: ID de parceiro não encontrado para criar o ecossistema.")
      setLoading(false)
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session || !session.access_token) {
         console.error("❌ Sessão inválida no client:", sessionError)
         toast.error("Sessão expirada ou inválida. Por favor, faça login novamente.")
         router.push("/portal/affiliate/login")
         return
      }

      console.log("🔑 Token encontrado, enviando para server action...")

      const result = await createEcosystemInvite({
        name: formData.name,
        niche: formData.niche,
        clientEmail: formData.clientEmail,
        modules: modules,
        accessToken: session.access_token,
        partnerId: user.partnerId // Passar o partnerId do afiliado logado
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("danceflow_user")
    router.push("/portal/affiliate/login")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (inviteUrl) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
         <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">Portal do Afiliado</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="w-5 h-5 text-slate-500 hover:text-red-600" />
              </Button>
            </div>
          </header>
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
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Portal do Afiliado</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="w-5 h-5 text-slate-500 hover:text-red-600" />
          </Button>
        </div>
      </header>
      
      <div className="p-8 max-w-[1200px] mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Novo Ecossistema para Cliente</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">Crie e configure um novo sistema (estúdio) para o seu cliente, vinculado à sua conta de afiliado.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Informações básicas para configurar o ambiente do cliente.</CardDescription>
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
                  <p className="text-xs text-muted-foreground">Opcional. Se preenchido, o link de ativação será enviado para este e-mail. Caso contrário, você pode copiar o link e enviar manualmente.</p>
                </div>
                <div className="space-y-2">
                  <Label>Nicho de Atuação</Label>
                  <Select 
                    value={formData.niche} 
                    onValueChange={v => setFormData({...formData, niche: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(nicheDictionary).map(([key, value]) => (
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
                  <Sparkles className="w-5 h-5" /> Sumário do Sistema
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
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar Sistema para Cliente"}
                </Button>
              </CardContent>
            </Card>
          </div>

        </form>
      </div>
    </div>
  )
}
