"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { getLocalUser } from "@/lib/constants/storage-keys"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Star,
  BarChart3,
  Target,
  Zap,
  BookOpen,
  Users,
  Calendar
} from "lucide-react"
import { ModuleGuard } from "@/components/providers/module-guard"
import { useVocabulary } from "@/hooks/use-vocabulary"

interface LearningMetrics {
  period: string
  evolution: Array<{
    date: string
    score: number
    interactions: number
    successRate: number
  }>
  topKnowledge: Array<{
    category: string
    question: string
    usageCount: number
    successRate: number
  }>
  feedbackSummary: {
    total: number
    positive: number
    negative: number
    neutral: number
    corrections: number
    averageRating: number
    satisfactionRate: number
  }
  topPatterns: Array<{
    patternName: string
    patternType: string
    usageCount: number
    successRate: number
  }>
  totalInteractions: number
  averageLearningScore: number
}

async function getStudioId(): Promise<string | null> {
  if (typeof window === "undefined") return null
  try {
    const user = getLocalUser("estudio-de-danca") ?? getLocalUser("default")
    const sid = user?.studio_id || user?.studioId || null
    if (sid) return sid
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.user_metadata?.studio_id ?? null
  } catch {
    return null
  }
}

export default function AILearningPage() {
  const { vocabulary, t } = useVocabulary()
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [studioId, setStudioId] = useState<string | null>(null)

  useEffect(() => {
    getStudioId().then((sid) => {
      setStudioId(sid)
      if (!sid) setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!studioId) return
    loadLearningMetrics()
  }, [selectedPeriod, studioId])

  const loadLearningMetrics = async () => {
    if (!studioId) return
    try {
      setLoading(true)
      const response = await fetch(`/api/ai/learning?studioId=${encodeURIComponent(studioId)}&type=report&days=${selectedPeriod}`, { credentials: "include" })
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.data)
      } else if (data.error) {
        setMetrics(null)
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSatisfactionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500'
    if (score >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (!studioId && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Faça login em um estúdio para ver as métricas de aprendizado.</p>
        </div>
      </div>
    )
  }

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando métricas de aprendizado...</p>
        </div>
      </div>
    )
  }

  return (
    <ModuleGuard module="ai_chat" showFullError>
      <div className="min-h-screen bg-background">
        <Header title="Aprendizado da IA" />

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Score de Aprendizado</p>
                    <p className="text-3xl font-bold">
                      {metrics?.averageLearningScore ? (metrics.averageLearningScore * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Interações Totais</p>
                    <p className="text-3xl font-bold">{metrics?.totalInteractions || 0}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Taxa de Satisfação</p>
                    <p className="text-3xl font-bold">
                      {metrics?.feedbackSummary?.satisfactionRate ? metrics.feedbackSummary.satisfactionRate.toFixed(1) : '0'}%
                    </p>
                  </div>
                  <ThumbsUp className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Conhecimento Aprendido</p>
                    <p className="text-3xl font-bold">{metrics?.topKnowledge?.length || 0}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Learning Evolution */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Evolução do Aprendizado
                  </CardTitle>
                  <CardDescription>
                    Progresso da IA nos últimos {selectedPeriod} dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.evolution?.slice(-7).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.date}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {item.interactions} interações
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.successRate.toFixed(1)}% sucesso
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-8 rounded-full ${getScoreColor(item.score)}`}></div>
                          <span className="text-sm font-medium">
                            {(item.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Feedback dos Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                      <ThumbsUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-600">
                        {metrics?.feedbackSummary?.positive || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Positivos</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                      <ThumbsDown className="w-6 h-6 text-red-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-red-600">
                        {metrics?.feedbackSummary?.negative || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Negativos</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avaliação Média</span>
                      <span className="font-medium">
                        {metrics?.feedbackSummary?.averageRating?.toFixed(1) || '0.0'} ⭐
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Correções</span>
                      <span className="font-medium">
                        {metrics?.feedbackSummary?.corrections || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Conhecimento Mais Usado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.topKnowledge?.slice(0, 5).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{item.question}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{(item.usage_count ?? item.usageCount ?? 0)}x</p>
                          <p className="text-xs text-muted-foreground">
                            {((item.success_rate ?? item.successRate ?? 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex justify-center">
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(7)}
              >
                7 dias
              </Button>
              <Button
                variant={selectedPeriod === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(30)}
              >
                30 dias
              </Button>
              <Button
                variant={selectedPeriod === 90 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(90)}
              >
                90 dias
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModuleGuard>
  )
}
