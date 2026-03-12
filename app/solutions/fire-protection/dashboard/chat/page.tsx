"use client"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Sparkles,
  FireExtinguisher,
  ClipboardList,
  Building2,
  Calendar,
  Zap,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const FP_CHAT_STATE_KEY = "fp_chat_state"

async function apiGetSessions(studioId: string) {
  const res = await fetch(`/api/fire-protection/chat-sessions?studio_id=${studioId}`, {
    credentials: "include",
  })
  const data = await res.json()
  return data.sessions || []
}

async function apiSaveSession(studioId: string, payload: { id?: string; title?: string; messages: Message[] }) {
  const res = await fetch("/api/fire-protection/chat-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ studio_id: studioId, ...payload }),
  })
  if (!res.ok) return null
  return res.json()
}

async function apiGetSession(id: string, studioId: string) {
  const res = await fetch(`/api/fire-protection/chat-sessions/${id}?studio_id=${studioId}`, {
    credentials: "include",
  })
  if (!res.ok) return null
  return res.json()
}

async function apiDeleteSession(id: string, studioId: string) {
  const res = await fetch(`/api/fire-protection/chat-sessions/${id}?studio_id=${studioId}`, {
    method: "DELETE",
    credentials: "include",
  })
  return res.ok
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  replyTo?: string
}

const sugestoes = [
  { label: "Extintores vencendo este mês", icon: FireExtinguisher },
  { label: "Quantas OS estão em aberto?", icon: ClipboardList },
  { label: "Clientes sem vistoria este ano", icon: Building2 },
  { label: "Agendar vistorias pendentes", icon: Calendar },
]

const msgInicial: Message = {
  id: "0",
  role: "assistant",
  content: "Olá! Sou a **Catarina**, sua assistente virtual especialista em proteção contra incêndios 🔥\n\nPosso te ajudar com:\n• Consultas sobre extintores, OS e vistorias\n• Análise de dados e alertas\n• Geração automática de agendamentos\n• Relatórios em tempo real\n\nComo posso ajudar hoje?",
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
        const { data: { session } } = await supabase.auth.getSession()
        const sid = session?.user?.user_metadata?.studio_id ?? null
        if (sid && !cancelled) {
          setStudioId(sid)
        } else if (!cancelled) {
          try {
            const u = JSON.parse(localStorage.getItem("danceflow_user") || "{}")
            const id = u.studio_id || u.studioId || null
            setStudioId(id)
          } catch {
            setStudioId(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])
  return { studioId, loadingStudio: loading }
}

function loadChatState(studioId: string | null) {
  if (typeof window === "undefined" || !studioId) return null
  try {
    const raw = localStorage.getItem(FP_CHAT_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.studioId !== studioId) return null
    if (parsed?.timestamp && Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) return null
    return parsed
  } catch {
    return null
  }
}

function saveChatState(
  studioId: string,
  sessionId: string | null,
  messages: Message[]
) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      FP_CHAT_STATE_KEY,
      JSON.stringify({
        studioId,
        sessionId,
        messages,
        timestamp: Date.now(),
      })
    )
  } catch (e) {
    console.warn("Erro ao salvar cache do chat:", e)
  }
}

export default function ChatIAPage() {
  const { studioId, loadingStudio } = useStudioId()
  const [messages, setMessages] = useState<Message[]>([msgInicial])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<{ id: string; title: string; updated_at: string }[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{ msg: Message } | null>(null)
  const [correctedAnswer, setCorrectedAnswer] = useState("")
  const [sendingFeedback, setSendingFeedback] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const sendFeedback = async (msg: Message, feedback: "positive" | "negative" | "correction", corrected?: string) => {
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Carregar sessões do banco (via API - bypassa RLS)
  useEffect(() => {
    if (!studioId) return
    const load = async () => {
      try {
        const list = await apiGetSessions(studioId)
        setChatSessions(list)
      } catch (e) {
        console.warn("Erro ao carregar conversas:", e)
      }
    }
    load()
  }, [studioId])

  // Restaurar cache do localStorage ao montar
  useEffect(() => {
    if (!studioId || mounted) return
    const cached = loadChatState(studioId)
    if (cached?.messages?.length) {
      setMessages(cached.messages)
      if (cached.sessionId) setCurrentSessionId(cached.sessionId)
    }
    setMounted(true)
  }, [studioId, mounted])

  // Salvar cache no localStorage sempre que mensagens mudarem
  useEffect(() => {
    if (!studioId || !mounted) return
    saveChatState(studioId, currentSessionId, messages)
  }, [studioId, currentSessionId, messages, mounted])

  // Auto-salvar sessão no banco (debounce 2s)
  useEffect(() => {
    if (!studioId || !mounted || loading) return
    const hasUserMsg = messages.some((m) => m.role === "user")
    if (!hasUserMsg) return

    const timer = setTimeout(async () => {
      const title =
        messages.find((m) => m.role === "user")?.content?.substring(0, 40) || "Nova Conversa"
      const saved = await apiSaveSession(studioId, {
        id: currentSessionId || undefined,
        title,
        messages,
      })
      if (saved) {
        if (!currentSessionId) setCurrentSessionId(saved.id)
        const list = await apiGetSessions(studioId)
        setChatSessions(list)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [studioId, messages, currentSessionId, loading, mounted])

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

      const res = await fetch("/api/fire-protection/ai/chat", {
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
            content: `Não foi possível processar. ${errMsg}\n\nConfigure uma chave de API (Gemini) em Configurações > Integrações.`,
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
          replyTo: content,
        },
      ])
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Erro de conexão"
      setError(String(errMsg))
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Erro: ${errMsg}`,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleLoadSession = async (sessionId: string) => {
    if (!studioId) return
    try {
      setLoading(true)
      const session = await apiGetSession(sessionId, studioId)
      if (session?.messages?.length) {
        const msgs = session.messages as Message[]
        setMessages(msgs)
        setCurrentSessionId(sessionId)
        saveChatState(studioId, sessionId, msgs)
      }
    } catch (e) {
      console.warn("Erro ao carregar conversa:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (!confirm("Excluir esta conversa?")) return
    if (!studioId) return
    try {
      await apiDeleteSession(sessionId, studioId)
      setChatSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (currentSessionId === sessionId) handleNewConversation()
    } catch (e) {
      console.warn("Erro ao excluir conversa:", e)
    }
  }

  const handleNewConversation = () => {
    setMessages([msgInicial])
    setCurrentSessionId(null)
    if (studioId) saveChatState(studioId, null, [msgInicial])
  }

  if (loadingStudio) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-120px)]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          <p className="text-sm font-medium">Carregando Chat IA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
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
        <div className="flex items-center gap-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="sm:hidden">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Minhas Conversas
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    handleNewConversation()
                    setSheetOpen(false)
                  }}
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-2 space-y-1 max-h-[calc(100vh-80px)] overflow-y-auto">
                {chatSessions.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2">Nenhuma conversa salva</p>
                ) : (
                  chatSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        handleLoadSession(session.id)
                        setSheetOpen(false)
                      }}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg cursor-pointer",
                        currentSessionId === session.id
                          ? "bg-red-600/10 text-red-600"
                          : "hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                    >
                      <p className="text-sm truncate flex-1">{session.title || "Nova Conversa"}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(e, session.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-600/20 dark:text-purple-400 border-0 font-bold w-fit">
            <Zap className="w-3 h-3 mr-1" />
            IA Ativa
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar - Minhas Conversas */}
        <div className="hidden sm:flex w-48 md:w-56 flex-shrink-0 flex-col bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Minhas Conversas
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNewConversation}
              title="Nova conversa"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chatSessions.length === 0 ? (
              <p className="text-xs text-slate-500 p-2 text-center">Nenhuma conversa salva</p>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleLoadSession(session.id)}
                  className={cn(
                    "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                    currentSessionId === session.id
                      ? "bg-red-600/10 text-red-600 dark:text-red-400 border border-red-600/20"
                      : "hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium truncate">{session.title || "Nova Conversa"}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(session.updated_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Área do Chat */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm min-w-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-red-600 flex items-center justify-center text-white flex-shrink-0 mr-2 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-red-600 text-white rounded-tr-none"
                      : "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-tl-none"
                  )}
                >
                  <div
                    className="text-sm leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                  <div className="flex items-center justify-between mt-2 gap-4">
                    <span
                      className={cn(
                        "text-[10px]",
                        msg.role === "user" ? "text-red-200" : "text-slate-400"
                      )}
                    >
                      {msg.timestamp}
                    </span>
                    {msg.role === "assistant" && msg.id !== "0" && msg.replyTo && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => sendFeedback(msg, "positive")}
                          className="text-slate-400 hover:text-emerald-500 transition-colors"
                          title="Resposta útil"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setFeedbackModal({ msg })}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Resposta incorreta"
                        >
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
            <Button variant="outline" onClick={() => feedbackModal && sendFeedback(feedbackModal.msg, "negative")} disabled={sendingFeedback}>
              Só negativo
            </Button>
            <Button onClick={() => feedbackModal && sendFeedback(feedbackModal.msg, "correction", correctedAnswer)} disabled={sendingFeedback || !correctedAnswer.trim()}>
              Enviar correção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
