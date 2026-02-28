"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Send,
  User,
  Building2,
  ExternalLink,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  lastMessage?: string
  customer?: string
  studio?: string | { name: string }
  user: {
    email: string
    user_metadata: any
  }
}

interface Message {
  id: string
  message: string
  created_at: string
  is_internal: boolean
  user: {
    email: string
    user_metadata: any
  }
}

export default function AdminSupportPage() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/support/tickets?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tickets.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [searchTerm])

  const fetchMessages = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
        variant: "destructive"
      })
    }
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    fetchMessages(ticket.id)
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

      const newMsg = await response.json()
      
      // Update local state
      // We might need to fetch the full message object with user data or construct it locally
      // For simplicity, we'll re-fetch messages
      await fetchMessages(selectedTicket.id)
      setNewMessage("")
      
      toast({
        title: "Sucesso",
        description: "Mensagem enviada.",
      })
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

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast({
        title: "Status atualizado",
        description: `O ticket foi marcado como ${status}.`,
      })
      
      fetchTickets() // Refresh list
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null)
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Aberto</Badge>
      case 'in_progress': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Em Atendimento</Badge>
      case 'closed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Resolvido</Badge>
      case 'resolved': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Resolvido</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="flex items-center gap-1 text-red-500 text-xs font-bold uppercase"><AlertCircle className="w-3 h-3" /> Alta</span>
      case 'medium': return <span className="flex items-center gap-1 text-amber-500 text-xs font-bold uppercase"><Clock className="w-3 h-3" /> Média</span>
      case 'low': return <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> Baixa</span>
      case 'critical': return <span className="flex items-center gap-1 text-purple-600 text-xs font-bold uppercase"><AlertCircle className="w-3 h-3" /> Crítica</span>
      default: return <span>{priority}</span>
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Central de Suporte" />
      
      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Support Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-indigo-600 text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-100 uppercase tracking-widest">Tickets Abertos</p>
                <div className="text-3xl font-bold">14</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Média Resolução</p>
                <div className="text-3xl font-bold">4.2h</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">NPS Suporte</p>
                <div className="text-3xl font-bold">9.8</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por assunto, ID ou cliente..." 
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Filter className="w-4 h-4" /> Filtrar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="border-none shadow-sm bg-white dark:bg-slate-900 hover:ring-1 hover:ring-indigo-500 transition-all cursor-pointer">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{ticket.id}</span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {ticket.subject}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-1 italic">
                      "{ticket.lastMessage}"
                    </p>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-slate-100 dark:border-slate-800">
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold uppercase">
                          {(ticket.customer ?? ticket.user?.email ?? '?').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{ticket.customer ?? ticket.user?.email ?? '—'}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {typeof ticket.studio === 'object' ? ticket.studio?.name : ticket.studio ?? '—'}
                        </p>
                      </div>
                    </div>

                    <div className="hidden lg:block text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Criado em</p>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600" onClick={() => handleTicketClick(ticket)}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleTicketClick(ticket)}>
                            <Send className="w-4 h-4 mr-2" /> Responder Ticket
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600 cursor-pointer" onClick={() => updateTicketStatus(ticket.id, 'resolved')}>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como Resolvido
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-400">Nenhum outro ticket pendente</h3>
          <p className="text-sm text-slate-400">Bom trabalho! Todos os clientes foram atendidos.</p>
        </div>
      </div>

      <Sheet open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <SheetContent className="w-full sm:w-[540px] flex flex-col p-0" side="right">
          {selectedTicket && (
            <>
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <SheetHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                    <span className="text-xs font-mono text-slate-400">{selectedTicket.id}</span>
                  </div>
                  <SheetTitle className="text-xl">{selectedTicket.subject}</SheetTitle>
                  <SheetDescription>
                    Criado em {new Date(selectedTicket.created_at).toLocaleString('pt-BR')}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-slate-100 dark:border-slate-800">
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold uppercase">
                      {selectedTicket.user?.email?.substring(0, 2) || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedTicket.user?.email}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {typeof selectedTicket.studio === 'object' ? selectedTicket.studio?.name : selectedTicket.studio ?? 'Sem estúdio'}
                    </p>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="space-y-6">
                  {messages.map((msg) => {
                    const isMe = false // In admin view, we are not the user usually, but let's check properly if we had auth user info
                    // Ideally we compare msg.user_id with current admin id
                    // For now, let's assume if it's internal it's from admin/support
                    
                    return (
                      <div key={msg.id} className={`flex flex-col gap-2 ${msg.is_internal ? 'items-end' : 'items-start'}`}>
                         <div className={`flex items-center gap-2 ${msg.is_internal ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-bold text-slate-500">{msg.user?.email}</span>
                          <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleString('pt-BR')}</span>
                         </div>
                         <div className={`p-4 rounded-xl max-w-[85%] text-sm ${
                           msg.is_internal 
                             ? 'bg-indigo-600 text-white rounded-tr-none' 
                             : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-sm'
                         }`}>
                           {msg.message}
                         </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
                  <Textarea 
                    placeholder="Digite sua resposta..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                       {selectedTicket.status !== 'resolved' && (
                         <Button type="button" variant="outline" size="sm" onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}>
                           Resolver
                         </Button>
                       )}
                    </div>
                    <Button type="submit" disabled={isSending || !newMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                      {isSending ? 'Enviando...' : 'Enviar Resposta'}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
