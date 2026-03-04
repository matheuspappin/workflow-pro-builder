"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Bot,
  Activity,
  BarChart3
} from "lucide-react"
import { ModuleGuard } from "@/components/providers/module-guard"
import { useVocabulary } from "@/hooks/use-vocabulary"

interface SecretaryStats {
  todayAppointments: number
  pendingMessages: number
  confirmedBookings: number
  aiResponses: number
  averageResponseTime: string
  satisfactionRate: number
}

interface RecentActivity {
  id: string
  type: 'appointment' | 'message' | 'booking' | 'inquiry'
  description: string
  timestamp: Date
  status: 'completed' | 'pending' | 'cancelled'
}

export default function AISecretaryPage() {
  const { vocabulary, t } = useVocabulary()
  const [stats, setStats] = useState<SecretaryStats>({
    todayAppointments: 0,
    pendingMessages: 0,
    confirmedBookings: 0,
    aiResponses: 0,
    averageResponseTime: "0s",
    satisfactionRate: 0
  })
  
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de dados
    const loadData = async () => {
      try {
        // Aqui você buscaria dados reais das APIs
        setStats({
          todayAppointments: 12,
          pendingMessages: 3,
          confirmedBookings: 8,
          aiResponses: 45,
          averageResponseTime: "2.3s",
          satisfactionRate: 94
        })
        
        setActivities([
          {
            id: '1',
            type: 'appointment',
            description: 'Maria Silva agendou aula de dança para hoje 14:00',
            timestamp: new Date(Date.now() - 30 * 60000),
            status: 'completed'
          },
          {
            id: '2',
            type: 'message',
            description: 'João perguntou sobre valores de planos',
            timestamp: new Date(Date.now() - 45 * 60000),
            status: 'completed'
          },
          {
            id: '3',
            type: 'booking',
            description: 'Nova matrícula confirmada - Ana Costa',
            timestamp: new Date(Date.now() - 120 * 60000),
            status: 'completed'
          },
          {
            id: '4',
            type: 'inquiry',
            description: 'Pedido de horário disponível amanhã',
            timestamp: new Date(Date.now() - 180 * 60000),
            status: 'pending'
          }
        ])
      } catch (error) {
        console.error('Erro ao carregar dados da secretária:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar
      case 'message': return MessageSquare
      case 'booking': return CheckCircle
      case 'inquiry': return AlertCircle
      default: return Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando painel da secretária...</p>
        </div>
      </div>
    )
  }

  return (
    <ModuleGuard module="ai_chat" showFullError>
      <div className="min-h-screen bg-background">
        <Header title="Secretária IA" />

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Agendamentos Hoje</p>
                    <p className="text-3xl font-bold">{stats.todayAppointments}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Respostas IA</p>
                    <p className="text-3xl font-bold">{stats.aiResponses}</p>
                  </div>
                  <Bot className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Confirmações</p>
                    <p className="text-3xl font-bold">{stats.confirmedBookings}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Satisfação</p>
                    <p className="text-3xl font-bold">{stats.satisfactionRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Atividades Recentes
                  </CardTitle>
                  <CardDescription>
                    Ações executadas pela secretária virtual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map((activity) => {
                      const Icon = getActivityIcon(activity.type)
                      return (
                        <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg border bg-secondary/50">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status === 'completed' ? 'Concluído' : 
                             activity.status === 'pending' ? 'Pendente' : 'Cancelado'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ver Conversas
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Gerenciar Agenda
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    Configurar WhatsApp
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Relatórios IA
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tempo Médio de Resposta</span>
                    <span className="font-medium">{stats.averageResponseTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mensagens Pendentes</span>
                    <span className="font-medium">{stats.pendingMessages}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
                    <span className="font-medium">{stats.satisfactionRate}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ModuleGuard>
  )
}
