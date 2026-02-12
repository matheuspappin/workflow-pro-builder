"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Database,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Terminal,
  Clock,
  Trash2,
  Download,
  Activity,
  Server,
  Zap
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

const mockLogs = [
  { id: 1, type: 'error', source: 'Supabase API', message: 'Falha ao conectar com a tabela "studio_settings"', timestamp: '2026-01-23T15:42:10Z', studio: 'Estúdio Matriz' },
  { id: 2, type: 'info', source: 'Auth', message: 'Novo usuário registrado via /register', timestamp: '2026-01-23T15:30:45Z', studio: 'Arte & Vida' },
  { id: 3, type: 'success', source: 'Payment Gateway', message: 'Assinatura PRO confirmada: Studio Flow', timestamp: '2026-01-23T14:15:22Z', studio: 'Studio Flow' },
  { id: 4, type: 'warning', source: 'Gemini AI', message: 'Latência alta detectada na API do Google (2.4s)', timestamp: '2026-01-23T13:55:10Z', studio: 'Sistema' },
  { id: 5, type: 'error', source: 'Server', message: 'Memory limit exceeded in worker process #42', timestamp: '2026-01-23T12:10:00Z', studio: 'Infra' },
  { id: 6, type: 'info', source: 'Database', message: 'Backup diário concluído com sucesso', timestamp: '2026-01-23T03:00:00Z', studio: 'Sistema' },
]

export default function AdminLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<any[]>(mockLogs)
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [isRealtime, setIsRealtime] = useState(true)

  // Escutar eventos do Supabase em tempo real
  useEffect(() => {
    if (!isRealtime) return

    console.log('📡 Iniciando escuta em tempo real do Supabase...')

    // Inscrição para TODAS as mudanças no schema public
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        (payload) => {
          console.log('🔥 Mudança detectada no banco:', payload)
          
          const newLog = {
            id: Date.now(),
            type: payload.eventType === 'INSERT' ? 'success' : payload.eventType === 'DELETE' ? 'error' : 'warning',
            source: 'PostgreSQL',
            message: `${payload.eventType}: Registro na tabela "${payload.table}" modificado.`,
            timestamp: new Date().toISOString(),
            studio: payload.new && (payload.new as any).studio_id ? 'Estúdio ID: ' + (payload.new as any).studio_id.substring(0, 8) : 'Global',
            details: payload.new || payload.old
          }

          setLogs(prev => [newLog, ...prev].slice(0, 50)) // Mantém os últimos 50 logs
          
          toast({
            title: "Evento de Banco de Dados",
            description: `${payload.eventType} em ${payload.table}`,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isRealtime, toast])

  const refreshLogs = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({ title: "Logs atualizados", description: "O histórico foi sincronizado com o servidor." })
    }, 1000)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.type === filter
  })

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Logs do Sistema" />
      
      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Logs Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Erros (24h)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-red-500">12</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alertas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-amber-500">08</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Uptime</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-500">99.98%</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Requisições</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-indigo-500">42.5k</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-indigo-600' : ''}
            >
              Todos
            </Button>
            <Button 
              variant={filter === 'error' ? 'destructive' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('error')}
            >
              Erros
            </Button>
            <Button 
              variant={filter === 'warning' ? 'secondary' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('warning')}
              className={filter === 'warning' ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}
            >
              Avisos
            </Button>
          </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" className="gap-2" onClick={refreshLogs}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
              </Button>
              <Button 
                variant={isRealtime ? "default" : "outline"} 
                size="sm" 
                className={`gap-2 ${isRealtime ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                onClick={() => setIsRealtime(!isRealtime)}
              >
                <Activity className={`w-4 h-4 ${isRealtime ? 'animate-pulse' : ''}`} /> 
                {isRealtime ? 'Tempo Real: ON' : 'Ligar Tempo Real'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={async () => {
                  const studioId = '00000000-0000-0000-0000-000000000000'
                  const testEmail = `test-${Date.now()}@danceflow.ai`
                  toast({ title: "Simulando evento...", description: "Enviando comando para o Supabase" })
                  
                  const { error } = await supabase.from('students').insert({
                    studio_id: studioId,
                    name: '🚀 TESTE REALTIME ADMIN',
                    email: testEmail,
                    status: 'active'
                  })

                  if (error) {
                    toast({ 
                      title: "Erro na simulação", 
                      description: error.message.includes('current_studio_id') 
                        ? "Você precisa atualizar o SQL no Supabase dashboard primeiro!" 
                        : error.message, 
                      variant: "destructive" 
                    })
                  }
                }}
              >
                <Zap className="w-4 h-4" /> Simular Ação
              </Button>
              <Button variant="outline" size="sm" className="gap-2 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setLogs([])}>
                <Trash2 className="w-4 h-4" /> Limpar Logs
              </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Exportar CSV
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-lg">Visualizador de Eventos em Tempo Real</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                  <TableHead className="w-[180px] pl-6">Data/Hora</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead className="w-[150px]">Origem</TableHead>
                  <TableHead>Mensagem do Sistema</TableHead>
                  <TableHead className="w-[150px]">Contexto</TableHead>
                  <TableHead className="text-right pr-6 w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-xs">
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800">
                    <TableCell className="pl-6 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-bold uppercase tracking-tighter">
                        {getTypeIcon(log.type)}
                        {log.type}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">
                      {log.source}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-slate-700 dark:text-slate-300 font-medium">
                      {log.message}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800">
                        {log.studio}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" className="text-indigo-600 font-bold hover:bg-indigo-50">
                        DEBUG
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Health Check */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" />
                <CardTitle className="text-sm">API Gateway</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Status: Operacional</span>
                <span className="text-xs font-bold text-emerald-500">LATENCY: 42ms</span>
              </div>
              <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <CardTitle className="text-sm">Main PostgreSQL</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Status: Operacional</span>
                <span className="text-xs font-bold text-emerald-500">CONN: 14/100</span>
              </div>
              <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <CardTitle className="text-sm">Cache (Redis)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Status: Operacional</span>
                <span className="text-xs font-bold text-emerald-500">HIT RATE: 94%</span>
              </div>
              <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
