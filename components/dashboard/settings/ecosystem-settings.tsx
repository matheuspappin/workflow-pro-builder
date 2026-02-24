 "use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Coins, CreditCard } from "lucide-react"
import { useOrganization } from "@/components/providers/organization-provider"

import { nicheDictionary, NicheType, VocabularyType } from "@/config/niche-dictionary"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function EcosystemSettings({ studioId }: { studioId: string }) {
  const { refresh, language } = useOrganization()
  const [niche, setNiche] = useState<NicheType>('dance')
  const [model, setModel] = useState<'CREDIT' | 'MONETARY'>('CREDIT')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (studioId) {
      loadSettings()
    }
  }, [studioId])

  useEffect(() => {
    const selectedNicheData = nicheDictionary[language as 'pt' | 'en'][niche] || nicheDictionary.pt[niche] || nicheDictionary.pt.dance;
    setModel(selectedNicheData.businessModel);
  }, [niche, language])

  const loadSettings = async () => {
    setLoading(true)

    const { data: orgSettings } = await supabase
      .from('organization_settings')
      .select('niche')
      .eq('studio_id', studioId)
      .maybeSingle()

    if (orgSettings?.niche) {
      setNiche(orgSettings.niche as NicheType)
    }

    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const vocabulary = nicheDictionary[language as 'pt' | 'en'][niche] || nicheDictionary.pt[niche] || nicheDictionary.pt.dance
      
      const { error: orgError } = await supabase
        .from('organization_settings')
        .upsert({ 
          studio_id: studioId,
          niche: niche,
          vocabulary: vocabulary
        }, { onConflict: 'studio_id' })

      if (orgError) throw orgError

      await refresh()

      toast({
        title: "Configurações atualizadas",
        description: "O nicho e o vocabulário foram alterados."
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
        <CardTitle>Configurações do Ecossistema</CardTitle>
        <CardDescription>
          Personalize como seu sistema se comporta e se comunica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nicho de Atuação</Label>
            <Select value={niche} onValueChange={(v: NicheType) => setNiche(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o nicho" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(nicheDictionary[language as 'pt' | 'en'] || nicheDictionary.pt).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Isso altera os termos usados no sistema (ex: Alunos vs Clientes).
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
            <Label className="text-muted-foreground">Modelo de Operação Ativo</Label>
            <div className="mt-2 flex items-center gap-2">
              {model === 'CREDIT' ? (
                <>
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold">Modelo de Créditos (Flex Pass)</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 text-green-500" />
                  <span className="font-bold">Modelo Monetário (Direto)</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              O modelo de operação é definido na criação do ecossistema para garantir a integridade dos dados.
            </p>
          </div>
        </div>

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