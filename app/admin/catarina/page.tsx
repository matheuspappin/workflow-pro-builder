"use client"

import React, { useState, useEffect, useRef } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  BarChart3,
  Building2,
  Target,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type CatarinaData = {
  period: string
  totalInteractions: number
  byChannel: Record<string, number>
  topIntents: Array<{ intent: string; count: number }>
  topStudios: Array< { studioId: string; studioName: string; count: number }>
  recentInteractions: Array<{
    id: string
    studio_id: string
    studioName: string
    customer_contact: string
    message: string
    ai_response: string
    intent_type: string
    channel: string
    created_at: string
  }>
}

type ChatMessage = { id: string; role: "user" | "assistant"; content: string; replyTo?: string }

export default function AdminCatarinaPage() {
  const { toast } = useToast()
  const [data, setData] = useState<CatarinaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{ msg: ChatMessage; prevUserMsg: string } | null>(null)
  const [correctedAnswer, setCorrectedAnswer] = useState("")
  const [sendingFeedback, setSendingFeedback] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const sendChatMessage = async () => {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return

    setChatInput("")
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: msg }
    setChatMessages((prev) => [...prev, userMsg])
    setChatLoading(true)

    try {
      const history = [...chatMessages, userMsg].slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/admin/catarina/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msg, history }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || `Erro ${res.status}`)
      }

      const content = json.response || "Não foi possível obter resposta."
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "_ai", role: "assistant", content, replyTo: msg },
      ])
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Erro ao conectar."
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "_err", role: "assistant", content: `Erro: ${errMsg}` },
      ])
      toast({ title: "Erro no chat", description: errMsg, variant: "destructive" })
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" })
  }, [chatMessages])

  const sendFeedback = async (msg: ChatMessage, feedback: "positive" | "negative" | "correction", corrected?: string) => {
    const prevUserMsg = msg.replyTo ?? ""
    setSendingFeedback(true)
    try {
      const res = await fetch("/api/admin/catarina/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          originalQuestion: prevUserMsg,
          originalAnswer: msg.content,
          feedback,
          correctedAnswer: corrected,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        toast({ title: "Feedback enviado", description: "Obrigado! Isso ajuda a melhorar a Catarina." })
      } else {
        toast({ title: "Erro", description: json.error || "Falha ao enviar feedback", variant: "destructive" })
      }
      setFeedbackModal(null)
      setCorrectedAnswer("")
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao enviar feedback", variant: "destructive" })
    } finally {
      setSendingFeedback(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/catarina?days=${days}&limit=50`, { credentials: 'include' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Erro ${res.status}`)
      }
      const json = await res.json()
      setData(json.data)
    } catch (e) {
      toast({
        title: "Erro ao carregar métricas",
        description: e instanceof Error ? e.message : "Falha na requisição",
        variant: "destructive",
      })
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [days])

  if (loading && !data) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader title="Comportamento da Catarina" />
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-white/60">Carregando métricas da IA...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Comportamento da Catarina" />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="chat" className="data-[state=active]:bg-white/10">
              <MessageSquare className="w-4 h-4 mr-2" /> Conversar com a Catarina
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-white/10">
              <BarChart3 className="w-4 h-4 mr-2" /> Métricas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5" />
                  Chat com a Catarina
                </CardTitle>
                <CardDescription className="text-white/50">
                  Converse com a assistente virtual. Ela pode ajudar com dúvidas sobre o ecossistema, o produto ou o sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col h-[420px]">
                  <div
                    ref={chatScrollRef}
                    className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg bg-black/20 border border-white/10 mb-4 min-h-[300px]"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-white/40 text-center py-8">
                        <Bot className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">Olá! Sou a Catarina. Como posso ajudar?</p>
                        <p className="text-xs mt-2">Digite uma mensagem abaixo para começar.</p>
                      </div>
                    ) : (
                      chatMessages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {m.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-white/70" />
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            <div
                              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                                m.role === "user"
                                  ? "bg-white/10 text-white"
                                  : "bg-white/5 text-white/90 border border-white/10"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>
                            {m.role === "assistant" && m.replyTo && (
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={() => sendFeedback(m, "positive")}
                                  className="p-1.5 rounded-lg hover:bg-green-900/30 text-green-500"
                                  title="Resposta útil"
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setFeedbackModal({ msg: m, prevUserMsg: m.replyTo! })}
                                  className="p-1.5 rounded-lg hover:bg-red-900/30 text-red-500"
                                  title="Resposta incorreta"
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          {m.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white/70" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      disabled={chatLoading}
                    />
                    <Button
                      onClick={sendChatMessage}
                      disabled={chatLoading || !chatInput.trim()}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                      {chatLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog open={!!feedbackModal} onOpenChange={(open) => !open && setFeedbackModal(null)}>
              <DialogContent className="bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Corrigir resposta</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Digite como a Catarina deveria ter respondido. Isso ajuda a melhorar as respostas futuras.
                  </DialogDescription>
                </DialogHeader>
                {feedbackModal && (
                  <div className="space-y-4">
                    <div className="text-sm">
                      <p className="text-white/50 font-bold uppercase text-xs mb-1">Pergunta</p>
                      <p className="text-white/80">{feedbackModal.prevUserMsg}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-white/50 font-bold uppercase text-xs mb-1">Resposta corrigida</p>
                      <Textarea
                        placeholder="Como a Catarina deveria ter respondido..."
                        value={correctedAnswer}
                        onChange={(e) => setCorrectedAnswer(e.target.value)}
                        className="min-h-[120px] bg-slate-800 border-white/10 text-white"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setFeedbackModal(null)} className="border-white/20 text-white">
                    Cancelar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => feedbackModal && sendFeedback(feedbackModal.msg, "negative")}
                    disabled={sendingFeedback}
                    className="border-white/20 text-white"
                  >
                    Só marcar como incorreto
                  </Button>
                  <Button
                    onClick={() => feedbackModal && sendFeedback(feedbackModal.msg, "correction", correctedAnswer)}
                    disabled={sendingFeedback || !correctedAnswer.trim()}
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    {sendingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar correção"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="metrics" className="mt-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white/90">Métricas da Catarina (IA)</h2>
            <p className="text-sm text-white/50 uppercase tracking-widest font-bold">Visão geral do ecossistema</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={days === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(7)}
              className="border-white/20 text-white"
            >
              7 dias
            </Button>
            <Button
              variant={days === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(30)}
              className="border-white/20 text-white"
            >
              30 dias
            </Button>
            <Button
              variant={days === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(90)}
              className="border-white/20 text-white"
            >
              90 dias
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-white/20 text-white" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-sm uppercase tracking-widest font-bold">Interações</p>
                  <p className="text-3xl font-black text-white">{data?.totalInteractions ?? 0}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-white/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-sm uppercase tracking-widest font-bold">Canais</p>
                  <p className="text-3xl font-black text-white">{Object.keys(data?.byChannel ?? {}).length}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-white/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-sm uppercase tracking-widest font-bold">Estúdios Ativos</p>
                  <p className="text-3xl font-black text-white">{data?.topStudios?.length ?? 0}</p>
                </div>
                <Building2 className="w-10 h-10 text-white/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-sm uppercase tracking-widest font-bold">Período</p>
                  <p className="text-2xl font-black text-white">{data?.period ?? '—'}</p>
                </div>
                <Clock className="w-10 h-10 text-white/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Intents */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="w-5 h-5" />
                Top Intenções
              </CardTitle>
              <CardDescription className="text-white/50">Tipos de pergunta mais frequentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data?.topIntents?.length ? (
                  data.topIntents.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                      <span className="text-sm text-white/80 truncate max-w-[200px]">{item.intent}</span>
                      <Badge variant="outline" className="border-white/20 text-white/80">{item.count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-white/40 text-sm py-4">Nenhuma interação registrada</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Studios */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="w-5 h-5" />
                Top Estúdios
              </CardTitle>
              <CardDescription className="text-white/50">Maior uso da Catarina</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data?.topStudios?.length ? (
                  data.topStudios.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                      <span className="text-sm text-white/80 truncate max-w-[200px]">{item.studioName}</span>
                      <Badge variant="outline" className="border-white/20 text-white/80">{item.count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-white/40 text-sm py-4">Nenhum dado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Interactions */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="w-5 h-5" />
              Interações Recentes
            </CardTitle>
            <CardDescription className="text-white/50">Últimas conversas da Catarina</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">Data</TableHead>
                  <TableHead className="text-white/50">Estúdio</TableHead>
                  <TableHead className="text-white/50">Canal</TableHead>
                  <TableHead className="text-white/50">Mensagem</TableHead>
                  <TableHead className="text-white/50 w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentInteractions?.length ? (
                  data.recentInteractions.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white/70 text-sm">
                          {new Date(row.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-white/70 text-sm">
                          <span className="truncate max-w-[120px] block">{row.studioName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-white/20 text-white/70 text-xs">{row.channel}</Badge>
                        </TableCell>
                        <TableCell className="text-white/80 text-sm max-w-[300px] truncate">
                          {row.message}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/50"
                            onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                          >
                            {expandedId === row.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedId === row.id && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-white/5 border-white/10 p-4">
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-white/50 font-bold uppercase text-xs mb-1">Usuário</p>
                                <p className="text-white/80">{row.customer_contact}</p>
                              </div>
                              <div>
                                <p className="text-white/50 font-bold uppercase text-xs mb-1">Pergunta</p>
                                <p className="text-white/80">{row.message}</p>
                              </div>
                              <div>
                                <p className="text-white/50 font-bold uppercase text-xs mb-1">Resposta da Catarina</p>
                                <p className="text-white/80 whitespace-pre-wrap">{row.ai_response}</p>
                              </div>
                              <div>
                                <Badge variant="outline" className="border-white/20 text-white/70">{row.intent_type}</Badge>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-white/40">
                      Nenhuma interação encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
