"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { updateStudioSetting, getStudioSetting } from "@/lib/database-utils"
import { Loader2, Trophy, Star, Users, MessageSquare } from "lucide-react"

export function GamificationSettings({ studioId }: { studioId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [settings, setSettings] = useState({
    enabled: true,
    pointsAttendance: 10,
    pointsReferral: 50,
    pointsReview: 20,
    pointsPurchase: 1 // Pontos por real gasto? Ou por compra? Vamos assumir por real gasto por enquanto ou deixar genérico
  })

  useEffect(() => {
    if (studioId) loadSettings()
  }, [studioId])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Buscar configurações individuais
      // Poderíamos salvar tudo em um JSON 'gamification_config', mas por enquanto vamos usar chaves separadas para manter consistência com o resto do sistema se preferir,
      // ou usar um JSON único. O updateStudioSetting suporta chave/valor.
      // Vamos usar chaves específicas para facilitar consultas SQL diretas se necessário, ou um JSON.
      // Dado o padrão do sistema, parece que chaves individuais são comuns, mas para configurações complexas, JSON é melhor.
      // Vou usar um JSON 'gamification_config' para agrupar tudo.
      
      const configStr = await getStudioSetting('gamification_config', studioId)
      if (configStr) {
        try {
          const config = JSON.parse(configStr)
          setSettings(prev => ({ ...prev, ...config }))
        } catch (e) {
          console.error("Erro ao fazer parse da gamificação", e)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações de gamificação", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateStudioSetting(
        'gamification_config', 
        JSON.stringify(settings), 
        'Configurações do módulo de gamificação', 
        studioId
      )
      
      toast({
        title: "Configurações salvas!",
        description: "As regras de gamificação foram atualizadas."
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Configurações de Gamificação
          </CardTitle>
          <CardDescription>
            Defina como seus alunos ganham pontos e recompensas no estúdio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Sistema Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar acúmulo de pontos e exibição de ranking para alunos.
              </p>
            </div>
            <Switch 
              checked={settings.enabled}
              onCheckedChange={(c) => setSettings(s => ({ ...s, enabled: c }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 border p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                  <Star className="w-4 h-4" />
                </div>
                <h3 className="font-semibold">Pontos por Presença</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsAttendance">Pontos ao comparecer na aula</Label>
                <Input 
                  id="pointsAttendance" 
                  type="number" 
                  value={settings.pointsAttendance}
                  onChange={(e) => setSettings(s => ({ ...s, pointsAttendance: parseInt(e.target.value) || 0 }))}
                  disabled={!settings.enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Creditado automaticamente ao confirmar presença.
                </p>
              </div>
            </div>

            <div className="space-y-4 border p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-semibold">Indicação de Amigos</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsReferral">Pontos por aluno indicado (Matrícula)</Label>
                <Input 
                  id="pointsReferral" 
                  type="number" 
                  value={settings.pointsReferral}
                  onChange={(e) => setSettings(s => ({ ...s, pointsReferral: parseInt(e.target.value) || 0 }))}
                  disabled={!settings.enabled}
                />
                 <p className="text-xs text-muted-foreground">
                  Creditado quando o indicado realiza a primeira matrícula.
                </p>
              </div>
            </div>

            <div className="space-y-4 border p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-semibold">Avaliação da Aula</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsReview">Pontos por avaliar uma aula</Label>
                <Input 
                  id="pointsReview" 
                  type="number" 
                  value={settings.pointsReview}
                  onChange={(e) => setSettings(s => ({ ...s, pointsReview: parseInt(e.target.value) || 0 }))}
                  disabled={!settings.enabled}
                />
                 <p className="text-xs text-muted-foreground">
                  Incentiva o feedback constante sobre as aulas.
                </p>
              </div>
            </div>

            {/* Futuro: Pontos por compra, Níveis, etc */}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
