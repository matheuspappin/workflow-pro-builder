"use client"

import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { toast } from "sonner"

interface ModuleConfig {
  id: string
  label: string
  description: string
  defaultPrice: number
  enabled: boolean
}

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard', description: 'Visão geral e métricas', defaultPrice: 0 },
  { id: 'students', label: 'Gestão de Clientes', description: 'Cadastro e perfil de alunos/pacientes', defaultPrice: 49 },
  { id: 'classes', label: 'Agendamento/Aulas', description: 'Grade de horários e check-in', defaultPrice: 29 },
  { id: 'financial', label: 'Financeiro', description: 'Fluxo de caixa e cobranças', defaultPrice: 89 },
  { id: 'pos', label: 'PDV / Frente de Caixa', description: 'Venda de produtos físicos rápidos', defaultPrice: 39 },
  { id: 'inventory', label: 'Estoque / Suprimentos', description: 'Controle de produtos e fornecedores', defaultPrice: 59 },
  { id: 'whatsapp', label: 'WhatsApp Automation', description: 'Envio de mensagens automáticas', defaultPrice: 120 },
  { id: 'ai_chat', label: 'IA Chatbot', description: 'Assistente virtual inteligente', defaultPrice: 150 },
  { id: 'scanner', label: 'Scanner de Entrada', description: 'Controle de acesso por QR Code', defaultPrice: 19 },
  { id: 'marketplace', label: 'Marketplace', description: 'Loja virtual integrada', defaultPrice: 59 },
  { id: 'leads', label: 'CRM / Leads', description: 'Funil de vendas e prospecção', defaultPrice: 79 },
  { id: 'gamification', label: 'Gamificação', description: 'Sistema de pontos e recompensas', defaultPrice: 45 },
  { id: 'service_orders', label: 'Ordens de Serviço', description: 'Controle de manutenções e reparos', defaultPrice: 69 },
  { id: 'erp', label: 'ERP Enterprise', description: 'Gestão empresarial completa', defaultPrice: 199 },
  { id: 'multi_unit', label: 'Multi-unidade', description: 'Gestão de várias filiais', defaultPrice: 150 },
]

export function FeatureBuilder() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modules, setModules] = useState<Record<string, boolean>>({})
  const [prices, setPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    loadModules()
  }, [])

  async function loadModules() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Get user's studio_id
      const { data: userProfile } = await supabase
        .from('users_internal')
        .select('studio_id')
        .eq('id', user.id)
        .single()
      
      const studioId = userProfile?.studio_id

      if (!studioId) {
        toast.error('Estúdio não encontrado')
        return
      }

      const { data } = await supabase
        .from('organization_settings')
        .select('enabled_modules')
        .eq('studio_id', studioId)
        .single()

      if (data?.enabled_modules) {
        setModules(data.enabled_modules)
      } else {
        // Defaults
        const defaults: Record<string, boolean> = {}
        AVAILABLE_MODULES.forEach(m => defaults[m.id] = false)
        defaults['dashboard'] = true
        setModules(defaults)
      }
    } catch (error) {
      console.error('Error loading modules:', error)
      toast.error('Erro ao carregar módulos')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (id: string, checked: boolean) => {
    setModules(prev => ({ ...prev, [id]: checked }))
  }

  const handlePriceChange = (id: string, val: string) => {
    setPrices(prev => ({ ...prev, [id]: Number(val) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Get user's studio_id
      const { data: userProfile } = await supabase
        .from('users_internal')
        .select('studio_id')
        .eq('id', user.id)
        .single()
      
      const studioId = userProfile?.studio_id

      if (!studioId) throw new Error("Studio ID not found")

      const { error } = await supabase
        .from('organization_settings')
        .update({ enabled_modules: modules })
        .eq('studio_id', studioId)

      if (error) throw error
      toast.success('Funcionalidades atualizadas com sucesso!')
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

  const activeCount = Object.values(modules).filter(Boolean).length
  const estimatedTotal = AVAILABLE_MODULES.reduce((acc, m) => {
    return acc + (modules[m.id] ? (prices[m.id] || m.defaultPrice) : 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feature Builder</h2>
          <p className="text-muted-foreground">Personalize os módulos ativos para este ambiente.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {AVAILABLE_MODULES.map((module) => (
          <Card key={module.id} className={modules[module.id] ? "border-primary" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">{module.label}</CardTitle>
                <Switch 
                  checked={modules[module.id] || false}
                  onCheckedChange={(c) => handleToggle(module.id, c)}
                />
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Label htmlFor={`price-${module.id}`} className="text-xs text-muted-foreground">Preço Adicional:</Label>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">R$</span>
                  <Input 
                    id={`price-${module.id}`}
                    type="number" 
                    className="h-8 pl-6 text-xs" 
                    placeholder={module.defaultPrice.toString()}
                    value={prices[module.id] || ''}
                    onChange={(e) => handlePriceChange(module.id, e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-1">{activeCount} Módulos Ativos</Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Estimativa de Receita / Cliente</p>
            <p className="text-2xl font-bold text-primary">R$ {estimatedTotal.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
