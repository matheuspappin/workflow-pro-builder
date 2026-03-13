"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Copy, Check, Sparkles, Building2, Wallet, Package } from "lucide-react"
import { nicheDictionary, NicheType } from "@/config/niche-dictionary"
import { getDefaultModulesForNiche } from "@/config/niche-modules"
import { PROFESSIONAL_TIERS, getTierById, DEFAULT_PROFESSIONALS_TIER } from "@/config/professional-tiers"
import { pluralize } from "@/lib/pluralize"
import { getSystemModules } from "@/lib/actions/modules"
import { createEcosystemInvite } from "@/lib/actions/ecosystem"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useVocabulary } from "@/hooks/use-vocabulary"

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
  const [user, setUser] = useState<User | null>(null)
  const [commissionRate, setCommissionRate] = useState<number | null>(null)
  const [systemModules, setSystemModules] = useState<any[]>([])
  const [loadingModules, setLoadingModules] = useState(true)
  const { t, vocabulary } = useVocabulary()

  const [formData, setFormData] = useState({
    name: "",
    clientEmail: "",
    niche: "dance" as NicheType,
    businessModel: "CREDIT" as "CREDIT" | "MONETARY",
    studioSlug: "",
  })
  const [modules, setModules] = useState<Record<string, boolean>>({})
  const [professionalsTier, setProfessionalsTier] = useState<string>(DEFAULT_PROFESSIONALS_TIER)

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
        if (parsedUser.role !== 'affiliate' && parsedUser.role !== 'partner' && parsedUser.role !== 'admin' && parsedUser.role !== 'super_admin') {
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

  useEffect(() => {
    if (!user?.partnerId) return
    fetch('/api/affiliate/commission')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => data != null && typeof data.commissionRate === 'number' ? setCommissionRate(data.commissionRate) : setCommissionRate(0))
      .catch(() => setCommissionRate(0))
  }, [user?.partnerId])

  useEffect(() => {
    getSystemModules().then((data) => {
      setSystemModules(data || [])
      setLoadingModules(false)
    }).catch(() => setLoadingModules(false))
  }, [])

  useEffect(() => {
    if (systemModules.length === 0) return
    const suggested = getDefaultModulesForNiche(formData.niche)
    const next: Record<string, boolean> = {}
    systemModules.forEach((m) => {
      if ((suggested as any)[m.id] === true) {
        next[m.id] = true
      } else if (Number(m.price) === 0 && m.active) {
        if (!(m.id in suggested) || (suggested as any)[m.id] !== false) {
          next[m.id] = true
        }
      }
    })
    setModules(next)
  }, [formData.niche, systemModules])

  const currentVocabulary = nicheDictionary.pt[formData.niche] || nicheDictionary.pt.dance

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    setModules(prev => ({...prev, [moduleId]: checked}))
  }

  const modulesTotal = systemModules.reduce((acc, mod) => {
    if (modules[mod.id]) return acc + Number(mod.price || 0)
    return acc
  }, 0)
  const tier = getTierById(professionalsTier)
  const tierPrice = tier ? tier.price : 0
  const planTotal = modulesTotal + tierPrice

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
        businessModel: formData.businessModel,
        modules: modules,
        professionalsTier,
        accessToken: session.access_token,
        partnerId: user.partnerId
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (inviteUrl) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl my-8">
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
    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-4xl my-8 space-y-6">
        <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm border-border">
          <CardHeader>
            <CardTitle>Novo Ecossistema para Cliente</CardTitle>
            <CardDescription>
              Crie e configure um novo sistema (estúdio) para o seu cliente, vinculado à sua conta de afiliado.
            </CardDescription>
          </CardHeader>

          {commissionRate !== null && (
            <Card className={cn(
              "mx-6",
              commissionRate > 0
                ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/50"
                : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/50"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className={cn("w-4 h-4", commissionRate > 0 ? "text-emerald-600" : "text-amber-600")} />
                  Sua comissão ({commissionRate}%)
                </CardTitle>
                <CardDescription>
                  {commissionRate > 0
                    ? "Valores atualizados conforme você adiciona ou remove módulos e altera a faixa de profissionais."
                    : "Sua taxa ainda não foi configurada. Entre em contato com o administrador (vendaslachef)."}
                </CardDescription>
              </CardHeader>
              {commissionRate > 0 && (
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Plano atual (R$ {planTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês)
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      R$ {((planTotal * commissionRate) / 100).toFixed(2)}/mês
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Módulos + Faixa de {pluralize(currentVocabulary.provider)} = total. Sua comissão atualiza ao adicionar ou remover módulos.
                  </p>
                </CardContent>
              )}
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" id="ecosystem-form">
          <CardContent className="space-y-6 pt-0">
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
                  <p className="text-xs text-muted-foreground">Opcional. Se preenchido, o link de ativação será enviado para este e-mail.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nicho de Atuação</Label>
                    <Select 
                      value={formData.niche} 
                      onValueChange={v => setFormData({...formData, niche: v as NicheType})}
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
                          <span className="ml-2 text-xs text-muted-foreground italic">(Ideal para pacotes de aulas)</span>
                        </SelectItem>
                        <SelectItem value="MONETARY">
                          <span className="font-bold">Monetário (Direto)</span>
                          <span className="ml-2 text-xs text-muted-foreground italic">(Cobrança em moeda por serviço)</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Faixa de {pluralize(currentVocabulary.provider)}</Label>
              <p className="text-sm text-muted-foreground">
                Escolha quantos {pluralize(currentVocabulary.provider).toLowerCase()} pode ter. Ao ultrapassar o limite, será necessário fazer upgrade.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {PROFESSIONAL_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setProfessionalsTier(tier.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-sm transition-all",
                      professionalsTier === tier.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:border-primary/50"
                    )}
                  >
                    <span className="font-medium">
                      {tier.id === '1-10' ? `1–10 ${pluralize(currentVocabulary.provider)}` : tier.id === '11-20' ? `11–20 ${pluralize(currentVocabulary.provider)}` : `21–50 ${pluralize(currentVocabulary.provider)}`}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      R$ {tier.price.toLocaleString('pt-BR')}/mês
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Módulos
                </CardTitle>
                <CardDescription>Selecione os módulos que deseja no seu sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingModules ? (
                  <div className="flex justify-center py-8 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando módulos...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {systemModules.map(mod => {
                      const isRecommended = (getDefaultModulesForNiche(formData.niche) as any)[mod.id]
                      return (
                        <div key={mod.id} className={cn(
                          "flex flex-col gap-2 p-3 rounded-lg border bg-background text-sm transition-all",
                          modules[mod.id] ? "border-primary/50 bg-primary/5" : ""
                        )}>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={mod.id} className="flex-1 cursor-pointer flex flex-col">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{mod.label}</span>
                                {isRecommended && (
                                  <span className="text-[9px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800">
                                    RECOMENDADO
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {Number(mod.price) === 0 ? "Grátis" : `+ R$ ${Number(mod.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              </span>
                            </Label>
                            <Switch 
                              id={mod.id}
                              checked={modules[mod.id] || false}
                              onCheckedChange={(c) => handleModuleToggle(mod.id, c)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="font-bold text-sm">Total mensal estimado</span>
                  <span className="font-bold text-xl text-primary">
                    R$ {planTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-950/20">
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

            <Card className="bg-indigo-600 text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Sumário do Sistema
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Sistema personalizado para o nicho {nicheDictionary.pt[formData.niche]?.name || formData.niche}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/10 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Módulos selecionados:</span>
                    <span className="font-bold">{Object.values(modules).filter(Boolean).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total mensal:</span>
                    <span className="font-bold">R$ {planTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Faixa:</span>
                    <span className="font-bold">{tier?.id === '1-10' ? '1–10' : tier?.id === '11-20' ? '11–20' : '21–50'} {pluralize(currentVocabulary.provider)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Nicho:</span>
                    <span className="font-bold capitalize">{formData.niche}</span>
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
          </CardContent>
        </form>
        </Card>
      </div>
    </div>
  )
}
