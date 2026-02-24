"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Send,
  Sparkles,
  FireExtinguisher,
  ClipboardList,
  Building2,
  Calendar,
  TrendingUp,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const sugestoes = [
  { label: "Extintores vencendo este mês", icon: FireExtinguisher },
  { label: "Quantas OS estão em aberto?", icon: ClipboardList },
  { label: "Clientes sem vistoria este ano", icon: Building2 },
  { label: "Agendar vistorias pendentes", icon: Calendar },
]

const respostasDemo: Record<string, string> = {
  "Extintores vencendo este mês": "📊 **Extintores com recarga vencendo em março/2026:**\n\n• **EXT-002** — Hospital São Lucas (1º Andar — Corredor A) — vence em 01/03/2026\n• **EXT-007** — Condomínio Alegre (Garagem A) — vence em 05/03/2026\n\nTotal: **2 extintores** requerem ação imediata. Deseja que eu gere as OS de recarga automaticamente?",
  "Quantas OS estão em aberto?": "📋 **Resumo atual de Ordens de Serviço:**\n\n• **Abertas:** 2 OS aguardando atribuição\n• **Em andamento:** 1 OS (Ricardo Alves — Cond. Alegre)\n• **Concluídas este mês:** 3 OS\n• **Canceladas:** 1 OS\n\nA OS mais urgente é a **OS-2026-002** do Hospital São Lucas (AVCB vencido). Deseja detalhes?",
  "Clientes sem vistoria este ano": "🔍 **Clientes sem vistoria registrada em 2026:**\n\n1. **Escola Municipal Primeiro Passo** — última vistoria: out/2025 ⚠️\n2. **Fábrica Metalúrgica Norte** — nunca vistoriada 🚨\n\nRecomendo agendar vistorias com urgência. Deseja que eu gere um plano de agendamento?",
  "Agendar vistorias pendentes": "📅 **Plano de agendamento sugerido:**\n\n**Semana 24/02 – 28/02:**\n• Hospital São Lucas — Hidrantes (Ricardo, seg 09:00)\n\n**Semana 03/03 – 07/03:**\n• Escola Municipal — Rotineira (Paulo, qua 14:00)\n• Fábrica Metalúrgica — Primeira vistoria (Fernanda, sex 10:00)\n\nDeseja confirmar esses agendamentos?",
}

const msgInicial: Message = {
  id: "0",
  role: "assistant",
  content: "Olá! Sou o **assistente de IA do FireControl** 🔥\n\nPosso te ajudar com:\n• Consultas sobre extintores, OS e vistorias\n• Análise de dados e alertas\n• Geração automática de agendamentos\n• Relatórios em tempo real\n\nComo posso ajudar hoje?",
  timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
}

function formatContent(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      return `<span key="${i}">${boldLine}</span>`
    })
    .join("<br/>")
}

export default function ChatIAPage() {
  const [messages, setMessages] = useState<Message[]>([msgInicial])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800))

    const resposta =
      respostasDemo[content] ||
      `Entendido! Estou analisando sua solicitação sobre **"${content}"**.\n\nBaseado nos dados do sistema, posso verificar extintores, OS, vistorias e clientes. Para consultas específicas, tente usar os atalhos abaixo ou descreva melhor o que precisa.`

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: resposta,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, assistantMsg])
    setLoading(false)
  }

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Chat IA
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Assistente inteligente para segurança contra incêndio
          </p>
        </div>
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-600/20 dark:text-purple-400 border-0 font-bold w-fit">
          <Zap className="w-3 h-3 mr-1" />
          IA Ativa
        </Badge>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-red-600 flex items-center justify-center text-white flex-shrink-0 mr-2 mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === "user"
                  ? "bg-red-600 text-white rounded-tr-none"
                  : "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-tl-none"
              )}>
                <div
                  className="text-sm leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
                <div className="flex items-center justify-between mt-2 gap-4">
                  <span className={cn("text-[10px]", msg.role === "user" ? "text-red-200" : "text-slate-400")}>
                    {msg.timestamp}
                  </span>
                  {msg.role === "assistant" && (
                    <div className="flex gap-1">
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button className="text-slate-400 hover:text-emerald-500 transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button className="text-slate-400 hover:text-red-500 transition-colors">
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-red-600 flex items-center justify-center text-white flex-shrink-0 mr-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 dark:bg-white/10 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Sugestões rápidas */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <button
                key={s.label}
                onClick={() => sendMessage(s.label)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-600/10 hover:text-red-600 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-white/10"
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
          <Input
            placeholder="Pergunte sobre extintores, OS, vistorias..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1"
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
