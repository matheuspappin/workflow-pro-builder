
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  LifeBuoy,
  MessageSquare,
  Plus,
  Send
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  lastMessage?: string
  user?: { email: string }
}

interface Message {
  id: string
  message: string
  created_at: string
  is_internal: boolean
  user: {
    email: string
  }
}

export default function SupportView() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // New Ticket Form State
  const [newSubject, setNewSubject] = useState("")
  const [newPriority, setNewPriority] = useState("low")
  const [newDescription, setNewDescription] = useState("")
  const [newCategory, setNewCategory] = useState("general")

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/support/tickets`)
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus tickets.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchMessages = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    fetchMessages(ticket.id)
  }

  const handleCreateTicket = async () => {
    if (!newSubject || !newDescription) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o assunto e a descrição.",
        variant: "destructive"
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          priority: newPriority,
          category: newCategory,
          message: newDescription
        })
      })

      if (!response.ok) throw new Error('Failed to create ticket')

      toast({
        title: "Ticket criado!",
        description: "Nossa equipe irá analisar e responder em breve.",
      })
      
      setIsCreating(false)
      setNewSubject("")
      setNewDescription("")
      setNewPriority("low")
      fetchTickets()
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o ticket.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !newMessage.trim()) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      })

      if (!response.ok) throw new Error('Failed to send message')

      await fetchMessages(selectedTicket.id)
      setNewMessage("")
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Aberto</Badge>
      case 'in_progress': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Em Análise</Badge>
      case 'closed': case 'resolved': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Resolvido</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suporte e Ajuda</h2>
          <p className="text-muted-foreground">Abra tickets para resolver problemas ou tirar dúvidas.</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Abrir Novo Ticket</DialogTitle>
              <DialogDescription>
                Descreva seu problema ou dúvida detalhadamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" placeholder="Ex: Erro ao cadastrar aluno" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="financial">Financeiro</SelectItem>
                      <SelectItem value="feature_request">Sugestão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  placeholder="Explique o que aconteceu..." 
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button onClick={handleCreateTicket} disabled={isSending}>
                {isSending ? "Criando..." : "Criar Ticket"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.length === 0 && !isLoading ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
            <LifeBuoy className="w-12 h-12 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Nenhum ticket encontrado</h3>
              <p className="text-sm text-muted-foreground">Você ainda não abriu nenhum chamado de suporte.</p>
            </div>
            <Button variant="outline" onClick={() => setIsCreating(true)}>Abrir meu primeiro ticket</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:border-indigo-500 transition-colors" onClick={() => handleTicketClick(ticket)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{ticket.id.split('-').pop()}</span>
                      {getStatusBadge(ticket.status)}
                      <span className="text-xs text-muted-foreground">• {new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{ticket.lastMessage || "Sem mensagens"}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <SheetContent className="w-full sm:w-[540px] flex flex-col p-0 sm:max-w-[540px]" side="right">
          {selectedTicket && (
            <>
              <div className="p-6 border-b">
                <SheetHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedTicket.status)}
                    <span className="text-xs font-mono text-muted-foreground">{selectedTicket.id}</span>
                  </div>
                  <SheetTitle className="text-xl">{selectedTicket.subject}</SheetTitle>
                  <SheetDescription>
                    Criado em {new Date(selectedTicket.created_at).toLocaleString('pt-BR')}
                  </SheetDescription>
                </SheetHeader>
              </div>
              
              <ScrollArea className="flex-1 p-6 bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    // Logic to determine if message is from user (me) or support
                    // In user view, "me" is the one viewing.
                    // If msg.user_id matches current user id (which we don't have easily here without session context)
                    // Alternatively, check if msg.is_internal is false. 
                    // Assuming support always replies with is_internal=false? No, admin might reply.
                    // Actually, our API sets is_internal=false for user messages, but what about admin replies?
                    // Admin replies should probably be is_internal=false if they are public replies?
                    // Or we check if user email is different.
                    
                    // Let's assume for now:
                    // If is_internal=true -> Support (System note?) - actually we filter is_internal usually for admins only?
                    // Wait, RLS for messages: "Users can view messages for accessible tickets".
                    // If admin marks message as internal, user shouldn't see it?
                    // The schema says `is_internal`. If it means "Private Note", then user shouldn't see it.
                    // If it means "From Staff", then user sees it.
                    // Usually `is_internal` means private note.
                    // So public replies from admin are just normal messages.
                    
                    // So how to distinguish? 
                    // We can check if `msg.user.email` contains 'admin' or matches specific pattern, 
                    // or better, if `msg.user.email` is NOT the ticket creator's email?
                    // We don't have ticket creator email in `selectedTicket` fully reliable here (optional in interface).
                    
                    // Let's use a simple heuristic:
                    const isSupport = msg.user?.email?.includes('admin') || msg.user?.email?.includes('suporte') || msg.is_internal
                    
                    return (
                      <div key={msg.id} className={`flex flex-col gap-1 ${isSupport ? 'items-start' : 'items-end'}`}>
                         <div className={`p-3 rounded-lg max-w-[85%] text-sm ${
                           isSupport
                             ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                             : 'bg-indigo-600 text-white rounded-tr-none' 
                         }`}>
                           {msg.message}
                         </div>
                         <span className="text-[10px] text-muted-foreground">
                           {new Date(msg.created_at).toLocaleString('pt-BR')} • {isSupport ? 'Suporte' : 'Você'}
                         </span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    placeholder="Digite sua resposta..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSending || !newMessage.trim()} size="icon" className="bg-indigo-600 hover:bg-indigo-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
