"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModuleGuard } from "@/components/providers/module-guard"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Building2,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Phone,
  Trophy,
  MoreVertical,
  RefreshCw,
  BarChart3,
  Calendar,
  ArrowUpRight,
  Globe,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getConsolidatedStats,
  createUnit,
  updateUnitStatus,
  getUnitLeaderboard,
  type ConsolidatedStats,
} from "@/lib/actions/multi-unit"

export default function MultiUnitPage() {
  const { toast } = useToast()
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<ConsolidatedStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isNewUnitOpen, setIsNewUnitOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [newUnit, setNewUnit] = useState({
    name: "",
    city: "",
    state: "",
    address: "",
    phone: "",
  })

  useEffect(() => {
    const userStr = localStorage.getItem("danceflow_user")
    if (userStr) {
      const user = JSON.parse(userStr)
      const sId = user.studio_id || user.studioId || user.studio?.id
      setStudioId(sId)
    }
  }, [])

  useEffect(() => {
    if (studioId) loadData()
  }, [studioId])

  const loadData = async () => {
    if (!studioId) return
    setRefreshing(true)
    try {
      const [consolidatedData, leaderboardData] = await Promise.all([
        getConsolidatedStats(studioId),
        getUnitLeaderboard(studioId),
      ])
      setStats(consolidatedData)
      setLeaderboard(leaderboardData)
    } catch (err: any) {
      toast({ title: "Erro ao carregar dados", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId) return
    if (!newUnit.name || !newUnit.city || !newUnit.state) {
      toast({ title: "Preencha nome, cidade e estado", variant: "destructive" })
      return
    }
    setIsCreating(true)
    try {
      await createUnit(studioId, newUnit)
      toast({ title: "Unidade criada!", description: `${newUnit.name} foi adicionada à sua rede.` })
      setIsNewUnitOpen(false)
      setNewUnit({ name: "", city: "", state: "", address: "", phone: "" })
      await loadData()
    } catch (err: any) {
      toast({ title: "Erro ao criar unidade", description: err.message, variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleStatus = async (unitId: string, currentStatus: string) => {
    if (!studioId) return
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    try {
      await updateUnitStatus(unitId, studioId, newStatus)
      toast({ title: `Unidade ${newStatus === "active" ? "ativada" : "desativada"}` })
      await loadData()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  if (loading) {
    return (
      <ModuleGuard module="multi_unit" showFullError>
        <div className="min-h-screen bg-background flex flex-col">
          <Header title="Gestão Multi-Unidade" />
          <div className="flex-1 p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </ModuleGuard>
    )
  }

  return (
    <ModuleGuard module="multi_unit" showFullError>
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Gestão Multi-Unidade">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setIsNewUnitOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Unidade
          </Button>
        </Header>

        <div className="flex-1 p-6 space-y-6">
          {/* KPIs consolidados */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-primary text-primary-foreground border-none">
              <CardContent className="p-5">
                <Globe className="w-5 h-5 opacity-60 mb-2" />
                <p className="text-3xl font-black">{stats?.total_units ?? 0}</p>
                <p className="text-xs opacity-80 mt-1">Unidades na Rede</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <Users className="w-5 h-5 text-blue-500 mb-2" />
                <p className="text-3xl font-black">{stats?.total_students ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Alunos/Clientes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <DollarSign className="w-5 h-5 text-green-500 mb-2" />
                <p className="text-2xl font-black text-green-600">
                  {formatCurrency(stats?.total_revenue_month ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Receita Este Mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <Calendar className="w-5 h-5 text-violet-500 mb-2" />
                <p className="text-3xl font-black">{stats?.total_classes_week ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Turmas Ativas</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <TrendingUp className="w-5 h-5 text-orange-500 mb-2" />
                <p className="text-3xl font-black">{stats?.total_leads ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Leads no Funil</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de unidades */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Suas Unidades
              </h2>

              {!stats?.units || stats.units.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center space-y-4">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30" />
                    <div>
                      <p className="font-bold">Nenhuma unidade vinculada ainda</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clique em &quot;Nova Unidade&quot; para adicionar uma filial à sua rede.
                      </p>
                    </div>
                    <Button onClick={() => setIsNewUnitOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" /> Criar Primeira Unidade
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {stats.units.map((unit) => (
                    <Card
                      key={unit.id}
                      className={`transition-all hover:shadow-md ${
                        unit.status !== "active" ? "opacity-60" : ""
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold truncate">{unit.name}</p>
                                <Badge
                                  variant={unit.status === "active" ? "default" : "secondary"}
                                  className="text-[10px] shrink-0"
                                >
                                  {unit.status === "active" ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Ativa
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <XCircle className="w-3 h-3" /> Inativa
                                    </span>
                                  )}
                                </Badge>
                              </div>
                              {(unit.city || unit.state) && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {[unit.city, unit.state].filter(Boolean).join(", ")}
                                </p>
                              )}
                              {unit.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {unit.phone}
                                </p>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(unit.id, unit.status)}
                              >
                                {unit.status === "active" ? "Desativar unidade" : "Ativar unidade"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Stats da unidade */}
                        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t">
                          <div className="text-center">
                            <p className="text-lg font-black text-blue-600">{unit.stats.students}</p>
                            <p className="text-[10px] text-muted-foreground">Alunos</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-black text-green-600">
                              {formatCurrency(unit.stats.revenue_month)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Receita/Mês</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-black text-violet-600">
                              {unit.stats.classes_week}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Turmas</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-black text-orange-600">{unit.stats.leads}</p>
                            <p className="text-[10px] text-muted-foreground">Leads</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Ranking / Leaderboard */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Ranking de Receita
              </h2>
              <Card>
                <CardContent className="p-0">
                  {leaderboard.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      Sem dados de ranking ainda
                    </div>
                  ) : (
                    <div className="divide-y">
                      {leaderboard.map((unit) => (
                        <div
                          key={unit.id}
                          className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                              unit.rank === 1
                                ? "bg-yellow-400 text-yellow-900"
                                : unit.rank === 2
                                ? "bg-slate-300 text-slate-700"
                                : unit.rank === 3
                                ? "bg-amber-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {unit.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{unit.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {unit.stats.students} alunos
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-green-600">
                              {formatCurrency(unit.stats.revenue_month)}
                            </p>
                            <div className="flex items-center gap-1 justify-end text-[10px] text-muted-foreground">
                              <ArrowUpRight className="w-3 h-3" />
                              {unit.stats.classes_week} turmas
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Insight consolidado */}
              {stats && stats.total_units > 1 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <BarChart3 className="w-4 h-4" /> Insight da Rede
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Média de{" "}
                      <span className="font-bold text-foreground">
                        {Math.round(stats.total_students / stats.total_units)} alunos
                      </span>{" "}
                      por unidade e{" "}
                      <span className="font-bold text-foreground">
                        {formatCurrency(stats.total_revenue_month / stats.total_units)}
                      </span>{" "}
                      de receita média mensal por filial.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nova Unidade */}
      <Dialog open={isNewUnitOpen} onOpenChange={setIsNewUnitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Nova Unidade / Filial
            </DialogTitle>
            <DialogDescription>
              Adicione uma nova unidade à sua rede. Ela herdará o plano e as configurações da
              unidade principal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUnit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome da Unidade *</Label>
              <Input
                placeholder="Ex: Unidade Centro, Filial Norte..."
                value={newUnit.name}
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input
                  placeholder="São Paulo"
                  value={newUnit.city}
                  onChange={(e) => setNewUnit({ ...newUnit, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Input
                  placeholder="SP"
                  maxLength={2}
                  value={newUnit.state}
                  onChange={(e) => setNewUnit({ ...newUnit, state: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                placeholder="Rua, número, bairro..."
                value={newUnit.address}
                onChange={(e) => setNewUnit({ ...newUnit, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="(11) 99999-9999"
                value={newUnit.phone}
                onChange={(e) => setNewUnit({ ...newUnit, phone: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewUnitOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-2">
                {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar Unidade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleGuard>
  )
}
