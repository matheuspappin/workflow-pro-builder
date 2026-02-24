"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  UserCheck, Search, Building2, Phone, Mail, ClipboardList,
  ShoppingCart, TrendingUp, CheckCircle, Clock, XCircle,
  Wrench, ChevronRight, Loader2, Plus, AlertCircle, RefreshCw,
  DollarSign, Calendar,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  status: string
  enrollment_date: string
}

interface OS {
  id: string
  tracking_code: string
  title: string
  status: string
  priority: string
  scheduled_at?: string
  total_amount?: number
  payment_status?: string
  created_at: string
}

interface CustomerDetail extends Customer {
  os: OS[]
  vendas: OS[]
  totalGasto: number
  osAbertas: number
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

const osStatusMap: Record<string, { label: string; className: string; icon: any }> = {
  open:         { label: "Aberta",       className: "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400",     icon: Clock },
  in_progress:  { label: "Em Andamento", className: "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400",         icon: Wrench },
  finished:     { label: "Concluída",    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400", icon: CheckCircle },
  cancelled:    { label: "Cancelada",    className: "bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400",      icon: XCircle },
  waiting_parts:{ label: "Aguard. Peças",className: "bg-purple-100 text-purple-700 dark:bg-purple-600/20 dark:text-purple-400",  icon: Clock },
}

// ─── Hook: Studio ID + Seller ─────────────────────────────────────────────────

function useSession() {
  const [studioId, setStudioId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStudioId(session?.user?.user_metadata?.studio_id ?? null)
      setUserId(session?.user?.id ?? null)
    })
  }, [])
  return { studioId, userId }
}

// ─── Dialog: Detalhes do Cliente ──────────────────────────────────────────────

function ClienteDetailDialog({
  customer,
  studioId,
  onClose,
}: {
  customer: Customer
  studioId: string
  onClose: () => void
}) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/fire-protection/os?studioId=${studioId}`).then((r) => r.json()),
      fetch(`/api/fire-protection/pdv/historico?studioId=${studioId}&limit=100`).then((r) => r.json()),
    ]).then(([osData, vendaData]) => {
      const osList: OS[] = (Array.isArray(osData) ? osData : []).filter((o: any) => o.customer_id === customer.id)
      const vendas: OS[] = ((vendaData.sales ?? []) as OS[]).filter((v: any) => v.customer_id === customer.id)
      const totalGasto = vendas.reduce((s, v) => s + (v.total_amount ?? 0), 0)
      const osAbertas = osList.filter((o) => o.status === 'open' || o.status === 'in_progress').length
      setDetail({ ...customer, os: osList, vendas, totalGasto, osAbertas })
      setLoading(false)
    })
  }, [customer, studioId])

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR')
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-600" />
            {customer.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            {/* Info do cliente */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'OS Abertas', value: detail.osAbertas, icon: ClipboardList, color: detail.osAbertas > 0 ? 'text-amber-600' : 'text-slate-400', bg: detail.osAbertas > 0 ? 'bg-amber-50 dark:bg-amber-600/10' : 'bg-slate-50 dark:bg-slate-800/50' },
                { label: 'Total Comprado', value: formatCurrency(detail.totalGasto), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-600/10' },
                { label: 'Total OS', value: detail.os.length, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-600/10' },
                { label: 'Compras PDV', value: detail.vendas.length, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-600/10' },
              ].map((stat) => (
                <div key={stat.label} className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4 mb-1", stat.color)} />
                  <p className={cn("text-xl font-black", stat.color)}>{stat.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Contato */}
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {customer.phone && (
                <p className="flex items-center gap-2"><Phone className="w-4 h-4" />{customer.phone}</p>
              )}
              {customer.email && (
                <p className="flex items-center gap-2"><Mail className="w-4 h-4" />{customer.email}</p>
              )}
              {customer.address && (
                <p className="flex items-center gap-2"><Building2 className="w-4 h-4" />{customer.address}</p>
              )}
            </div>

            {/* OS recentes */}
            {detail.os.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Ordens de Serviço</p>
                <div className="space-y-2">
                  {detail.os.slice(0, 5).map((os) => {
                    const st = osStatusMap[os.status] ?? osStatusMap.open
                    return (
                      <div key={os.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-red-600">{os.tracking_code}</span>
                            <Badge className={cn("text-[10px] font-bold border-0", st.className)}>{st.label}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{os.title}</p>
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(os.scheduled_at ?? os.created_at)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Botão PDV */}
            <Link href={`/solutions/fire-protection/dashboard/vendas`}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Abrir PDV para este cliente
              </Button>
            </Link>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function PortalVendedorPage() {
  const { studioId } = useSession()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Stats
  const [stats, setStats] = useState({
    totalClientes: 0,
    osAbertas: 0,
    vendasHoje: 0,
    receitaTotal: 0,
  })

  const fetchData = useCallback(async () => {
    if (!studioId) return
    setLoading(true)
    try {
      const [customersRes, osRes, vendaRes] = await Promise.all([
        fetch(`/api/fire-protection/customers?studioId=${studioId}`).then((r) => r.json()),
        fetch(`/api/fire-protection/os?studioId=${studioId}`).then((r) => r.json()),
        fetch(`/api/fire-protection/pdv/historico?studioId=${studioId}&limit=200`).then((r) => r.json()),
      ])

      const cl: Customer[] = Array.isArray(customersRes) ? customersRes : []
      const os: OS[] = Array.isArray(osRes) ? osRes : []
      const vendas: OS[] = vendaRes.sales ?? []

      setCustomers(cl)

      const hoje = new Date().toDateString()
      setStats({
        totalClientes: cl.length,
        osAbertas: os.filter((o) => o.status === 'open' || o.status === 'in_progress').length,
        vendasHoje: vendas.filter((v) => new Date(v.created_at).toDateString() === hoje).length,
        receitaTotal: vendas.reduce((s, v) => s + (v.total_amount ?? 0), 0),
      })
    } finally {
      setLoading(false)
    }
  }, [studioId])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-red-600" />
            Portal do Vendedor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Seus clientes, ordens de serviço e vendas em um único lugar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Link href="/solutions/fire-protection/dashboard/vendas">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20">
              <ShoppingCart className="w-4 h-4 mr-2" />Abrir PDV
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Clientes Ativos', value: stats.totalClientes, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { label: 'OS em Aberto', value: stats.osAbertas, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          { label: 'Vendas Hoje', value: stats.vendasHoje, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: 'Receita Total', value: formatCurrency(stats.receitaTotal), icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-500/10' },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-sm">
            <CardContent className="p-4">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            href: "/solutions/fire-protection/dashboard/vendas",
            icon: ShoppingCart,
            label: "Nova Venda (PDV)",
            desc: "Cobra produto ou serviço na hora",
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-600/10 border-emerald-200 dark:border-emerald-600/30",
          },
          {
            href: "/solutions/fire-protection/dashboard/os",
            icon: ClipboardList,
            label: "Nova Ordem de Serviço",
            desc: "Registra serviço programado",
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-600/10 border-blue-200 dark:border-blue-600/30",
          },
          {
            href: "/solutions/fire-protection/dashboard/vistorias",
            icon: Calendar,
            label: "Agendar Vistoria",
            desc: "Agenda vistoria técnica",
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-600/10 border-red-200 dark:border-red-600/30",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all",
              item.bg
            )}>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900/50 flex items-center justify-center shadow-sm">
                <item.icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div>
                <p className={cn("text-sm font-black", item.color)}>{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <ChevronRight className={cn("w-4 h-4 ml-auto", item.color)} />
            </div>
          </Link>
        ))}
      </div>

      {/* Lista de clientes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-600" />
            Meus Clientes
          </h2>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar cliente por nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Carregando clientes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">
              {customers.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
            </p>
            {customers.length === 0 && (
              <p className="text-sm mt-1">Adicione clientes na seção "Clientes / Edificações"</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((customer) => (
              <Card
                key={customer.id}
                className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-600/15 flex items-center justify-center text-red-600 font-black text-lg flex-shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{customer.phone}
                        </p>
                      )}
                      {customer.address && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{customer.address}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-white/20 flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = '/solutions/fire-protection/dashboard/vendas'
                      }}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-600/20 transition-colors"
                    >
                      <ShoppingCart className="w-3 h-3" />PDV
                    </button>
                    <Link
                      href="/solutions/fire-protection/dashboard/os"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 rounded-lg bg-blue-50 dark:bg-blue-600/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/20 transition-colors"
                    >
                      <ClipboardList className="w-3 h-3" />OS
                    </Link>
                    <Link
                      href="/solutions/fire-protection/dashboard/vistorias"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 rounded-lg bg-red-50 dark:bg-red-600/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-600/20 transition-colors"
                    >
                      <Calendar className="w-3 h-3" />Vistoria
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de detalhes do cliente */}
      {selectedCustomer && studioId && (
        <ClienteDetailDialog
          customer={selectedCustomer}
          studioId={studioId}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  )
}
