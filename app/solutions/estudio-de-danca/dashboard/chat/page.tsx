"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, Loader2, Music, Bot, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModuleGuard } from "@/components/providers/module-guard"
import { getLocalUser } from "@/lib/constants/storage-keys"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

async function getStudioId(): Promise<string | null> {
  if (typeof window === "undefined") return null
  try {
    const user = getLocalUser("estudio-de-danca")
    const sid = user?.studio_id || user?.studioId || null
    if (sid) return sid
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.user_metadata?.studio_id ?? null
  } catch {
    return null
  }
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  /** Para mensagens assistant: pergunta do usuário que gerou esta resposta */
  replyTo?: string
}

const SUGGESTIONS = [
  "Como melhorar a retenção de alunos?",
  "Dicas para aumentar matrículas no mês",
  "Como organizar recitais de fim de ano?",
  "Como precificar mensalidades corretamente?",
]

export default function ChatPage() {
  const [feedbackModal, setFeedbackModal] = useState<{ msg: Message; prevUserMsg: string } | null>(null)
  const [correctedAnswer, setCorrectedAnswer] = useState("")
  const [sendingFeedback, setSendingFeedback] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Olá! Sou a Catarina, sua secretária virtual. Posso ajudar com gestão do seu estúdio, dicas de retenção de alunos, estratégias de marketing e muito mais. Como posso ajudar? 💃",
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
      const studioId = await getStudioId()
      const allMessages = [...messages, userMsg]
      const history = allMessages.slice(0, -1).map(m => ({ role: m.role as "user" | "assistant", content: m.content }))

      // Usa Gemini (GOOGLE_AI_API_KEY) por padrão; fallback para OpenAI se preferir
      const apiEndpoint = "/api/gemini"
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history,
          context: studioId ? { studio_id: studioId, is_admin: true } : undefined,
          model: "gemini-2.5-pro",
        }),
      })
      const data = await res.json()

      let content: string
      if (!res.ok) {
        content = data.error || "Erro ao processar. Tente novamente."
      } else {
        content = data.response || data.message || data.content || "Desculpe, não consegui processar."
      }

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + "_ai", role: "assistant", content, replyTo: msg },
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

  const sendFeedback = async (msg: Message, feedback: "positive" | "negative" | "correction", corrected?: string) => {
    const studioId = await getStudioId()
    if (!studioId) return
    setSendingFeedback(true)
    try {
      await fetch("/api/ai/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studioId,
          type: "feedback",
          data: {
            originalQuestion: msg.replyTo || "",
            originalAnswer: msg.content,
            feedback,
            correctedAnswer: corrected,
          },
        }),
      })
      setFeedbackModal(null)
      setCorrectedAnswer("")
    } catch (e) {
      console.error("Erro ao enviar feedback:", e)
    } finally {
      setSendingFeedback(false)
    }
  }

  return (
    <ModuleGuard module="ai_chat" showFullError>
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
              <div className={cn("flex flex-col gap-1", msg.role === "user" && "items-end")}>
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
                {msg.role === "assistant" && msg.id !== "0" && msg.replyTo && (
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => sendFeedback(msg, "positive")}
                      className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600"
                      title="Resposta útil"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setFeedbackModal({ msg, prevUserMsg: msg.replyTo! })}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                      title="Resposta incorreta"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
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

      <Dialog open={!!feedbackModal} onOpenChange={(open) => !open && setFeedbackModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corrigir resposta</DialogTitle>
            <DialogDescription>
              Envie a resposta correta para que a IA aprenda. Isso melhora as respostas futuras.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Digite a resposta correta..."
            value={correctedAnswer}
            onChange={(e) => setCorrectedAnswer(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => sendFeedback(feedbackModal!.msg, "negative")} disabled={sendingFeedback}>
              Só negativo
            </Button>
            <Button onClick={() => sendFeedback(feedbackModal!.msg, "correction", correctedAnswer)} disabled={sendingFeedback || !correctedAnswer.trim()}>
              Enviar correção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ModuleGuard>
  )
}
