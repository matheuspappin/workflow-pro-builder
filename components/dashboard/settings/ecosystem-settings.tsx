"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Coins, CreditCard } from "lucide-react"

export function EcosystemSettings({ studioId }: { studioId: string }) {
  const [model, setModel] = useState<'CREDIT' | 'MONETARY'>('CREDIT')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (studioId) loadSettings()
  }, [studioId])

  const loadSettings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('studios')
      .select('business_model')
      .eq('id', studioId)
      .single()

    if (data) {
      setModel(data.business_model as 'CREDIT' | 'MONETARY' || 'CREDIT')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('studios')
        .update({ business_model: model })
        .eq('id', studioId)

      if (error) throw error

      toast({
        title: "Configurações atualizadas",
        description: "O modelo de negócio do ecossistema foi alterado."
      })
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modelo de Negócio do Ecossistema</CardTitle>
        <CardDescription>
          Defina como seu estúdio opera vendas e cobranças.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={model} onValueChange={(v) => setModel(v as 'CREDIT' | 'MONETARY')}>
          <div className={`flex items-start space-x-4 border p-4 rounded-lg transition-colors ${model === 'CREDIT' ? 'border-primary bg-primary/5' : ''}`}>
            <RadioGroupItem value="CREDIT" id="credit" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="credit" className="text-base font-bold flex items-center gap-2 cursor-pointer">
                <Coins className="w-5 h-5 text-yellow-500" />
                Modelo de Créditos (Flex Pass)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Os alunos compram pacotes de créditos e os utilizam para agendar aulas ou comprar produtos.
                Ideal para modelos flexíveis e pacotes de aulas.
              </p>
            </div>
          </div>

          <div className={`flex items-start space-x-4 border p-4 rounded-lg transition-colors ${model === 'MONETARY' ? 'border-primary bg-primary/5' : ''}`}>
            <RadioGroupItem value="MONETARY" id="monetary" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="monetary" className="text-base font-bold flex items-center gap-2 cursor-pointer">
                <CreditCard className="w-5 h-5 text-green-500" />
                Modelo Monetário (Direto)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Cobrança direta em moeda (BRL) por cada serviço ou produto.
                Suporta pagamentos via Cartão, PIX e Dinheiro no PDV.
              </p>
            </div>
          </div>
        </RadioGroup>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
