"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Database,
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
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

type LogRow = {
  id: string
  type: string
  source: string
  message: string
  studio: string
  timestamp: string
  metadata?: Record<string, unknown>
}

type Metrics = {
  errors24h: number
  warnings24h: number
  events24h: number
}

type HealthState = {
  database: { status: string; latency: string | null; message: string }
  api: { latency: string }
}

export default function AdminLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<LogRow[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ errors24h: 0, warnings24h: 0, events24h: 0 })
  const [health, setHealth] = useState<HealthState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'ai'>('all')
  const [isRealtime, setIsRealtime] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/logs', { credentials: 'include' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Erro ${res.status}`)
      }
      const data = await res.json()
      setLogs(data.logs || [])
      setMetrics(data.metrics || { errors24h: 0, warnings24h: 0, events24h: 0 })
    } catch (e) {
      toast({
        title: "Erro ao carregar logs",
        description: e instanceof Error ? e.message : "Falha na requisição",
        variant: "destructive",
      })
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/logs/health', { credentials: 'include' })
      const data = await res.json()
      setHealth(data)
    } catch {
      setHealth({
        database: { status: 'error', latency: null, message: 'Falha na requisição' },
        api: { latency: 'N/A' },
      })
    }
  }, [])

  useEffect(() => {
    fetchLogs()
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [fetchLogs, fetchHealth])

  const refreshLogs = async () => {
    setIsLoading(true)
    await fetchLogs()
    await fetchHealth()
    toast({ title: "Logs atualizados", description: "Dados sincronizados com o servidor." })
  }

  const persistRealtimeLog = async (log: LogRow) => {
    try {
      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: log.type,
          source: log.source,
          message: log.message,
          studio: log.studio,
        }),
      })
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    if (!isRealtime) return

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const newLog: LogRow = {
            id: `realtime-${Date.now()}`,
            type: payload.eventType === 'INSERT' ? 'success' : payload.eventType === 'DELETE' ? 'error' : 'warning',
            source: 'PostgreSQL',
            message: `${payload.eventType}: Registro na tabela "${payload.table}" modificado.`,
            timestamp: new Date().toISOString(),
            studio: payload.new && (payload.new as { studio_id?: string }).studio_id
              ? 'Estúdio: ' + (payload.new as { studio_id: string }).studio_id.substring(0, 8)
              : 'Global',
          }

          setLogs((prev) => [newLog, ...prev].slice(0, 100))
          persistRealtimeLog(newLog)

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

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Falha ao limpar')
      setLogs([])
      setMetrics({ errors24h: 0, warnings24h: 0, events24h: 0 })
      toast({ title: "Logs limpos", description: "Histórico removido." })
    } catch {
      toast({ title: "Erro ao limpar logs", variant: "destructive" })
    }
  }

  const exportCsv = () => {
    const headers = ['Data/Hora', 'Tipo', 'Origem', 'Mensagem', 'Contexto']
    const rows = filteredLogs.map((l) => [
      new Date(l.timestamp).toLocaleString('pt-BR'),
      l.type,
      l.source,
      `"${l.message.replace(/"/g, '""')}"`,
      l.studio,
    ])
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "CSV exportado" })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const isAISource = (source: string) => {
    const s = (source || '').toLowerCase()
    return s.includes('ai') || s.includes('catarina') || s.includes('gemini') || s.includes('chat')
  }
  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true
    if (filter === 'ai') return isAISource(log.source)
    return log.type === filter
  })

  const dbStatus = health?.database?.status === 'operational'
  const dbLatency = health?.database?.latency ?? '—'
  const apiLatency = health?.api?.latency ?? '—'

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Logs do Sistema" />
      
      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Erros (24h)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-red-500">{metrics.errors24h}</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alertas (24h)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-amber-500">{metrics.warnings24h}</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-2xl font-bold ${dbStatus ? 'text-emerald-500' : 'text-red-500'}`}>
                {dbStatus ? 'Operacional' : health?.database?.message || 'Indisponível'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eventos (24h)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-indigo-500">{metrics.events24h}</div>
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
            <Button 
              variant={filter === 'ai' ? 'secondary' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('ai')}
              className={filter === 'ai' ? 'bg-purple-500 text-white hover:bg-purple-600' : ''}
            >
              IA / Catarina
            </Button>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            <Button variant="outline" size="sm" className="gap-2" onClick={refreshLogs} disabled={isLoading}>
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
                toast({ title: "Simulando evento...", description: "Persistindo log de teste" })
                const res = await fetch('/api/admin/logs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    type: 'info',
                    source: 'Admin',
                    message: `🚀 Log de teste gerado em ${new Date().toLocaleString('pt-BR')}`,
                    studio: 'Sistema',
                  }),
                })
                if (res.ok) {
                  const { log } = await res.json()
                  setLogs((prev) => [log, ...prev])
                  toast({ title: "Log criado", description: "Evento de teste adicionado." })
                } else {
                  toast({ title: "Erro na simulação", variant: "destructive" })
                }
              }}
            >
              <Zap className="w-4 h-4" /> Simular Ação
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-red-200 text-red-600 hover:bg-red-50" onClick={handleClearLogs}>
              <Trash2 className="w-4 h-4" /> Limpar Logs
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
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
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-xs">
                {isLoading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                      Nenhum log registrado. Ative o tempo real para capturar eventos do banco.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Server className={`w-4 h-4 ${health ? 'text-emerald-500' : 'text-slate-400'}`} />
                <CardTitle className="text-sm">API Gateway</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Status: {health ? 'Operacional' : 'Verificando...'}
                </span>
                <span className="text-xs font-bold text-emerald-500">LATENCY: {apiLatency}</span>
              </div>
              <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${dbStatus ? 'text-emerald-500' : 'text-red-500'}`} />
                <CardTitle className="text-sm">PostgreSQL (Supabase)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Status: {dbStatus ? 'Operacional' : health?.database?.message || '—'}
                </span>
                <span className={`text-xs font-bold ${dbStatus ? 'text-emerald-500' : 'text-red-500'}`}>
                  {dbLatency ? `LATENCY: ${dbLatency}` : '—'}
                </span>
              </div>
              <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full w-full ${dbStatus ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
