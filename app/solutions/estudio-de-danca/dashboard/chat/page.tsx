"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, Loader2, Music, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  "Como melhorar a retenção de alunos?",
  "Dicas para aumentar matrículas no mês",
  "Como organizar recitais de fim de ano?",
  "Como precificar mensalidades corretamente?",
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Olá! Sou o assistente IA do DanceFlow. Posso ajudar com gestão do seu estúdio, dicas de retenção de alunos, estratégias de marketing e muito mais. Como posso ajudar?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput("")
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: "dance_studio",
        }),
      })
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + "_ai", role: "assistant", content: data.message || data.content || "Desculpe, não consegui processar." },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + "_err", role: "assistant", content: "Erro ao conectar. Tente novamente." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-violet-600" />
          Chat IA
        </h1>
        <p className="text-slate-500 text-sm mt-1">Assistente inteligente para seu estúdio</p>
      </div>

      {/* Sugestões rápidas */}
      <div className="flex gap-2 flex-wrap">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => send(s)}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-600/30 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat */}
      <Card className="flex-1 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === "assistant" ? "bg-violet-600 text-white" : "bg-slate-200 dark:bg-slate-700"
              )}>
                {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <Music className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
              </div>
              <div
                className={cn(
                  "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 rounded-tl-sm"
                    : "bg-violet-600 text-white rounded-tr-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-white/10">
          <form
            onSubmit={(e) => { e.preventDefault(); send() }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo sobre seu estúdio..."
              className="flex-1 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl h-11"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-11 px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
