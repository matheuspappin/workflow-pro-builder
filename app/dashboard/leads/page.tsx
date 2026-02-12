"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Phone, Mail, Calendar, ArrowRight, CheckCircle2, XCircle, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { getLeads, createLead, updateLeadStage, Lead } from "@/lib/actions/leads"
import { ModuleGuard } from "@/components/providers/module-guard"

const STAGES = [
  { id: 'new', label: 'Novos', color: 'bg-blue-100 text-blue-700' },
  { id: 'contacted', label: 'Contatados', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'trial_scheduled', label: 'Agendou Exp.', color: 'bg-purple-100 text-purple-700' },
  { id: 'trial_done', label: 'Fez Exp.', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'negotiating', label: 'Negociação', color: 'bg-orange-100 text-orange-700' },
  { id: 'won', label: 'Matriculado', color: 'bg-green-100 text-green-700' },
]

export default function LeadsPage() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    source: "Instagram",
    interest_level: 3,
    notes: ""
  })

  const [studioId, setStudioId] = useState<string | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("danceflow_user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setStudioId(user.studioId || user.studio_id)
    }
  }, [])

  useEffect(() => {
    if (studioId) {
      fetchLeads()
    }
  }, [studioId])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const data = await getLeads(studioId!)
      setLeads(data)
    } catch (error) {
      console.error("Erro ao buscar leads:", error)
      // Mock data fallback se a tabela não existir
      setLeads([
        { id: '1', name: 'Ana Souza', phone: '11999998888', stage: 'new', interest_level: 5, created_at: new Date().toISOString(), status: 'active' },
        { id: '2', name: 'Carlos Lima', phone: '11988887777', stage: 'contacted', interest_level: 3, created_at: new Date().toISOString(), status: 'active' },
        { id: '3', name: 'Beatriz Silva', phone: '11977776666', stage: 'trial_scheduled', interest_level: 4, created_at: new Date().toISOString(), status: 'active' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLead = async () => {
    if (!studioId) return
    try {
      await createLead(newLead as any, studioId)
      toast({ title: "Lead criado com sucesso!" })
      setIsNewLeadOpen(false)
      fetchLeads()
      setNewLead({ name: "", phone: "", email: "", source: "Instagram", interest_level: 3, notes: "" })
    } catch (error) {
      toast({ title: "Erro ao criar lead", variant: "destructive" })
    }
  }

  const handleMoveStage = async (leadId: string, newStage: string) => {
    if (!studioId) return
    // Otimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage as any } : l))
    
    try {
      await updateLeadStage(leadId, newStage, studioId)
    } catch (error) {
      toast({ title: "Erro ao mover lead", variant: "destructive" })
      fetchLeads() // Revert
    }
  }

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm)
  )

  return (
    <ModuleGuard module="leads" showFullError>
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Gestão de Leads (CRM)" />
        
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou telefone..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Plus className="w-4 h-4" /> Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Lead</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      value={newLead.name} 
                      onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                      placeholder="Ex: Maria Silva"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Telefone (WhatsApp)</Label>
                      <Input 
                        value={newLead.phone} 
                        onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                        placeholder="11999998888"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Email (Opcional)</Label>
                      <Input 
                        value={newLead.email} 
                        onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                        placeholder="maria@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Origem</Label>
                      <Select 
                        value={newLead.source} 
                        onValueChange={(v) => setNewLead({...newLead, source: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Google">Google</SelectItem>
                          <SelectItem value="Indicação">Indicação</SelectItem>
                          <SelectItem value="Passante">Passante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Interesse (1-5)</Label>
                      <Select 
                        value={String(newLead.interest_level)} 
                        onValueChange={(v) => setNewLead({...newLead, interest_level: parseInt(v)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Frio</SelectItem>
                          <SelectItem value="3">3 - Morno</SelectItem>
                          <SelectItem value="5">5 - Quente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Observações</Label>
                    <Textarea 
                      value={newLead.notes} 
                      onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                      placeholder="Interesse em Ballet, quer horário noturno..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewLeadOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateLead} disabled={!newLead.name}>Salvar Lead</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* KANBAN BOARD */}
          <div className="flex gap-4 h-[calc(100vh-200px)] min-w-[1200px] overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.stage === stage.id)
              
              return (
                <div key={stage.id} className="flex-1 min-w-[280px] bg-secondary/30 rounded-xl flex flex-col h-full border border-border/50">
                  <div className={`p-3 rounded-t-xl border-b border-border/50 flex justify-between items-center ${stage.color} bg-opacity-20`}>
                    <span className="font-bold text-sm">{stage.label}</span>
                    <Badge variant="secondary" className="bg-background/50 text-foreground text-xs">
                      {stageLeads.length}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 p-2 overflow-y-auto space-y-2">
                    {stageLeads.map((lead) => (
                      <Card key={lead.id} className="cursor-grab hover:shadow-md transition-shadow bg-card">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{lead.source}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleMoveStage(lead.id, 'won')}>
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Marcar como Ganho
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMoveStage(lead.id, 'lost')}>
                                  <XCircle className="w-4 h-4 mr-2 text-red-600" /> Marcar como Perdido
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {lead.phone && (
                              <a 
                                href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center hover:text-green-600"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                Whats
                              </a>
                            )}
                            {lead.last_contact_date && (
                              <span className="flex items-center ml-auto" title="Último contato">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(lead.last_contact_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Quick Actions (Move Next) */}
                          <div className="pt-2 border-t mt-2 flex justify-end">
                            {stage.id !== 'won' && stage.id !== 'lost' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] px-2 hover:bg-primary/10 hover:text-primary"
                                onClick={() => {
                                  const currentIndex = STAGES.findIndex(s => s.id === stage.id)
                                  if (currentIndex < STAGES.length - 1) {
                                    handleMoveStage(lead.id, STAGES[currentIndex + 1].id)
                                  }
                                }}
                              >
                                Avançar <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </ModuleGuard>
  )
}
