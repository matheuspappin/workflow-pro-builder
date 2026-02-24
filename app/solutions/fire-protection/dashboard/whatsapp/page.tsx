"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Phone,
  Send,
  Users,
  CheckCircle,
  Clock,
  MessageSquare,
  Plus,
  Zap,
  Bell,
  RefreshCw,
  Settings,
  ChevronRight,
  Building2,
  AlertTriangle,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

const mockConversas = [
  {
    id: "1",
    nome: "João Silva — Cond. Alegre",
    ultimaMensagem: "Quando vem o técnico para a recarga?",
    horario: "10:32",
    naoLidas: 2,
    tipo: "cliente",
  },
  {
    id: "2",
    nome: "Ricardo Alves (Técnico)",
    ultimaMensagem: "OS-001 concluída ✅",
    horario: "09:15",
    naoLidas: 0,
    tipo: "tecnico",
  },
  {
    id: "3",
    nome: "Escola Municipal Primeiro Passo",
    ultimaMensagem: "Precisamos agendar nova vistoria",
    horario: "Ontem",
    naoLidas: 1,
    tipo: "cliente",
  },
  {
    id: "4",
    nome: "Fernanda Souza (Técnica)",
    ultimaMensagem: "Cheguei no Hospital São Lucas",
    horario: "Ontem",
    naoLidas: 0,
    tipo: "tecnico",
  },
]

const automacoes = [
  {
    id: "1",
    titulo: "Lembrete de Vistoria",
    descricao: "Envia lembrete 3 dias antes da vistoria agendada",
    ativa: true,
    icone: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-600/20",
  },
  {
    id: "2",
    titulo: "Extintor Vencendo",
    descricao: "Notifica clientes com extintores a vencer em 30 dias",
    ativa: true,
    icone: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-600/20",
  },
  {
    id: "3",
    titulo: "OS Concluída",
    descricao: "Avisa o cliente quando a OS for finalizada",
    ativa: true,
    icone: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-600/20",
  },
  {
    id: "4",
    titulo: "Boas-vindas Novo Cliente",
    descricao: "Mensagem automática ao cadastrar novo cliente",
    ativa: false,
    icone: Building2,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-600/20",
  },
]

export default function WhatsAppPage() {
  const [mensagem, setMensagem] = useState("")
  const [activeTab, setActiveTab] = useState<"conversas" | "automacoes" | "disparos">("conversas")
  const [automacaoState, setAutomacaoState] = useState(
    automacoes.reduce((acc, a) => ({ ...acc, [a.id]: a.ativa }), {} as Record<string, boolean>)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Phone className="w-6 h-6 text-green-600" />
            WhatsApp
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Comunicação e automações via WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-600/10 border border-emerald-200 dark:border-emerald-600/30">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Conectado</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {[
          { key: "conversas", label: "Conversas", icon: MessageSquare },
          { key: "automacoes", label: "Automações", icon: Zap },
          { key: "disparos", label: "Disparo em Massa", icon: Send },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === tab.key
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conversas */}
      {activeTab === "conversas" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
          <div className="md:col-span-1 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-white/5">
              <Input placeholder="Buscar conversa..." className="text-sm" />
            </div>
            <div className="overflow-y-auto h-[calc(100%-57px)]">
              {mockConversas.map((conv) => (
                <div key={conv.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer border-b border-slate-50 dark:border-white/5 transition-colors">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0",
                    conv.tipo === "cliente" ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-red-500 to-orange-600"
                  )}>
                    {conv.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{conv.nome}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{conv.horario}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{conv.ultimaMensagem}</p>
                  </div>
                  {conv.naoLidas > 0 && (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-white font-black">{conv.naoLidas}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">J</div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">João Silva — Cond. Alegre</p>
                <p className="text-xs text-emerald-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Online</p>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-white/10 rounded-xl rounded-tl-none px-4 py-2 max-w-xs">
                  <p className="text-sm text-slate-700 dark:text-slate-200">Bom dia! Quando vem o técnico para a recarga dos extintores?</p>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">10:30</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-white/10 rounded-xl rounded-tl-none px-4 py-2 max-w-xs">
                  <p className="text-sm text-slate-700 dark:text-slate-200">Quando vem o técnico para a recarga?</p>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">10:32</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-green-600 rounded-xl rounded-tr-none px-4 py-2 max-w-xs">
                  <p className="text-sm text-white">Olá João! O técnico Ricardo irá dia 25/02 entre 9h e 12h. Confirma?</p>
                  <p className="text-[10px] text-green-200 mt-1 text-right flex items-center justify-end gap-1">
                    10:35 <CheckCircle className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
              <Input
                placeholder="Digite uma mensagem..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="flex-1"
              />
              <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-3">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Automações */}
      {activeTab === "automacoes" && (
        <div className="space-y-3">
          {automacoes.map((aut) => (
            <Card key={aut.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", aut.bg)}>
                  <aut.icone className={cn("w-5 h-5", aut.color)} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{aut.titulo}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{aut.descricao}</p>
                </div>
                <Switch
                  checked={automacaoState[aut.id]}
                  onCheckedChange={(v) => setAutomacaoState((prev) => ({ ...prev, [aut.id]: v }))}
                />
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" />
            Criar nova automação
          </Button>
        </div>
      )}

      {/* Disparo em Massa */}
      {activeTab === "disparos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="w-5 h-5 text-green-600" />
                Novo Disparo
              </CardTitle>
              <CardDescription>Envie mensagens para múltiplos clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Destinatários</Label>
                <select className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm bg-background">
                  <option>Todos os clientes ativos</option>
                  <option>Clientes com extintor vencendo</option>
                  <option>Clientes com OS em aberto</option>
                  <option>Selecionar manualmente</option>
                </select>
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Olá {nome}! Lembramos que..."
                  className="mt-1"
                  rows={5}
                />
                <p className="text-xs text-slate-400 mt-1">Use {"{nome}"} para personalizar</p>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                <Send className="w-4 h-4 mr-2" />
                Enviar para todos
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Histórico de Disparos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { titulo: "Extintores vencendo — Fev/2026", enviados: 12, data: "20/02/2026", taxa: "91%" },
                { titulo: "Lembrete vistorias — Jan/2026", enviados: 8, data: "15/01/2026", taxa: "87%" },
                { titulo: "Feliz Ano Novo!", enviados: 25, data: "01/01/2026", taxa: "96%" },
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{h.titulo}</p>
                    <p className="text-xs text-slate-500">{h.data} · {h.enviados} enviados</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold">{h.taxa}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
