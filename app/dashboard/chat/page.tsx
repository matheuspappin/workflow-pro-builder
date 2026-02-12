"use client"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sparkles,
  Send,
  Loader2,
  Lightbulb,
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  Bot,
  User,
  RefreshCw,
  GraduationCap,
  Clock,
  MessageSquarePlus,
  MessageSquare,
  Trash2,
} from "lucide-react"
import { getDashboardStats, saveChatSession, getChatSessions, getChatSessionById, deleteChatSession } from "@/lib/database-utils"
import { ModuleGuard } from "@/components/providers/module-guard"
import { useVocabulary } from "@/hooks/use-vocabulary"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestedQuestions = [
  {
    icon: TrendingUp,
    question: "Como posso aumentar a taxa de retencao de alunos?",
    category: "Retencao",
  },
  {
    icon: Users,
    question: "Quais alunos estao em risco de evasao?",
    category: "Evasao",
  },
  {
    icon: Calendar,
    question: "Qual o melhor horario para abrir novas turmas?",
    category: "Planejamento",
  },
  {
    icon: AlertTriangle,
    question: "Quais sao os principais problemas financeiros do estudio?",
    category: "Financeiro",
  },
]

async function getAIResponse(message: string, history: Message[], provider: "chatgpt" | "gemini", selectedModel?: string, currentPendingAction?: any): Promise<any> {
  try {
    // Timeout para evitar requests muito longos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    const apiEndpoint = provider === "chatgpt" ? '/api/chat' : '/api/gemini'
    const providerName = provider === "chatgpt" ? "ChatGPT" : "Gemini"

    console.log(`🤖 Fazendo request para ${providerName}:`, message.substring(0, 50) + '...')

    // Limitar o histórico enviado para os últimos 10 mensagens para não exceder limites
    const recentHistory = history.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }))

    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("danceflow_user") || "{}") : {}
    const studioId = user.studio_id || user.studioId

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        history: recentHistory,
        model: provider === "gemini" ? selectedModel : undefined,
        context: {
          studio_id: studioId,
          pendingAction: currentPendingAction,
        }
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro ${response.status} na API ${providerName}:`, errorText)

      // Retornar erro específico baseado no status
      let errorMessage = `Erro na API ${providerName}: ${response.status}`

      if (response.status === 429) {
        errorMessage = `Limite de requisições excedido para ${providerName}. Tente novamente em alguns minutos.`
      } else if (response.status === 401) {
        errorMessage = `Chave da API do ${providerName} inválida. Verifique as configurações.`
      } else if (response.status === 500) {
        errorMessage = `Erro interno do ${providerName}. Tente novamente em alguns instantes.`
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log(`✅ Resposta recebida de ${providerName}`)

    // Verificar se a resposta não está vazia
    if (!data || (!data.response && !data.content && typeof data !== 'string')) {
      throw new Error('Resposta vazia ou inválida da API')
    }

    return data

  } catch (error) {
    console.error('💥 Erro ao obter resposta da IA:', error)

    const providerName = provider === "chatgpt" ? "ChatGPT" : "Gemini"
    let errorMessage = `Desculpe, ocorreu um erro ao processar sua solicitação com ${providerName}.`

    if (error.name === 'AbortError') {
      errorMessage = `Desculpe, a solicitação para ${providerName} demorou muito para responder. Tente novamente com uma pergunta mais simples.`
    } else if (error.message) {
      errorMessage += ` Detalhes: ${error.message}`
    }

    return {
      response: errorMessage + '\n\n💡 Dicas:\n• Verifique se a chave da API está configurada\n• Tente novamente em alguns instantes\n• Use perguntas mais específicas',
      intent: 'error',
      confidence: 0,
      actionExecuted: false
    }
  }
}

export default function ChatPage() {
  const { vocabulary } = useVocabulary()
  // Carregar estado do chat do localStorage
  const loadChatState = () => {
    try {
      const saved = localStorage.getItem('danceflow_chat_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          messages: parsed.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) || [],
          pendingAction: parsed.pendingAction || null,
          aiProvider: parsed.aiProvider || "chatgpt",
          selectedGeminiModel: parsed.selectedGeminiModel || "gemini-2.0-flash"
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estado do chat:', error)
    }
    return null
  }

  const suggestedQuestions = [
    {
      icon: TrendingUp,
      question: `Como posso aumentar a taxa de retencao de ${vocabulary.clients.toLowerCase()}?`,
      category: "Retencao",
    },
    {
      icon: Users,
      question: `Quais ${vocabulary.clients.toLowerCase()} estao em risco de evasao?`,
      category: "Evasao",
    },
    {
      icon: Calendar,
      question: `Qual o melhor horario para abrir novas ${vocabulary.services.toLowerCase()}?`,
      category: "Planejamento",
    },
    {
      icon: AlertTriangle,
      question: `Quais sao os principais problemas financeiros do ${vocabulary.establishment.toLowerCase()}?`,
      category: "Financeiro",
    },
  ]

  const initialState = loadChatState()
  const defaultMessages = [
    {
      id: Date.now().toString(),
      role: "assistant",
      content: `Ola! Sou o seu assistente IA. 💾 Seu contexto de conversa é automaticamente salvo e mantido entre sessões. Posso ajudar a analisar os dados do seu ${vocabulary.establishment.toLowerCase()} e fornecer insights valiosos. Como posso ajudar hoje?`,
      timestamp: new Date(),
    },
  ]

  const [messages, setMessages] = useState<Message[]>(initialState?.messages || defaultMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [aiProvider, setAiProvider] = useState<"chatgpt" | "gemini">(initialState?.aiProvider || "chatgpt")
  const [selectedGeminiModel, setSelectedGeminiModel] = useState<string>(initialState?.selectedGeminiModel || "gemini-2.0-flash")
  const [pendingAction, setPendingAction] = useState<any>(initialState?.pendingAction || null)
  const [lastRequestTime, setLastRequestTime] = useState<number>(0)
  const [responseCache, setResponseCache] = useState<Map<string, any>>(new Map())
  const [dashboardData, setDashboardData] = useState<any>({
    activeStudents: 0,
    activeTeachers: 0,
    activeClasses: 0
  })
  const [chatSessions, setChatSessions] = useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Carregar dados reais do estúdio para o resumo lateral
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getDashboardStats()
        if (stats) {
          setDashboardData(stats)
        }
      } catch (error) {
        console.error('Erro ao carregar stats no chat:', error)
      }
    }
    loadStats()
  }, [])

  // Carregar sessões anteriores (Minhas Conversas)
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessions = await getChatSessions()
        setChatSessions(sessions)
      } catch (error) {
        console.error('Erro ao carregar sessões:', error)
      }
    }
    loadSessions()
  }, [])

  // Salvar sessão atual automaticamente
  useEffect(() => {
    // Só salva se tiver mensagens de usuário e não estiver carregando
    const hasUserMessage = messages.some(m => m.role === 'user')
    
    if (hasUserMessage && !isLoading) {
      const saveSession = async () => {
        const sessionData = {
          id: currentSessionId,
          messages: messages,
          // Título baseado na primeira mensagem do usuário
          title: messages.find(m => m.role === 'user')?.content.substring(0, 40) || 'Nova Conversa'
        }
        
        const saved = await saveChatSession(sessionData)
        if (saved) {
          if (!currentSessionId) {
            setCurrentSessionId(saved.id)
            // Atualizar lista
            const sessions = await getChatSessions()
            setChatSessions(sessions)
          } else {
            // Atualizar título na lista local se mudou (opcional, mas bom UX)
            // Aqui apenas garantimos que a lista está atualizada com timestamp
            setChatSessions(prev => prev.map(s => s.id === saved.id ? { ...s, title: saved.title, updated_at: saved.updated_at } : s))
          }
        }
      }
      
      const timer = setTimeout(saveSession, 2000)
      return () => clearTimeout(timer)
    }
  }, [messages, currentSessionId, isLoading])

  const handleLoadSession = async (sessionId: string) => {
    try {
      setIsLoading(true)
      const session = await getChatSessionById(sessionId)
      if (session) {
        // Converter timestamps das mensagens e garantir que são objetos Date
        const loadedMessages = (session.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp || Date.now())
        }))
        
        setMessages(loadedMessages)
        setCurrentSessionId(sessionId)
        setPendingAction(null)
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      try {
        await deleteChatSession(sessionId)
        setChatSessions(prev => prev.filter(s => s.id !== sessionId))
        if (currentSessionId === sessionId) {
          handleClearChat()
        }
      } catch (error) {
        console.error('Erro ao deletar sessão:', error)
      }
    }
  }

  // Salvar estado do chat no localStorage
  const saveChatState = () => {
    try {
      const state = {
        messages,
        pendingAction,
        aiProvider,
        selectedGeminiModel,
        timestamp: Date.now()
      }
      localStorage.setItem('danceflow_chat_state', JSON.stringify(state))
    } catch (error) {
      console.error('Erro ao salvar estado do chat:', error)
    }
  }

  // Salvar estado sempre que houver mudanças
  useEffect(() => {
    saveChatState()
  }, [messages, pendingAction, aiProvider, selectedGeminiModel])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Função para verificar se mensagem já existe (prevenir duplicação)
  const isMessageDuplicate = (content: string, role: "user" | "assistant"): boolean => {
    return messages.some(msg =>
      msg.role === role &&
      msg.content.trim().toLowerCase() === content.trim().toLowerCase()
    )
  }

  // Função para validar mensagem
  const validateMessage = (content: string): { valid: boolean, error?: string } => {
    const trimmed = content.trim()

    if (!trimmed) {
      return { valid: false, error: "Mensagem vazia" }
    }

    if (trimmed.length < 2) {
      return { valid: false, error: "Mensagem muito curta" }
    }

    if (trimmed.length > 2000) {
      return { valid: false, error: "Mensagem muito longa (máximo 2000 caracteres)" }
    }

    // Verificar se é uma mensagem duplicada recente
    if (isMessageDuplicate(trimmed, "user")) {
      return { valid: false, error: "Mensagem duplicada - já enviada recentemente" }
    }

    return { valid: true }
  }

  // Função para gerar chave de cache baseada na mensagem
  const generateCacheKey = (message: string, provider: string, model?: string): string => {
    const normalizedMessage = message.trim().toLowerCase()
    const key = `${provider}_${model || 'default'}_${normalizedMessage.substring(0, 50)}`
    return btoa(key).substring(0, 32) // Base64 e limita tamanho
  }

  // Função para verificar cache de respostas
  const getCachedResponse = (message: string, provider: string, model?: string) => {
    const key = generateCacheKey(message, provider, model)
    const cached = responseCache.get(key)

    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutos
      console.log('📋 Usando resposta em cache')
      return cached.response
    }

    return null
  }

  // Função para salvar resposta no cache
  const setCachedResponse = (message: string, provider: string, model: string | undefined, response: any) => {
    const key = generateCacheKey(message, provider, model)
    setResponseCache(prev => new Map(prev.set(key, {
      response,
      timestamp: Date.now()
    })))
  }

  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    // Validar mensagem
    const validation = validateMessage(trimmedInput)
    if (!validation.valid) {
      console.warn('Mensagem inválida:', validation.error)
      // Continua mesmo com validação falhada para não bloquear usuário
    }

    // Verificar timeout mínimo entre requests (2 segundos)
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < 2000) {
      console.log('Aguardando cooldown entre mensagens...')
      await new Promise(resolve => setTimeout(resolve, 2000 - timeSinceLastRequest))
    }

    const userMessage: Message = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setLastRequestTime(Date.now())

    // Obter resposta da IA via API (Cache desativado para evitar repetição)
    const response = await getAIResponse(userMessage.content, messages, aiProvider, selectedGeminiModel, pendingAction)

    // Extrair dados da resposta (assumindo que getAIResponse retorna um objeto)
    const aiResponseContent = typeof response === 'string' ? response : response.response || response
    const responseData = typeof response === 'object' ? response : {}

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: aiResponseContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, aiResponse])

    // Atualizar estado da ação pendente baseado na resposta
    if (responseData.pendingAction) {
      setPendingAction(responseData.pendingAction)
    } else if (responseData.actionExecuted) {
      setPendingAction(null)
    }

    setIsLoading(false)
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  const handleClearChat = () => {
    const defaultMessages = [
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Ola! Sou o seu assistente IA. Estou aqui para ajudar a analisar os dados do seu ${vocabulary.establishment.toLowerCase()} e fornecer insights valiosos. Como posso ajudar hoje?`,
        timestamp: new Date(),
      },
    ]
    setMessages(defaultMessages)
    setPendingAction(null)
    setAiProvider("chatgpt")
    setSelectedGeminiModel("gemini-2.0-flash")
    setCurrentSessionId(null) // Resetar ID da sessão

    // Limpar estado salvo
    localStorage.removeItem('danceflow_chat_state')
  }

  return (
    <ModuleGuard module="ai_chat" showFullError>
      <div className="min-h-screen bg-background">
        <Header title="Chat IA" />

        <div className="p-6 h-[calc(100vh-4rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-card border-border max-h-[300px] flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Minhas Conversas
                  </CardTitle>
                  <CardDescription>Histórico de 15 dias</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2 pt-0 space-y-1 custom-scrollbar">
                  {chatSessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">Nenhuma conversa salva.</p>
                  ) : (
                    chatSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleLoadSession(session.id)}
                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          currentSessionId === session.id 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent"
                        }`}
                      >
                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                          <span className="text-sm font-medium truncate">
                            {session.title || 'Sem título'}
                          </span>
                          <span className="text-[10px] opacity-70">
                            {new Date(session.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteSession(e, session.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Sugestoes
                  </CardTitle>
                  <CardDescription>Perguntas frequentes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestedQuestions.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(item.question)}
                      className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <item.icon className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      </div>
                      <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {item.question}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-card-foreground text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Dados Analisados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> {vocabulary.clients}
                    </span>
                    <span className="font-bold text-foreground">
                      {dashboardData.activeStudents || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5" /> {vocabulary.providers}
                    </span>
                    <span className="font-bold text-foreground">
                      {dashboardData.activeTeachers || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> {vocabulary.services}
                    </span>
                    <span className="font-bold text-foreground">
                      {dashboardData.activeClasses || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Periodo
                    </span>
                    <span className="font-medium text-foreground">12 meses</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <Card className="lg:col-span-3 bg-card border-border flex flex-col h-[calc(100vh-8rem)]">
              <CardHeader className="border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-card-foreground flex items-center gap-2">
                        Assistente IA
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          💾 Contexto salvo
                        </span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        Online - Pronto para ajudar
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={aiProvider} onValueChange={(value: "chatgpt" | "gemini") => setAiProvider(value)}>
                      <SelectTrigger className="w-[120px] h-8 bg-secondary/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chatgpt">ChatGPT</SelectItem>
                        <SelectItem value="gemini">Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                    {aiProvider === "gemini" && (
                      <Select value={selectedGeminiModel} onValueChange={setSelectedGeminiModel}>
                        <SelectTrigger className="w-[140px] h-8 bg-secondary/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.0-flash">Flash 2.0</SelectItem>
                          <SelectItem value="gemini-1.5-flash">Flash 1.5</SelectItem>
                          <SelectItem value="gemini-1.5-pro">Pro 1.5</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearChat}
                      className="gap-2 text-xs h-8 bg-background hover:bg-accent"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      Nova Conversa
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div className={`text-xs mt-2 ${
                          message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analisando dados...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua pergunta..."
                    className="flex-1 bg-background"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!input.trim() || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  A IA analisa dados reais do seu {vocabulary.establishment.toLowerCase()} para fornecer recomendacoes personalizadas.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ModuleGuard>
  )
}
