"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ShoppingCart, Search, Package, Wrench, Plus, Minus, Trash2,
  X, CheckCircle, Banknote, CreditCard, QrCode, FileText,
  ChevronRight, User, Building2, Loader2, Receipt, History,
  RotateCcw, Tag, Percent, Phone, TrendingUp, Clock, Bell,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CatalogItem {
  id: string
  name: string
  price: number
  category: string
  item_type: 'product' | 'service'
  unit?: string
  current_stock?: number
  is_default?: boolean
}

interface CartItem extends CatalogItem {
  quantity: number
  subtotal: number
  unit_price?: number
}

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
}

interface Sale {
  id: string
  tracking_code: string
  total_amount: number
  discount_amount: number
  change_amount: number
  payment_method: string
  items: CartItem[]
}

// ─── Hook: Studio ID ───────────────────────────────────────────────────────────

function useStudioId() {
  const [studioId, setStudioId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStudioId(session?.user?.user_metadata?.studio_id ?? null)
    })
  }, [])
  return studioId
}

// ─── Tela de Recibo ───────────────────────────────────────────────────────────

function ReciboDialog({
  sale,
  customer,
  onClose,
}: {
  sale: Sale
  customer: Customer | null
  onClose: () => void
}) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const payLabels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    boleto: 'Boleto',
    pagar_depois: 'Pagar depois',
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            Venda Concluída!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Código da venda */}
          <div className="text-center py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Código da Venda</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-wider">{sale.tracking_code}</p>
          </div>

          {/* Cliente */}
          {customer && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <User className="w-4 h-4" />
              <span>{customer.name}</span>
              {customer.phone && <span className="text-slate-400">· {customer.phone}</span>}
            </div>
          )}

          {/* Itens */}
          <div className="space-y-1.5">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totais */}
          <div className="space-y-1.5 text-sm">
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Desconto</span>
                <span className="font-bold">- {formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Forma de pagamento</span>
              <span className="font-bold">{payLabels[sale.payment_method] ?? sale.payment_method}</span>
            </div>
            {sale.change_amount > 0 && (
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Troco</span>
                <span>{formatCurrency(sale.change_amount)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <RotateCcw className="w-4 h-4 mr-2" />Nova Venda
            </Button>
            <Button variant="outline" className="flex-1">
              <Receipt className="w-4 h-4 mr-2" />Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Histórico de Vendas ──────────────────────────────────────────────────────

function HistoricoVendas({ studioId }: { studioId: string }) {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/fire-protection/pdv/historico?studioId=${studioId}`)
      .then((r) => r.json())
      .then((d) => { setSales(d.sales ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [studioId])

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

  const payIcons: Record<string, any> = {
    dinheiro: Banknote,
    pix: QrCode,
    cartao_credito: CreditCard,
    cartao_debito: CreditCard,
  }

  const totalHoje = sales
    .filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + (s.total_amount ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Resumo do dia */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-50 dark:bg-emerald-600/10 border-emerald-200 dark:border-emerald-600/30">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">Vendas Hoje</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalHoje)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-600/10 border-blue-200 dark:border-blue-600/30">
          <CardContent className="p-4">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Transações</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
              {sales.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString()).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Ticket Médio</p>
            <p className="text-2xl font-black text-slate-700 dark:text-slate-300">
              {sales.length > 0 ? formatCurrency(totalHoje / Math.max(1, sales.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString()).length)) : formatCurrency(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de vendas */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Carregando histórico...</span>
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <History className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm font-medium">Nenhuma venda realizada ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => {
            const PayIcon = payIcons[sale.payment_method] ?? Banknote
            return (
              <Card key={sale.id} className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-600/15 flex items-center justify-center">
                        <PayIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-600/10 px-2 py-0.5 rounded-md">
                            {sale.tracking_code}
                          </span>
                          {sale.customer && (
                            <span className="text-sm text-slate-600 dark:text-slate-400">{sale.customer.name}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(sale.created_at).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                          {sale.items?.length > 0 && ` · ${sale.items.length} ${sale.items.length === 1 ? 'item' : 'itens'}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 dark:text-white">{formatCurrency(sale.total_amount)}</p>
                      <Badge className={cn(
                        "text-[10px] border-0",
                        sale.payment_status === 'paid'
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400"
                      )}>
                        {sale.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Lembretes de Vendas ──────────────────────────────────────────────────────

function LembretesVendas({ studioId }: { studioId: string }) {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/fire-protection/reminders?studioId=${studioId}`)
      .then((r) => r.json())
      .then((d) => { setReminders(d.reminders ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [studioId])

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const pending = reminders.filter((r) => !r.sent_at)
  const sent = reminders.filter((r) => r.sent_at)
  const typeLabels: Record<string, string> = {
    payment_pending: 'Pagamento pendente',
    follow_up: 'Follow-up pós-venda',
    recarga_proxima: 'Próxima recarga',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          Lembretes de Vendas
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Lembretes de pagamento e follow-up enviados via WhatsApp
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Carregando lembretes...</span>
        </div>
      ) : reminders.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10">
          <CardContent className="py-16 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-slate-600 dark:text-slate-400">Nenhum lembrete agendado</p>
            <p className="text-sm text-slate-500 mt-1">
              Ao finalizar vendas com "Pagar depois" e cliente selecionado, você pode marcar para enviar lembrete em 1 dia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Agendados ({pending.length})
              </h3>
              <div className="space-y-2">
                {pending.map((r) => (
                  <Card key={r.id} className="bg-amber-50/50 dark:bg-amber-600/5 border-amber-200 dark:border-amber-600/20">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {(r as any).students?.name || 'Cliente'} · {(r as any).service_orders?.tracking_code || '—'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {typeLabels[r.reminder_type] || r.reminder_type} — Envio: {formatDate(r.scheduled_at)}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-400 border-0">
                        Agendado
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
          {sent.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Enviados ({sent.length})
              </h3>
              <div className="space-y-2">
                {sent.slice(0, 20).map((r) => (
                  <Card key={r.id} className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {(r as any).students?.name || 'Cliente'} · {(r as any).service_orders?.tracking_code || '—'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {typeLabels[r.reminder_type] || r.reminder_type} — Enviado em {formatDate(r.sent_at)}
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400 border-0">
                        Enviado
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Página Principal do PDV ──────────────────────────────────────────────────

export default function PDVPage() {
  const studioId = useStudioId()

  // Catálogo
  const [catalog, setCatalog] = useState<{ products: CatalogItem[]; services: CatalogItem[] }>({
    products: [], services: [],
  })
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogSearch, setCatalogSearch] = useState("")
  const [catalogTab, setCatalogTab] = useState<"produto" | "servico">("produto")

  // Carrinho
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<"valor" | "percent">("valor")
  const [payMethod, setPayMethod] = useState("")
  const [amountPaid, setAmountPaid] = useState("")

  // Cliente
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  // Estado da venda
  const [loadingSale, setLoadingSale] = useState(false)
  const [completedSale, setCompletedSale] = useState<(Sale & { customer?: Customer | null }) | null>(null)
  const [scheduleReminder, setScheduleReminder] = useState(false)

  // Buscar catálogo
  const fetchCatalog = useCallback(async () => {
    if (!studioId) return
    setCatalogLoading(true)
    try {
      const res = await fetch(`/api/fire-protection/catalog?studioId=${studioId}&search=${encodeURIComponent(catalogSearch)}`)
      const data = await res.json()
      setCatalog({ products: data.products ?? [], services: data.services ?? [] })
    } finally {
      setCatalogLoading(false)
    }
  }, [studioId, catalogSearch])

  useEffect(() => { fetchCatalog() }, [fetchCatalog])

  // Buscar clientes
  useEffect(() => {
    if (!studioId || customerSearch.length < 2) { setCustomers([]); return }
    fetch(`/api/fire-protection/customers?studioId=${studioId}`)
      .then((r) => r.json())
      .then((data: Customer[]) => {
        const filtered = (Array.isArray(data) ? data : []).filter((c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          (c.phone ?? '').includes(customerSearch)
        )
        setCustomers(filtered.slice(0, 6))
      })
  }, [studioId, customerSearch])

  // ── Carrinho: operações ───────────────────────────────────────────────────

  const addToCart = (item: CatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id && c.item_type === item.item_type)
      if (existing) {
        return prev.map((c) =>
          c.id === item.id && c.item_type === item.item_type
            ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * (c.unit_price ?? c.price) }
            : c
        )
      }
      return [...prev, { ...item, quantity: 1, subtotal: item.price, unit_price: item.price }]
    })
  }

  const updateQty = (id: string, type: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((c) => {
        if (c.id !== id || c.item_type !== type) return [c]
        const qty = c.quantity + delta
        if (qty <= 0) return []
        return [{ ...c, quantity: qty, subtotal: qty * (c.unit_price ?? c.price) }]
      })
    )
  }

  const updatePrice = (id: string, type: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.id === id && c.item_type === type
          ? { ...c, unit_price: newPrice, subtotal: c.quantity * newPrice }
          : c
      )
    )
  }

  const removeFromCart = (id: string, type: string) => {
    setCart((prev) => prev.filter((c) => !(c.id === id && c.item_type === type)))
  }

  // ── Totais ────────────────────────────────────────────────────────────────

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const discountValue = discountType === "percent" ? (subtotal * discount) / 100 : discount
  const total = Math.max(0, subtotal - discountValue)
  const troco = Math.max(0, (Number(amountPaid) || 0) - total)

  // ── Finalizar venda ───────────────────────────────────────────────────────

  const handleFinalizar = async () => {
    if (!studioId || !cart.length || !payMethod) return
    setLoadingSale(true)
    try {
      const isPending = payMethod === 'pagar_depois'
      const res = await fetch('/api/fire-protection/pdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studio_id: studioId,
          customer_id: selectedCustomer?.id ?? null,
          items: cart.map((i) => ({
            id: i.id,
            name: i.name,
            item_type: i.item_type,
            quantity: i.quantity,
            unit_price: i.unit_price ?? i.price,
            is_default: i.is_default ?? false,
          })),
          payment_method: payMethod,
          amount_paid: isPending ? 0 : (Number(amountPaid) || total),
          discount_amount: discountValue,
          schedule_reminder: (isPending && selectedCustomer?.phone && scheduleReminder)
            ? { type: 'payment_pending', days: 1 }
            : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCompletedSale({
          ...data,
          items: cart,
          customer: selectedCustomer,
          payment_method: data.payment_method || (payMethod === 'pagar_depois' ? 'pagar_depois' : payMethod),
        })
        setCart([])
        setDiscount(0)
        setPayMethod("")
        setAmountPaid("")
        setSelectedCustomer(null)
        setCustomerSearch("")
        setScheduleReminder(false)
      }
    } finally {
      setLoadingSale(false)
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const paymentMethods = [
    { key: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-600/10' },
    { key: 'pix', label: 'Pix', icon: QrCode, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
    { key: 'cartao_debito', label: 'Débito', icon: CreditCard, color: 'text-purple-600 bg-purple-50 dark:bg-purple-600/10' },
    { key: 'cartao_credito', label: 'Crédito', icon: CreditCard, color: 'text-orange-600 bg-orange-50 dark:bg-orange-600/10' },
    { key: 'boleto', label: 'Boleto', icon: FileText, color: 'text-slate-600 bg-slate-50 dark:bg-slate-700/50' },
    { key: 'pagar_depois', label: 'Pagar depois', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-600/10' },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-red-600" />
            PDV — Ponto de Venda
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Venda rápida de produtos e serviços contra incêndio
          </p>
        </div>
      </div>

      <Tabs defaultValue="pdv" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pdv" className="flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4" />Caixa
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-1.5">
            <History className="w-4 h-4" />Histórico
          </TabsTrigger>
          <TabsTrigger value="lembretes" className="flex items-center gap-1.5">
            <Bell className="w-4 h-4" />Lembretes
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Caixa ─────────────────────────────────────────────────── */}
        <TabsContent value="pdv">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">

            {/* Coluna esquerda: Catálogo ─────────────────────────────────── */}
            <div className="space-y-4">

              {/* Busca de cliente */}
              <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <Label className="text-sm font-bold">Cliente</Label>
                    {selectedCustomer && (
                      <button onClick={() => { setSelectedCustomer(null); setCustomerSearch("") }}
                        className="ml-auto text-slate-400 hover:text-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {selectedCustomer ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-600/10 border border-emerald-200 dark:border-emerald-600/30">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {selectedCustomer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{selectedCustomer.name}</p>
                        {selectedCustomer.phone && (
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{selectedCustomer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Buscar cliente por nome ou telefone..."
                        className="pl-9"
                        value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true) }}
                        onFocus={() => setShowCustomerDropdown(true)}
                      />
                      {showCustomerDropdown && customers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                          {customers.map((c) => (
                            <button
                              key={c.id}
                              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors"
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setShowCustomerDropdown(false) }}
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm flex-shrink-0">
                                {c.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
                                {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Catálogo */}
              <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10">
                <CardContent className="p-4">
                  {/* Busca do catálogo */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar produto ou serviço..."
                      className="pl-9"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                    />
                  </div>

                  {/* Tabs produtos / serviços */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setCatalogTab("produto")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                        catalogTab === "produto"
                          ? "bg-red-600 text-white"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                    >
                      <Package className="w-3.5 h-3.5" />
                      Produtos ({catalog.products.length})
                    </button>
                    <button
                      onClick={() => setCatalogTab("servico")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                        catalogTab === "servico"
                          ? "bg-red-600 text-white"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Serviços ({catalog.services.length})
                    </button>
                  </div>

                  {catalogLoading ? (
                    <div className="flex items-center justify-center py-10 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span className="text-sm">Carregando catálogo...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[460px] overflow-y-auto pr-1">
                      {(catalogTab === "produto" ? catalog.products : catalog.services).map((item) => (
                        <button
                          key={`${item.item_type}-${item.id}`}
                          onClick={() => addToCart(item)}
                          className="group flex flex-col gap-1 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 hover:border-red-300 dark:hover:border-red-600/50 hover:shadow-md transition-all text-left"
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center mb-1",
                            catalogTab === "produto"
                              ? "bg-blue-100 dark:bg-blue-600/15"
                              : "bg-orange-100 dark:bg-orange-600/15"
                          )}>
                            {catalogTab === "produto"
                              ? <Package className="w-4 h-4 text-blue-600" />
                              : <Wrench className="w-4 h-4 text-orange-600" />
                            }
                          </div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight line-clamp-2">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400">{item.category}</p>
                          <p className="text-sm font-black text-red-600 mt-auto">
                            {formatCurrency(item.price)}
                          </p>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                            <div className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-white bg-red-600 rounded-lg py-1">
                              <Plus className="w-3 h-3" />Adicionar
                            </div>
                          </div>
                        </button>
                      ))}
                      {(catalogTab === "produto" ? catalog.products : catalog.services).length === 0 && (
                        <div className="col-span-3 text-center py-8 text-slate-400">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Nenhum item encontrado</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna direita: Carrinho ───────────────────────────────────── */}
            <div className="space-y-4">
              <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-red-600" />
                      Carrinho
                    </span>
                    {cart.length > 0 && (
                      <Badge className="bg-red-600 text-white border-0 text-xs">
                        {cart.reduce((s, i) => s + i.quantity, 0)} itens
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Itens do carrinho */}
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-medium">Carrinho vazio</p>
                      <p className="text-xs mt-1">Clique nos itens do catálogo para adicionar</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={`${item.item_type}-${item.id}`}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                            item.item_type === 'product' ? "bg-blue-100 dark:bg-blue-600/15" : "bg-orange-100 dark:bg-orange-600/15"
                          )}>
                            {item.item_type === 'product'
                              ? <Package className="w-3.5 h-3.5 text-blue-600" />
                              : <Wrench className="w-3.5 h-3.5 text-orange-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-slate-400">R$</span>
                              <input
                                type="number"
                                className="text-xs font-bold text-slate-700 dark:text-slate-300 w-14 bg-transparent border-b border-dashed border-slate-300 dark:border-white/20 focus:outline-none focus:border-red-400"
                                value={item.unit_price ?? item.price}
                                min={0}
                                step={0.01}
                                onChange={(e) => updatePrice(item.id, item.item_type, Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQty(item.id, item.item_type, -1)}
                              className="w-6 h-6 rounded-md bg-slate-200 dark:bg-white/10 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-600/20 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-black text-slate-900 dark:text-white w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, item.item_type, 1)}
                              className="w-6 h-6 rounded-md bg-slate-200 dark:bg-white/10 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-600/20 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right min-w-[52px]">
                            <p className="text-xs font-black text-slate-900 dark:text-white">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.item_type)}
                            className="text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <>
                      <Separator />

                      {/* Desconto */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />Desconto
                        </Label>
                        <div className="flex gap-2">
                          <div className="flex rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden text-xs">
                            <button
                              onClick={() => setDiscountType("valor")}
                              className={cn(
                                "px-2.5 py-1.5 font-bold transition-colors",
                                discountType === "valor"
                                  ? "bg-red-600 text-white"
                                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                              )}
                            >R$</button>
                            <button
                              onClick={() => setDiscountType("percent")}
                              className={cn(
                                "px-2.5 py-1.5 font-bold transition-colors",
                                discountType === "percent"
                                  ? "bg-red-600 text-white"
                                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                              )}
                            >%</button>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={discountType === "percent" ? 100 : undefined}
                            step={0.01}
                            placeholder={discountType === "valor" ? "0,00" : "0"}
                            value={discount || ""}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        {discountValue > 0 && (
                          <p className="text-xs text-emerald-600 font-bold">
                            Desconto: - {formatCurrency(discountValue)}
                          </p>
                        )}
                      </div>

                      {/* Totais */}
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discountValue > 0 && (
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>Desconto</span>
                            <span>- {formatCurrency(discountValue)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                          <span>Total</span>
                          <span className="text-red-600">{formatCurrency(total)}</span>
                        </div>
                      </div>

                      {/* Formas de pagamento */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Forma de Pagamento
                        </Label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {paymentMethods.map((pm) => (
                            <button
                              key={pm.key}
                              onClick={() => setPayMethod(pm.key)}
                              className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-bold transition-all",
                                payMethod === pm.key
                                  ? "border-red-600 bg-red-50 dark:bg-red-600/10 text-red-700 dark:text-red-400"
                                  : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300"
                              )}
                            >
                              <pm.icon className="w-4 h-4" />
                              {pm.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lembrete de pagamento (quando Pagar depois + cliente com telefone) */}
                      {payMethod === "pagar_depois" && selectedCustomer?.phone && (
                        <label className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-600/10 border border-amber-200 dark:border-amber-600/30 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={scheduleReminder}
                            onChange={(e) => setScheduleReminder(e.target.checked)}
                            className="rounded border-amber-400"
                          />
                          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Enviar lembrete de pagamento em 1 dia (WhatsApp)
                          </span>
                        </label>
                      )}

                      {/* Valor pago (para calcular troco no dinheiro) - ocultar quando Pagar depois */}
                      {payMethod === "dinheiro" && (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            Valor recebido
                          </Label>
                          <Input
                            type="number"
                            min={total}
                            step={0.01}
                            placeholder={formatCurrency(total)}
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className="text-base font-bold"
                          />
                          {troco > 0 && (
                            <p className="text-sm font-black text-amber-600 flex items-center gap-1">
                              <Banknote className="w-4 h-4" />
                              Troco: {formatCurrency(troco)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Botão finalizar */}
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base py-6 rounded-xl shadow-lg shadow-emerald-600/20"
                        onClick={handleFinalizar}
                        disabled={!payMethod || loadingSale || cart.length === 0}
                      >
                        {loadingSale ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        )}
                        Finalizar Venda · {formatCurrency(total)}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Histórico ──────────────────────────────────────────────── */}
        <TabsContent value="historico">
          {studioId && <HistoricoVendas studioId={studioId} />}
        </TabsContent>

        {/* ── Tab: Lembretes ───────────────────────────────────────────────── */}
        <TabsContent value="lembretes">
          {studioId && <LembretesVendas studioId={studioId} />}
        </TabsContent>
      </Tabs>

      {/* Recibo pós-venda */}
      {completedSale && (
        <ReciboDialog
          sale={completedSale}
          customer={completedSale.customer ?? null}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  )
}
