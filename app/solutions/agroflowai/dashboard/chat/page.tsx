"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Sparkles,
  Leaf,
  ClipboardList,
  MapPin,
  FileText,
  TrendingUp,
  Zap,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getLocalUser } from "@/lib/constants/storage-keys"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const sugestoes = [
  { label: "Quantas OS estão em aberto?", icon: ClipboardList },
  { label: "Propriedades com CAR pendente", icon: MapPin },
  { label: "Resumo dos laudos este mês", icon: FileText },
  { label: "Como está o faturamento?", icon: TrendingUp },
]

const msgInicial: Message = {
  id: "0",
  role: "assistant",
  content: "Olá! Sou a **Catarina**, sua assistente virtual especialista em regularização ambiental 🌿\n\nPosso te ajudar com:\n• Consultas sobre propriedades, OS e laudos\n• Análise de clientes e engenheiros\n• Métricas e faturamento\n• Sugestões de ações para regularização\n\nComo posso ajudar hoje?",
  timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

function formatContent(text: string) {
  const safe = escapeHtml(text)
  return safe
    .split("\n")
    .map((line, i) => {
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      return `<span key="${i}">${boldLine}</span>`
    })
    .join("<br/>")
}

function useStudioId() {
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const user = getLocalUser('agroflowai')
        const id = (user?.studioId || user?.studio_id) ?? null
        if (!cancelled) setStudioId(id)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])
  return { studioId, loadingStudio: loading }
}

export default function ChatIAPage() {
  const { studioId, loadingStudio } = useStudioId()
  const [messages, setMessages] = useState<Message[]>([msgInicial])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return
    if (!studioId) {
      setError("Carregando contexto do estúdio...")
      return
    }

    setError(null)
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch("/api/agroflowai/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: content,
          history,
          context: { studio_id: studioId, is_admin: true },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errMsg = data?.error || `Erro ${res.status}`
        setError(errMsg)
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Não foi possível processar. ${errMsg}\n\nConfigure uma chave de API (Gemini ou OpenAI) em Configurações.`,
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          },
        ])
        return
      }

      const resposta = data?.response || "Não foi possível gerar uma resposta."
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: resposta,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } catch (err: any) {
      setError(err?.message || "Erro de conexão")
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Erro: ${err?.message || "Tente novamente."}`,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loadingStudio) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-medium">Carregando Chat IA...</p>
        </div>
      </div>
    )
  }

  if (!studioId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center max-w-md p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="font-bold text-slate-900 dark:text-white mb-1">Estúdio não identificado</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Você precisa estar vinculado a um estúdio. Entre em contato com o administrador.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            Chat IA
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Assistente inteligente para compliance ambiental e agronegócio
          </p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400 border-0 font-bold w-fit">
          <Zap className="w-3 h-3 mr-1" />
          IA Ativa
        </Badge>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white flex-shrink-0 mr-2 mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-tr-none"
                  : "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-tl-none"
              )}>
                <div
                  className="text-sm leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
                <span className={cn("text-[10px] block mt-2", msg.role === "user" ? "text-emerald-200" : "text-slate-400")}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white flex-shrink-0 mr-2">
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

        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <button
                key={s.label}
                onClick={() => sendMessage(s.label)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-600/10 hover:text-emerald-600 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-white/10"
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
          <Input
            placeholder="Pergunte sobre propriedades, OS, laudos, CAR..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1"
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
