"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Search,
  Plus,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Settings2,
  Trash2,
  CheckSquare
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { checkPasswordStrength, MIN_STRONG_PASSWORD_SCORE } from "@/lib/password-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [studios, setStudios] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Estados de Seleção Múltipla
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    studioId: ""
  })

  useEffect(() => {
    loadUsers()
    loadStudios()
  }, [])

  const loadStudios = async () => {
    try {
      const res = await fetch('/api/admin/studios')
      if (res.ok) {
        const data = await res.json()
        setStudios(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estúdios:', error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUser.name || !newUser.email || !newUser.password || (newUser.role !== 'super_admin' && !newUser.studioId)) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      })
      return
    }

    // Validar força da senha
    const strength = checkPasswordStrength(newUser.password)
    if (strength.score < MIN_STRONG_PASSWORD_SCORE) {
      toast({
        title: "Senha Fraca",
        description: "A senha deve ser forte para garantir a segurança da plataforma.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Novo usuário criado com sucesso.",
        })
        setIsDialogOpen(false)
        setNewUser({ name: "", email: "", password: "", role: "admin", studioId: "" })
        loadUsers()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Falha ao criar usuário')
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        throw new Error('Falha ao carregar usuários')
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários reais.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.studio.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || u.role === filterRole
    return matchesSearch && matchesRole
  })

  // Funções de Seleção
  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    )
  }

  const handleBulkAction = async (action: string) => {
    toast({
      title: "Ação em massa",
      description: `Executando "${action}" para ${selectedUsers.length} usuários.`,
    })
    // Implementação futura das APIs de bulk
  }

  const exportToCSV = () => {
    try {
      const headers = ["Nome", "Email", "Telefone", "Nível", "Estúdio", "Status", "Último Acesso"]
      const rows = filteredUsers.map(u => [
        u.name,
        u.email,
        u.phone,
        u.role,
        u.studio,
        u.status,
        new Date(u.lastLogin).toLocaleString('pt-BR')
      ])

      const csvContent = [
        headers.join(","),
        ...rows.map(e => e.join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `usuarios_danceflow_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Exportação concluída",
        description: "A lista de usuários foi baixada com sucesso."
      })
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o arquivo CSV.",
        variant: "destructive"
      })
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1"><Shield className="w-3 h-3" /> Super Admin</Badge>
      case 'owner':
        return <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 gap-1"><Building2 className="w-3 h-3" /> Proprietário</Badge>
      case 'admin':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">Administrador</Badge>
      case 'manager':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1">Gerente</Badge>
      case 'teacher':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">Profissional</Badge>
      case 'receptionist':
        return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 gap-1">Recepcionista</Badge>
      case 'student':
        return <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20 gap-1">Cliente</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title="Usuários Globais" />
      
      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Buscar por nome, email ou estúdio..." 
                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 border-indigo-200 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900">
                      <Settings2 className="w-4 h-4" />
                      Ações em Massa ({selectedUsers.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => handleBulkAction('ativar')} className="cursor-pointer">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Ativar Selecionados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('desativar')} className="cursor-pointer">
                      <XCircle className="w-4 h-4 mr-2 text-amber-500" /> Desativar Selecionados
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('deletar')} className="text-red-600 focus:text-red-600 cursor-pointer">
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir Permanentemente
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" onClick={exportToCSV}>
              <Download className="w-4 h-4" /> Exportar
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <Filter className="w-4 h-4" /> 
                  {filterRole === 'all' ? 'Filtrar' : 
                   filterRole === 'super_admin' ? 'Super Admin' :
                   filterRole === 'owner' ? 'Proprietário' :
                   filterRole === 'admin' ? 'Administrador' :
                   filterRole === 'manager' ? 'Gerente' :
                   filterRole === 'teacher' ? 'Profissional' :
                   filterRole === 'receptionist' ? 'Recepcionista' : 'Cliente'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setFilterRole('all')}>Todos os Níveis</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole('super_admin')}>Super Admin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole('owner')}>Proprietário</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole('admin')}>Administrador</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole('manager')}>Gerente</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole('teacher')}>Profissional</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole('receptionist')}>Recepcionista</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole('student')}>Cliente</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
          </div>
        </div>

        {/* Dialog Novo Usuário */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Criar Novo Usuário Global
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Adicione um novo administrador ou proprietário vinculado a um estúdio específico.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className="space-y-5 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name"
                    placeholder="Ex: Rodrigo Oliveira"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-800 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail de Acesso</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-800 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha Temporária</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 caracteres + símbolo + maiúscula"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800 border-none pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={newUser.password} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Nível de Acesso</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(val) => {
                        const updatedUser = { ...newUser, role: val };
                        // Se for super_admin, limpa o estúdio
                        if (val === 'super_admin') {
                          updatedUser.studioId = '';
                        }
                        setNewUser(updatedUser);
                      }}
                    >
                      <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-none">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin (Global)</SelectItem>
                        <SelectItem value="owner">Proprietário (Admin Master)</SelectItem>
                        <SelectItem value="admin">Administrador (Admin)</SelectItem>
                        <SelectItem value="manager">Gerente (Staff)</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="receptionist">Recepcionista</SelectItem>
                        <SelectItem value="student">Cliente (Apenas Visualização)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studio">Vincular ao Estúdio</Label>
                    <Select 
                      value={newUser.studioId} 
                      onValueChange={(val) => setNewUser({...newUser, studioId: val})}
                      disabled={newUser.role === 'super_admin'}
                    >
                      <SelectTrigger className={cn(
                        "bg-slate-50 dark:bg-slate-800 border-none",
                        newUser.role === 'super_admin' && "opacity-50"
                      )}>
                        <SelectValue placeholder={newUser.role === 'super_admin' ? "Global (Nenhum)" : "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        {studios.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2 px-8"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isSubmitting ? "Criando..." : "Criar Usuário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Todos os Usuários da Plataforma</CardTitle>
              <Badge variant="secondary">{filteredUsers.length} usuários</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-[50px] pl-6">
                    <Checkbox 
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Estúdio Vinculado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-400">Carregando usuários...</TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-400">Nenhum usuário encontrado.</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className={cn(
                        "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                        selectedUsers.includes(user.id) && "bg-indigo-50/50 dark:bg-indigo-900/10"
                      )}
                    >
                      <TableCell className="pl-6">
                        <Checkbox 
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                          aria-label={`Selecionar ${user.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-slate-200 dark:border-slate-700">
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {user.phone}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{user.studio}</span>
                      </TableCell>
                      <TableCell>
                        {user.status === 'active' ? (
                          <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-wider">
                            <XCircle className="w-3.5 h-3.5" /> Inativo
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(user.lastLogin).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem className="cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" /> Alterar Permissões
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Mail className="w-4 h-4 mr-2" /> Enviar Mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                              <XCircle className="w-4 h-4 mr-2" /> Desativar Conta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
