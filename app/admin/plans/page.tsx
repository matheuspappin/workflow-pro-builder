"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Zap, 
  Star, 
  Crown,
  CreditCard,
  TrendingUp,
  Users,
  Database,
  Loader2,
  Package
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { saveSystemPlan, deleteSystemPlan } from "@/lib/actions/super-admin"
import { getSystemModules, updateSystemModule } from "@/lib/actions/modules"
import { MODULE_DEFINITIONS, ModuleKey } from "@/config/modules"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import logger from "@/lib/logger"

export default function AdminPlansPage() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      logger.info('Iniciando carregamento de dados...')
      
      // Carregar planos
      const plansPromise = supabase
        .from('system_plans')
        .select('*')
        .order('price', { ascending: true })
      
      // Carregar estatísticas
      const statsPromise = fetch('/api/admin/stats')
        .then(async res => {
          if (!res.ok) {
            const text = await res.text()
            throw new Error(`Erro na API stats: ${res.status} ${res.statusText} - ${text}`)
          }
          return res.json()
        })

      // Carregar módulos
      const modulesPromise = getSystemModules()

      const [plansRes, statsRes, modulesRes] = await Promise.all([
        plansPromise,
        statsPromise,
        modulesPromise
      ])

      if (plansRes.error) {
        logger.error('Erro Supabase plans:', plansRes.error)
        throw new Error(`Erro ao carregar planos: ${plansRes.error.message || JSON.stringify(plansRes.error)}`)
      }

      logger.info('Dados carregados:', { plans: plansRes.data?.length, stats: statsRes, modules: modulesRes?.length })

      setPlans(plansRes.data || [])
      setStats(statsRes.stats || {})
      setModules(modulesRes || [])
    } catch (e: any) {
      logger.error("Erro detalhado loadData:", e)
      toast({ 
        title: "Erro ao carregar dados", 
        description: e.message || "Ocorreu um erro desconhecido", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const generateFeaturesText = (modules: Record<ModuleKey, boolean>) => {
    const activeFeatures: string[] = [];
    Object.entries(modules).forEach(([key, enabled]) => {
      if (enabled) {
        const moduleDef = MODULE_DEFINITIONS[key as ModuleKey];
        if (moduleDef && moduleDef.features) {
          activeFeatures.push(...moduleDef.features);
        }
      }
    });
    return activeFeatures.join('\n');
  };

  const normalizeModules = (modules: Record<ModuleKey, boolean> | null) => {
    const normalized = {} as Record<ModuleKey, boolean>;
    (Object.keys(MODULE_DEFINITIONS) as ModuleKey[]).forEach(key => {
      normalized[key] = modules?.[key] ?? MODULE_DEFINITIONS[key].default;
    });
    return normalized;
  };

  const getPlanActiveModules = (plan: any) => {
    // Se tiver a coluna modules, usa ela (prioridade)
    if (plan.modules && Object.keys(plan.modules).length > 0) {
      return normalizeModules(plan.modules);
    }

    // Fallback para colunas legadas se modules for nulo/vazio
    const modules: any = {};
    Object.keys(MODULE_DEFINITIONS).forEach(k => {
      const key = k as ModuleKey;
      // Defaults do sistema
      modules[key] = MODULE_DEFINITIONS[key].default;
    });

    // Sobrescreve com legacy flags se existirem
    if (plan.has_finance !== undefined) modules.financial = plan.has_finance;
    if (plan.has_whatsapp !== undefined) modules.whatsapp = plan.has_whatsapp;
    if (plan.has_ai !== undefined) modules.ai_chat = plan.has_ai;
    if (plan.has_multi_unit !== undefined) modules.multi_unit = plan.has_multi_unit;
    
    return modules;
  };

  const handleEdit = (plan: any) => {
    const activeModules = getPlanActiveModules(plan);
    setEditingPlan({
      ...plan,
      features_text: generateFeaturesText(activeModules),
      modules: activeModules,
    });
    setIsDialogOpen(true);
  };

  const handleNewPlan = () => {
    const initialModules: any = {};
    Object.keys(MODULE_DEFINITIONS).forEach(key => {
      initialModules[key as ModuleKey] = MODULE_DEFINITIONS[key as ModuleKey].default;
    });
    
    setEditingPlan({
      id: '',
      name: '',
      price: 0,
      description: '',
      features: [],
      features_text: generateFeaturesText(initialModules), // Gerar features_text inicial
      max_students: 10,
      max_teachers: 1,
      trial_days: 14, // Default 14 days
      modules: initialModules,
      is_popular: false,
      status: 'active'
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan.id || !editingPlan.name) {
      toast({ title: "Erro", description: "ID e Nome são obrigatórios", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const features = editingPlan.features_text
        .split('\n')
        .map((f: string) => f.trim())
        .filter((f: string) => f.length > 0)

      const { features_text, ...planToSave } = editingPlan
      planToSave.features = features

      // Sincronizar colunas legadas para compatibilidade
      planToSave.has_finance = planToSave.modules?.financial || false
      planToSave.has_whatsapp = planToSave.modules?.whatsapp || false
      planToSave.has_ai = planToSave.modules?.ai_chat || false
      planToSave.has_multi_unit = planToSave.modules?.multi_unit || false

      await saveSystemPlan(planToSave, session?.access_token)

      toast({ title: "Sucesso", description: "Plano salvo com sucesso!" })
      setIsDialogOpen(false)
      loadData()
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: typeof e.message === 'string' ? e.message : JSON.stringify(e), variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      await saveSystemPlan({ id, status: newStatus }, session?.access_token)
      
      setPlans(prev => prev.map(p => 
        p.id === id ? { ...p, status: newStatus } : p
      ))
      toast({ title: "Plano atualizado", description: "O status do plano foi alterado com sucesso." })
    } catch (e: any) {
      toast({ title: "Erro ao atualizar status", description: e.message, variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este plano?")) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await deleteSystemPlan(id, session?.access_token)

      setPlans(prev => prev.filter(p => p.id !== id))
      toast({ title: "Sucesso", description: "Plano excluído com sucesso!" })
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" })
    }
  }

  const handleModuleUpdate = async (id: string, data: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await updateSystemModule(id, data, session?.access_token)
      setModules(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
      toast({ title: "Módulo atualizado", description: "As alterações foram salvas." })
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    }
  }

  const getIcon = (id: string) => {
    switch (id) {
      case 'gratuito': return Zap
      case 'pro': return Star
      case 'pro-plus': return Crown
      case 'enterprise': return Crown
      default: return Zap
    }
  }

  const getColor = (id: string) => {
    switch (id) {
      case 'gratuito': return 'slate'
      case 'pro': return 'indigo'
      case 'pro-plus': return 'violet'
      case 'enterprise': return 'orange'
      default: return 'indigo'
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Planos & Assinaturas" />
      
      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Receita Recorrente</p>
                <div className="text-2xl font-bold">R$ {stats?.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Assinantes Ativos</p>
                <div className="text-2xl font-bold">{stats?.activeSubscribers}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Taxa de Conversão</p>
                <div className="text-2xl font-bold">{stats?.conversionRate?.toFixed(1)}%</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciar Planos</h2>
              <p className="text-slate-500">Configure as ofertas e preços para os seus clientes</p>
            </div>
            <div className="flex items-center gap-4">
              <TabsList>
                <TabsTrigger value="plans">Planos</TabsTrigger>
                <TabsTrigger value="modules">Módulos</TabsTrigger>
              </TabsList>
              <Button 
                onClick={handleNewPlan}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2 font-bold uppercase tracking-wider text-xs"
              >
                <Plus className="w-4 h-4" /> Novo Plano
              </Button>
            </div>
          </div>

          <TabsContent value="plans" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loading ? (
                <div className="col-span-full py-20 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600 mb-4" />
                  <p className="text-slate-500 font-medium">Carregando planos do sistema...</p>
                </div>
              ) : plans.map((plan) => (
                <Card key={plan.id} className={`relative overflow-hidden border-none shadow-xl ${plan.is_popular ? 'ring-2 ring-indigo-500 scale-105 z-10' : 'bg-white dark:bg-slate-900'}`}>
                  {plan.is_popular && (
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-lg">
                      Mais Popular
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${getColor(plan.id)}-500/10 flex items-center justify-center mb-4`}>
                      {(() => {
                        const Icon = getIcon(plan.id)
                        return <Icon className={`w-6 h-6 text-${getColor(plan.id)}-500`} />
                      })()}
                    </div>
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <div className="mt-2 flex items-baseline">
                      {plan.id === 'enterprise' ? (
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Sob Consulta</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">R$ {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-slate-400 text-sm ml-1">/mês</span>
                        </>
                      )}
                    </div>
                    <CardDescription className="mt-4 leading-relaxed line-clamp-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Módulos Inclusos:</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Object.entries(getPlanActiveModules(plan)).map(([key, enabled]) => {
                          if (!enabled) return null;
                          const moduleDef = MODULE_DEFINITIONS[key as ModuleKey];
                          return (
                            <Badge 
                              key={key} 
                              variant="secondary" 
                              className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-none"
                            >
                              {moduleDef?.label || key}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">O que inclui:</p>
                      {(plan.features || []).map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <div className="w-4 h-4 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-indigo-500" />
                          </div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button 
                        variant="outline" 
                        onClick={() => handleEdit(plan)}
                        className="flex-1 gap-1 text-[10px] font-bold uppercase tracking-wider h-8"
                      >
                        <Edit className="w-3 h-3" /> Editar
                      </Button>
                      <Button 
                        variant={plan.status === 'active' ? "ghost" : "default"} 
                        className={`flex-1 gap-1 text-[10px] font-bold uppercase tracking-wider h-8 ${plan.status === 'active' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        onClick={() => handleToggleStatus(plan.id, plan.status)}
                      >
                        {plan.status === 'active' ? (
                          <><X className="w-3 h-3" /> Desativar</>
                        ) : (
                          <><Check className="w-3 h-3" /> Ativar</>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDelete(plan.id)}
                        className="w-8 h-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="modules" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card key={module.id} className="border-none shadow-md bg-white dark:bg-slate-900">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={module.active ? 'default' : 'secondary'} className={module.active ? 'bg-emerald-500' : ''}>
                        {module.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Switch 
                        checked={module.active}
                        onCheckedChange={(checked) => handleModuleUpdate(module.id, { active: checked })}
                      />
                    </div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-500" />
                      {module.label}
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`price-${module.id}`} className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Preço Mensal (R$)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                        <Input 
                          id={`price-${module.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={module.price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setModules(prev => prev.map(m => m.id === module.id ? { ...m, price: val } : m))
                          }}
                          onBlur={(e) => handleModuleUpdate(module.id, { price: parseFloat(e.target.value) || 0 })}
                          className="pl-10 font-bold"
                        />
                      </div>
                    </div>
                    {Number(module.price) > 0 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`price-annual-${module.id}`} className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Preço Anual (R$) — opcional
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                            <Input 
                              id={`price-annual-${module.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={module.price_annual ?? ''}
                              placeholder="Auto: mensal × 12 com desconto"
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                setModules(prev => prev.map(m => m.id === module.id ? { ...m, price_annual: val } : m))
                              }}
                              onBlur={(e) => {
                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                handleModuleUpdate(module.id, { price_annual: val })
                              }}
                              className="pl-10 font-bold"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`annual-discount-${module.id}`} className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Desconto Anual (%)
                          </Label>
                          <Input 
                            id={`annual-discount-${module.id}`}
                            type="number"
                            min={0}
                            max={50}
                            value={module.annual_discount_percent ?? 17}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 17;
                              setModules(prev => prev.map(m => m.id === module.id ? { ...m, annual_discount_percent: val } : m))
                            }}
                            onBlur={(e) => handleModuleUpdate(module.id, { annual_discount_percent: parseInt(e.target.value) || 17 })}
                            className="font-bold"
                          />
                          <p className="text-xs text-slate-500">
                            Ex: 17% ≈ 2 meses grátis. Se Preço Anual vazio, usa: mensal × 12 × (1 - desconto/100)
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Anual: R$ {(module.price_annual ?? 
                              (Number(module.price) * 12 * (1 - (module.annual_discount_percent ?? 17) / 100))
                            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                          </p>
                        </div>
                      </>
                    )}
                    <div className="pt-2">
                      <p className="text-xs text-slate-500 mb-2">Recursos:</p>
                      <div className="flex flex-wrap gap-1">
                        {module.features?.map((f: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Informação sobre faturamento */}
        <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-bold">Gerenciamento de Faturamento</h3>
              <p className="text-indigo-100 max-w-xl">
                O sistema utiliza Stripe para processamento automático de pagamentos. Você pode monitorar faturas, reembolsos e cancelamentos através do dashboard do Stripe.
              </p>
            </div>
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-8 h-12 relative z-10 shadow-lg">
              Abrir Stripe Dashboard
            </Button>
            <Database className="absolute -right-10 -bottom-10 w-48 h-48 text-indigo-500/20" />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {editingPlan?.id ? <Edit className="w-6 h-6 text-indigo-600" /> : <Plus className="w-6 h-6 text-indigo-600" />}
              {editingPlan?.id ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes e limites técnicos do plano para os estúdios.
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan_id" className="text-xs font-bold uppercase tracking-widest text-slate-400">ID do Plano (Slug)</Label>
                  <Input 
                    id="plan_id" 
                    value={editingPlan.id} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    disabled={!!editingPlan.created_at}
                    placeholder="ex: pro-plus"
                    className="bg-slate-50 dark:bg-slate-800 border-none"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-400">Nome do Plano</Label>
                  <Input 
                    id="name" 
                    value={editingPlan.name} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    placeholder="ex: Pro+"
                    className="bg-slate-50 dark:bg-slate-800 border-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-xs font-bold uppercase tracking-widest text-slate-400">Preço Mensal (R$)</Label>
                  <Input 
                    id="price" 
                    type="number"
                    value={editingPlan.price} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                    className="bg-slate-50 dark:bg-slate-800 border-none"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Switch 
                    id="is_popular" 
                    checked={editingPlan.is_popular}
                    onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_popular: checked })}
                  />
                  <Label htmlFor="is_popular" className="text-sm font-medium">Plano Popular (Destaque)</Label>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-slate-400">Descrição Curta</Label>
                <Input 
                  id="description" 
                  value={editingPlan.description} 
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="ex: O melhor custo-benefício para estúdios médios"
                  className="bg-slate-50 dark:bg-slate-800 border-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="max_students" className="text-xs font-bold uppercase tracking-widest text-slate-400">Limite de Clientes</Label>
                  <Input 
                    id="max_students" 
                    type="number"
                    value={editingPlan.max_students} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_students: parseInt(e.target.value) })}
                    className="bg-slate-50 dark:bg-slate-800 border-none"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_teachers" className="text-xs font-bold uppercase tracking-widest text-slate-400">Limite de Profissionais</Label>
                  <Input 
                    id="max_teachers" 
                    type="number"
                    value={editingPlan.max_teachers} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_teachers: parseInt(e.target.value) })}
                    className="bg-slate-50 dark:bg-slate-800 border-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="trial_days" className="text-xs font-bold uppercase tracking-widest text-slate-400">Dias de Teste</Label>
                  <Input 
                    id="trial_days" 
                    type="number"
                    value={editingPlan.trial_days || 14} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, trial_days: parseInt(e.target.value) })}
                    className="bg-slate-50 dark:bg-slate-800 border-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Módulos Inclusos</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {Object.entries(MODULE_DEFINITIONS).map(([key, config]) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <Label htmlFor={`module-${key}`} className="text-sm cursor-pointer flex-1">{config.label}</Label>
                      <Switch 
                        id={`module-${key}`}
                        checked={editingPlan.modules?.[key] || false}
                      onCheckedChange={(checked) => {
                          const updatedModules = { 
                            ...editingPlan.modules, 
                            [key]: checked 
                          };
                          setEditingPlan({ 
                            ...editingPlan, 
                            modules: updatedModules,
                            features_text: generateFeaturesText(updatedModules) // Atualiza features_text
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="features" className="text-xs font-bold uppercase tracking-widest text-slate-400">Recursos (um por linha)</Label>
                <Textarea 
                  id="features" 
                  value={editingPlan.features_text} 
                  onChange={(e) => setEditingPlan({ ...editingPlan, features_text: e.target.value })}
                  placeholder="Até 100 clientes&#10;Até 5 profissionais&#10;WhatsApp Ilimitado"
                  className="bg-slate-50 dark:bg-slate-800 border-none min-h-[120px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                <>Salvar Plano</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
