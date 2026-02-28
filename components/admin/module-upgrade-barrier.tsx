"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ShieldAlert, Rocket, Loader2 } from 'lucide-react'
import { ModuleKey } from '@/config/modules'
import { MODULE_PRICING } from '@/config/module-pricing'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/components/providers/organization-provider'

interface ModuleUpgradeBarrierProps {
  module: ModuleKey
  title?: string
  description?: string
}

export function ModuleUpgradeBarrier({ 
  module,
  title,
  description
}: ModuleUpgradeBarrierProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { refresh } = useOrganization()
  
  const pricing = MODULE_PRICING[module] || {
    price: 0,
    benefits: ['Funcionalidade Premium'],
    description: 'Atualize seu plano para acessar.'
  }

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      // Simulação de delay de processamento/checkout
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Import dinâmico da action para evitar problemas de compilação em componentes client
      const { activateModule } = await import('@/lib/actions/billing')
      const result = await activateModule(module)
      
      if (result.success) {
        toast({
          title: "Módulo Ativado! 🚀",
          description: `O módulo ${module} foi adicionado ao seu plano com sucesso.`,
        })
        await refresh() // Atualiza o contexto global
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Erro na ativação",
        description: error.message || "Não foi possível ativar o módulo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full p-4 animate-in fade-in zoom-in duration-500">
      <Card className="max-w-md w-full border-2 border-indigo-100 dark:border-indigo-900 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {title || `Desbloqueie o módulo ${module}`}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {description || pricing.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm text-muted-foreground">Adicione por apenas</span>
              <span className="text-3xl font-bold text-primary">R$ {pricing.price},00</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center">
              O que está incluso:
            </p>
            <ul className="space-y-2">
              {pricing.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              "Ativar Agora"
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Cancelamento disponível a qualquer momento.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
