"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  ExternalLink
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

const mockTickets = [
  { 
    id: "TCK-482", 
    subject: "Dúvida sobre integração Gemini", 
    customer: "Ana Paula", 
    studio: "Estúdio Matriz", 
    priority: "high", 
    status: "open", 
    createdAt: "2026-01-23T10:00:00Z",
    lastMessage: "Não estou conseguindo ativar a chave do Gemini..."
  },
  { 
    id: "TCK-481", 
    subject: "Erro no processamento de boleto", 
    customer: "Carlos Silva", 
    studio: "Dance Flow SP", 
    priority: "medium", 
    status: "in_progress", 
    createdAt: "2026-01-22T15:30:00Z",
    lastMessage: "O aluno pagou mas ainda aparece como pendente."
  },
  { 
    id: "TCK-480", 
    subject: "Sugestão de funcionalidade: Mobile App", 
    customer: "Ricardo Lima", 
    studio: "Studio Movimento", 
    priority: "low", 
    status: "closed", 
    createdAt: "2026-01-20T09:15:00Z",
    lastMessage: "Seria incrível ter um app para os alunos."
  }
]

export default function AdminSupportPage() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState(mockTickets)
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Aberto</Badge>
      case 'in_progress': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Em Atendimento</Badge>
      case 'closed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Resolvido</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="flex items-center gap-1 text-red-500 text-xs font-bold uppercase"><AlertCircle className="w-3 h-3" /> Alta</span>
      case 'medium': return <span className="flex items-center gap-1 text-amber-500 text-xs font-bold uppercase"><Clock className="w-3 h-3" /> Média</span>
      case 'low': return <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> Baixa</span>
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
                          {ticket.customer.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{ticket.customer}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {ticket.studio}
                        </p>
                      </div>
                    </div>

                    <div className="hidden lg:block text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Criado em</p>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem className="cursor-pointer">
                            <Send className="w-4 h-4 mr-2" /> Responder Ticket
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <User className="w-4 h-4 mr-2" /> Atribuir a Mim
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600 cursor-pointer">
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
    </div>
  )
}
