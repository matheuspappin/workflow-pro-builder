"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Globe, 
  ShoppingCart, 
  Truck, 
  BarChart3, 
  Database, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  ShieldCheck,
  Plus,
  RefreshCw,
  FileText,
  Users2,
  Box,
  Receipt,
  Sparkles,
  AlertCircle,
  Lock,
  Trash2,
  Upload
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ModuleGuard } from "@/components/providers/module-guard"
import { useVocabulary } from "@/hooks/use-vocabulary"

import { 
  getChannels, 
  connectChannel, 
  getERPOrders, 
  createERPOrder,
  getERPCatalog,
  getOrganizationSettings,
  getStudioPlan,
  getERPDashboardStats,
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  updateOrderShipping,
  getInvoices,
  getPendingInvoices,
  emitInvoicesBatch,
  downloadInvoicePDF,
  type IntegrationChannel,
  type ERPOrder,
  type OrganizationSettings as OrgSettings,
  type Supplier,
  type PurchaseOrder
} from "@/lib/actions/erp"
import { createProduct, deleteProduct } from "@/lib/actions/inventory"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ERPPage() {
  const { vocabulary } = useVocabulary()
  const { toast } = useToast()
  const [userPlan, setUserPlan] = useState<string>("free")
  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState<IntegrationChannel[]>([])
  const [erpOrders, setErpOrders] = useState<ERPOrder[]>([])
  const [catalog, setCatalog] = useState<any[]>([])
  const [settings, setSettings] = useState<OrgSettings | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  // --- UI States ---
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false)
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("channels")
  const [studioId, setStudioId] = useState<string | null>(null)
  
  // --- Dashboard Stats ---
  const [stats, setStats] = useState({
    revenue: { total: 0, growth: 0 },
    orders: { pending: 0, waiting_collection: 0 },
    logistics: { active: 0, on_time_percentage: 0 },
    channels: { active: 0, total: 0 }
  })

  // --- Form States ---
  const [newChannel, setNewChannel] = useState({ platform: '', name: '', apiKey: '' })
  const [newOrder, setNewOrder] = useState({ customer: '', product_id: '', qty: 1 })
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, stock: 0, sku: '', image_url: '' })
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_name: '', email: '', category: 'products' })
  const [newPO, setNewPO] = useState({ supplier_id: '', total_amount: 0, items: [] as any[], expected_date: '' })

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem("danceflow_user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          console.log("User object from localStorage:", user)
          // Super Admin sempre tem acesso Enterprise total
          const isSuperAdmin = user.role === 'super_admin'
          
          // Pegamos o plano inicial do localStorage (pode estar cacheado/antigo)
          let currentPlan = isSuperAdmin ? "enterprise" : (user.plan || user.plan_name || user.studio?.plan || "gratuito")
          const sId = user.studio_id || user.studioId || user.studio?.id // Prioriza studio_id
          console.log("Studio ID extraído:", sId)
          
          setStudioId(sId)

          if (sId) {
             const [chData, ordData, catData, settsData, dbPlan, dashboardStats, suppliersData, poData, invoicesData, pendingData] = await Promise.all([
               getChannels(sId),
               getERPOrders(sId),
               getERPCatalog(sId),
               getOrganizationSettings(sId),
               !isSuperAdmin ? getStudioPlan(sId) : Promise.resolve("enterprise"),
               getERPDashboardStats(sId),
               getSuppliers(sId),
               getPurchaseOrders(sId),
               getInvoices(sId),
               getPendingInvoices(sId)
             ])
             
             setChannels(chData || [])
             setErpOrders(ordData || [])
             setCatalog(catData || [])
             setSettings(settsData)
             setSuppliers(suppliersData || [])
             setPurchaseOrders(poData || [])
             setInvoices(invoicesData || [])
             setPendingInvoices(pendingData || [])
             if (dashboardStats) setStats(dashboardStats)
             
             // A palavra final sobre o plano vem sempre do banco de dados (Real-time Sync)
             if (dbPlan) {
               currentPlan = dbPlan.toLowerCase()
             }
          }
          
          setUserPlan(currentPlan)
          console.log("User plan do ERP (final):", currentPlan)
          console.log("LocalStorage (danceflow_user):", localStorage.getItem("danceflow_user"))

        } catch (e) {
          console.error("Erro ao carregar dados do ERP:", e)
          setUserPlan("gratuito")
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId) {
      toast({ title: "Erro", description: `ID do ${vocabulary.establishment.toLowerCase()} não encontrado.`, variant: "destructive" })
      return
    }

    // Validação básica dos campos
    if (!newProduct.name || newProduct.price <= 0 || newProduct.stock < 0 || !newProduct.sku) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos obrigatórios corretamente (Nome, Preço > 0, Estoque >= 0, SKU).", variant: "destructive" })
      return
    }

    console.log("Payload para createProduct:", newProduct)
    console.log("Studio ID:", studioId)

    try {
      await createProduct({
        name: newProduct.name,
        selling_price: parseFloat(newProduct.price.toString()),
        cost_price: parseFloat(newProduct.price.toString()) * 0.6,
        quantity: parseInt(newProduct.stock.toString()),
        sku: newProduct.sku,
        image_url: newProduct.image_url || `https://source.unsplash.com/random/400x400/?product,${newProduct.name}`, // Fallback imagem
        category: 'Global',
        status: 'active',
        min_quantity: 5
      }, studioId)

      const updatedCatalog = await getERPCatalog(studioId)
      setCatalog(updatedCatalog)
      
      toast({ title: "Produto Criado", description: `${newProduct.name} adicionado ao catálogo.` })
      setIsNewProductModalOpen(false)
      setNewProduct({ name: '', price: 0, stock: 0, sku: '', image_url: '' })
    } catch (err: any) {
      console.error("Erro ao criar produto:", err)
      toast({ title: "Erro", description: `Falha ao criar produto: ${err.message || 'Erro desconhecido'}`, variant: "destructive" })
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!studioId) return
    if (!confirm(`Tem certeza que deseja excluir permanentemente o produto "${productName}"?`)) return

    try {
      await deleteProduct(productId, studioId)
      const updatedCatalog = await getERPCatalog(studioId)
      setCatalog(updatedCatalog)
      toast({ title: "Produto Excluído", description: `O produto "${productName}" foi removido do catálogo.` })
    } catch (err: any) {
      console.error("Erro detalhado ao excluir produto:", err)
      const detail = err.details || err.message || "Erro desconhecido"
      toast({ 
        title: "Erro ao excluir", 
        description: `Não foi possível excluir o produto. Detalhe: ${detail}`, 
        variant: "destructive" 
      })
    }
  }

  const handleEmitInvoices = async () => {
    if (selectedOrders.length === 0) {
        toast({ title: "Atenção", description: "Selecione ao menos um pedido para emitir nota.", variant: "destructive" })
        return
    }

    toast({ title: "Processando...", description: `Emitindo ${selectedOrders.length} notas fiscais...` })
    
    try {
        if (!studioId) return
        await emitInvoicesBatch(studioId, selectedOrders)
        
        const [updatedInvoices, updatedPending] = await Promise.all([
            getInvoices(studioId),
            getPendingInvoices(studioId)
        ])
        
        setInvoices(updatedInvoices)
        setPendingInvoices(updatedPending)
        setSelectedOrders([])
        
        toast({ title: "Sucesso", description: "Notas Fiscais emitidas e enviadas por e-mail." })
    } catch (err) {
        toast({ title: "Erro", description: "Falha ao processar lote de notas.", variant: "destructive" })
    }
  }

  const toggleOrderSelection = (id: string) => {
    setSelectedOrders(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
        const { url, filename } = await downloadInvoicePDF(invoiceId)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast({ title: "Download Iniciado", description: `Baixando arquivo ${filename}` })
    } catch (err) {
        toast({ title: "Erro", description: "Falha ao baixar nota fiscal", variant: "destructive" })
    }
  }

  const handleGenerateReport = () => {
    toast({ title: "Relatório Gerado", description: "O download do PDF iniciará em instantes." })
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId || !newOrder.product_id) return

    const product = catalog.find(p => p.id === newOrder.product_id)
    if (!product) return

    try {
      await createERPOrder(studioId, {
        customer_name: newOrder.customer,
        total_amount: product.price * newOrder.qty,
        items: [{ product_id: product.id, sku: product.sku, price: product.price, qty: newOrder.qty }]
      })
      
      const updatedOrders = await getERPOrders(studioId)
      const updatedCatalog = await getERPCatalog(studioId)
      
      setErpOrders(updatedOrders)
      setCatalog(updatedCatalog)
      
      toast({ title: "Venda Registrada", description: `Pedido criado para ${newOrder.customer}` })
      setIsNewOrderModalOpen(false)
      setNewOrder({ customer: '', product_id: '', qty: 1 })
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao criar pedido", variant: "destructive" })
    }
  }

  const handleSync = async (sku: string) => {
    setIsSyncing(sku)
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSyncing(null)
    toast({
        title: "Sincronizado",
        description: `Produto ${sku} atualizado nos canais.`
    })
  }

  const handleConnectChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId) return

    try {
      await connectChannel(studioId, newChannel.platform, newChannel.name, newChannel.apiKey)
      const updatedChannels = await getChannels(studioId)
      setChannels(updatedChannels)
      
      toast({
        title: "Canal Conectado",
        description: `Integração com ${newChannel.name} configurada com sucesso.`,
      })
      setIsConnectModalOpen(false)
      setNewChannel({ platform: '', name: '', apiKey: '' })
    } catch (err) {
      toast({
        title: "Erro na conexão",
        description: "Verifique a chave de API e tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId) return
    try {
      await createSupplier(studioId, newSupplier)
      const updated = await getSuppliers(studioId)
      setSuppliers(updated)
      toast({ title: "Fornecedor Cadastrado", description: `${newSupplier.name} adicionado com sucesso.` })
      setIsNewSupplierModalOpen(false)
      setNewSupplier({ name: '', contact_name: '', email: '', category: 'products' })
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao cadastrar fornecedor", variant: "destructive" })
    }
  }

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId) return
    try {
      await createPurchaseOrder(studioId, newPO)
      const updated = await getPurchaseOrders(studioId)
      setPurchaseOrders(updated)
      toast({ title: "Ordem de Compra Criada", description: "Enviada para processamento." })
      setIsNewPOModalOpen(false)
      setNewPO({ supplier_id: '', total_amount: 0, items: [], expected_date: '' })
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao criar ordem de compra", variant: "destructive" })
    }
  }

  const handleUpdateShipping = async (orderId: string) => {
    if (!studioId) return
    const tracking = prompt("Informe o código de rastreio:")
    if (!tracking) return
    
    try {
        await updateOrderShipping(studioId, orderId, { tracking_code: tracking, carrier: 'Correios' })
        const updatedOrders = await getERPOrders(studioId)
        setErpOrders(updatedOrders)
        toast({ title: "Status Atualizado", description: "Pedido marcado como enviado." })
    } catch (err) {
        toast({ title: "Erro", description: "Falha ao atualizar envio", variant: "destructive" })
    }
  }

  const handleUpdateBusinessType = async (type: any) => {
    if (!studioId) return
    try {
        await updateBusinessType(studioId, type)
        const newSettings = await getOrganizationSettings(studioId)
        setSettings(newSettings)
        toast({ title: "Configuração Atualizada", description: `Nomenclatura alterada para ${type}.` })
        setIsSettingsModalOpen(false)
    } catch (err) {
        toast({ title: "Erro", description: "Falha ao atualizar configurações", variant: "destructive" })
    }
  }

  if (loading) return null

  if (userPlan !== "enterprise") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="ERP Enterprise" />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <Card className="max-w-md p-8 border-dashed border-2 bg-muted/30">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-2">Módulo ERP Enterprise</CardTitle>
            <CardDescription className="text-base mb-8">
              O ecossistema completo de gestão **Omnichannel, Logística e NFe** é exclusivo para parceiros do plano **Enterprise**.
              <br /><br />
              Sua conta atual: <Badge variant="outline" className="font-bold uppercase">{userPlan}</Badge>
            </CardDescription>
            <div className="space-y-3">
              <Button size="lg" className="w-full bg-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" onClick={() => window.location.href='/dashboard/configuracoes?tab=plano'}>
                Fazer Upgrade para Enterprise
              </Button>
              <p className="text-[10px] text-muted-foreground italic">
                A liberação é automática após a confirmação do upgrade no banco de dados.
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <ModuleGuard module="erp" showFullError>
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Gestão ERP Enterprise">
        <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Zap className="w-4 h-4" /> Tipo de Negócio
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Personalização do Ecossistema</DialogTitle>
                    <DialogDescription>Altere a nomenclatura global do sistema.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={settings?.business_type === 'dance_school' ? 'default' : 'outline'} onClick={() => handleUpdateBusinessType('dance_school')}>Escola de Dança</Button>
                        <Button variant={settings?.business_type === 'tattoo_studio' ? 'default' : 'outline'} onClick={() => handleUpdateBusinessType('tattoo_studio')}>Estúdio de Tattoo</Button>
                        <Button variant={settings?.business_type === 'gym' ? 'default' : 'outline'} onClick={() => handleUpdateBusinessType('gym')}>Academia / Box</Button>
                        <Button variant={settings?.business_type === 'clinic' ? 'default' : 'outline'} onClick={() => handleUpdateBusinessType('clinic')}>Clínica / Saúde</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </Header>

      <div className="flex-1 p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium opacity-80">Receita Omnichannel</p>
                  <h3 className="text-2xl font-bold mt-1">R$ {stats.revenue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>
                <BarChart3 className="w-5 h-5 opacity-50" />
              </div>
              <div className="flex items-center mt-4 text-xs">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span>+{stats.revenue.growth}% este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pedidos em Aberto</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.orders.pending}</h3>
                </div>
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-xs text-orange-500 mt-4">{stats.orders.waiting_collection} aguardando coleta</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Logística Ativa</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.logistics.active}</h3>
                </div>
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-xs text-blue-500 mt-4">{stats.logistics.on_time_percentage}% entregas no prazo</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Canais Ativos</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.channels.active}</h3>
                </div>
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-xs text-green-500 mt-4">Todos os hubs operacionais</div>
            </CardContent>
          </Card>
        </div>

        {/* ERP Tabs */}
        <Tabs defaultValue="channels" onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted p-1 overflow-x-auto inline-flex w-full md:w-auto h-auto">
            <TabsTrigger value="channels" className="gap-2 shrink-0"><Globe className="w-4 h-4" /> Canais</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 shrink-0"><ShoppingCart className="w-4 h-4" /> Pedidos</TabsTrigger>
            <TabsTrigger value="catalog" className="gap-2 shrink-0"><Database className="w-4 h-4" /> Catálogo</TabsTrigger>
            <TabsTrigger value="logistics" className="gap-2 shrink-0"><Truck className="w-4 h-4" /> Logística</TabsTrigger>
            <TabsTrigger value="supplies" className="gap-2 shrink-0"><Box className="w-4 h-4" /> Suprimentos</TabsTrigger>
            <TabsTrigger value="finance" className="gap-2 shrink-0"><Receipt className="w-4 h-4" /> NFe/Fiscal</TabsTrigger>
            <TabsTrigger value="crm" className="gap-2 shrink-0"><Users2 className="w-4 h-4" /> CRM B2B</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader><CardTitle className="text-lg">Hub de Integração</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {channels.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground text-sm">Nenhum canal conectado.</div>
                  ) : channels.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-bold">{m.name}</p>
                        <Badge variant={m.status === 'active' ? 'outline' : 'destructive'} className="text-[10px] h-4">
                          {m.status === 'active' ? 'Online' : 'Erro'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{m.platform.toUpperCase()}</p>
                        <p className="text-[9px] text-muted-foreground">Sync: {new Date(m.last_sync || '').toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                  <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-dashed"><Plus className="w-4 h-4 mr-2" /> Conectar Novo</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Conectar Novo Canal</DialogTitle>
                        <DialogDescription>Integre sua loja com novos marketplaces.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleConnectChannel} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Plataforma</Label>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={newChannel.platform}
                            onChange={e => setNewChannel({...newChannel, platform: e.target.value})}
                            required
                          >
                            <option value="">Selecione...</option>
                            <option value="mercadolivre">Mercado Livre</option>
                            <option value="amazon">Amazon</option>
                            <option value="shopee">Shopee</option>
                            <option value="woocommerce">WooCommerce</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Nome da Loja</Label>
                          <Input 
                            placeholder="Ex: Minha Loja Oficial" 
                            value={newChannel.name}
                            onChange={e => setNewChannel({...newChannel, name: e.target.value})}
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Chave de Acesso (API Key)</Label>
                          <Input 
                            type="password" 
                            value={newChannel.apiKey}
                            onChange={e => setNewChannel({...newChannel, apiKey: e.target.value})}
                            required 
                          />
                        </div>
                        <Button type="submit" className="w-full">Conectar Canal</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Performance de Canais</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-around py-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">4.9</p>
                      <p className="text-xs text-muted-foreground">Reputação ML</p>
                    </div>
                    <div className="text-center border-x px-10">
                      <p className="text-3xl font-bold text-blue-600">97%</p>
                      <p className="text-xs text-muted-foreground">SLA Amazon</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-orange-600">4.8</p>
                      <p className="text-xs text-muted-foreground">Review Shopee</p>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                      <Sparkles className="w-4 h-4" /> IA Enterprise Insight
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      {stats.orders.pending > 100 
                        ? `"Atenção: O volume de pedidos em aberto está alto (${stats.orders.pending}). Considere aumentar a equipe de expedição."`
                        : stats.revenue.growth > 10 
                          ? `"Ótimo trabalho! Sua receita cresceu ${stats.revenue.growth}% este mês. Analise quais canais estão performando melhor."`
                          : `"Detectamos estabilidade nas vendas. Considere criar uma promoção relâmpago para movimentar o estoque parado."`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestão de Pedidos Omnichannel</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleGenerateReport}><FileText className="w-4 h-4 mr-2" /> Relatório</Button>
                  
                  <Dialog open={isNewOrderModalOpen} onOpenChange={setIsNewOrderModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Venda Manual</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Venda Manual</DialogTitle>
                        <DialogDescription>Registrar venda e baixar estoque.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateOrder} className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Nome do Cliente</Label>
                          <Input 
                            value={newOrder.customer}
                            onChange={e => setNewOrder({...newOrder, customer: e.target.value})}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Produto</Label>
                          <Select 
                            value={newOrder.product_id} 
                            onValueChange={val => setNewOrder({...newOrder, product_id: val})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {catalog.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} (R$ {p.selling_price}) - Estoque: {p.quantity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Quantidade</Label>
                          <Input 
                            type="number" 
                            min="1"
                            value={newOrder.qty}
                            onChange={e => setNewOrder({...newOrder, qty: parseInt(e.target.value)})}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit">Confirmar Venda</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left border-b">
                        <th className="p-4 font-medium">ID</th>
                        <th className="p-4 font-medium">Canal</th>
                        <th className="p-4 font-medium">Cliente</th>
                        <th className="p-4 font-medium">Valor</th>
                        <th className="p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {erpOrders.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>
                      ) : erpOrders.map((o) => (
                        <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4 font-mono font-bold text-primary">{o.external_id}</td>
                          <td className="p-4 text-xs">{o.integration_channels?.name || 'Manual'}</td>
                          <td className="p-4">{o.customer_name}</td>
                          <td className="p-4 font-bold">R$ {o.total_amount}</td>
                          <td className="p-4">
                            <Badge className={cn("text-[10px]", o.status === 'finished' ? "bg-green-500" : "bg-blue-500")}>
                              {o.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Catálogo Mestre (Global SKU)</CardTitle>
                  <CardDescription>Sincronização centralizada de anúncios</CardDescription>
                </div>
                
                <Dialog open={isNewProductModalOpen} onOpenChange={setIsNewProductModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary"><Plus className="w-4 h-4 mr-2" /> Novo Produto Global</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Produto Global</DialogTitle>
                      <DialogDescription>Este produto será sincronizado com todos os canais conectados.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProduct} className="space-y-4 pt-4">
                      <div className="grid gap-2">
                        <Label>Nome do Produto</Label>
                        <Input 
                          value={newProduct.name}
                          onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Preço de Venda (R$)</Label>
                          <Input 
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newProduct.price}
                            onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Estoque Inicial</Label>
                          <Input 
                            type="number"
                            min="0"
                            value={newProduct.stock}
                            onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>SKU (Código Único)</Label>
                        <Input 
                          placeholder="EX: CAMISETA-P-AZUL"
                          value={newProduct.sku}
                          onChange={e => setNewProduct({...newProduct, sku: e.target.value.toUpperCase()})}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>URL da Imagem (Opcional)</Label>
                        <div className="flex gap-2">
                            <Input 
                              placeholder="https://exemplo.com/foto.jpg"
                              value={newProduct.image_url}
                              onChange={e => setNewProduct({...newProduct, image_url: e.target.value})}
                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setNewProduct({...newProduct, image_url: `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&auto=format&fit=crop&q=60`})}
                                title="Gerar Exemplo"
                            >
                                🎲
                            </Button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Cadastrar Produto</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left border-b">
                        <th className="p-4 font-medium">Produto</th>
                        <th className="p-4 font-medium">SKU</th>
                        <th className="p-4 font-medium text-center">Canais</th>
                        <th className="p-4 font-medium text-center">Estoque Total</th>
                        <th className="p-4 font-medium text-right">Preço</th>
                        <th className="p-4 font-medium text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhum produto no catálogo.</td></tr>
                      ) : catalog.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4 font-medium">{p.name}</td>
                          <td className="p-4 text-muted-foreground text-xs">{p.sku || '-'}</td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center -space-x-1">
                              {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border bg-muted" />)}
                              <div className="w-5 h-5 rounded-full border bg-primary/10 text-[8px] flex items-center justify-center font-bold">+{p.channels}</div>
                            </div>
                          </td>
                          <td className="p-4 text-center font-bold">
                            {isSyncing === p.sku ? <RefreshCw className="w-4 h-4 animate-spin mx-auto text-primary" /> : p.stock}
                          </td>
                          <td className="p-4 text-right">R$ {p.price}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleSync(p.sku)} disabled={isSyncing === p.sku}>
                                <RefreshCw className={cn("w-4 h-4 mr-1", isSyncing === p.sku && "animate-spin")} />
                                Sincronizar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Monitor de Expedição</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {erpOrders.filter(o => o.status === 'paid' || o.status === 'shipped').length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground italic">Nenhuma expedição ativa no momento.</div>
                  ) : erpOrders.filter(o => o.status === 'paid' || o.status === 'shipped').map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-4 border rounded-xl bg-card">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><Truck className="w-5 h-5" /></div>
                        <div>
                          <p className="font-bold text-sm">Pedido {o.external_id}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {o.customer_name} • {o.shipping_info?.tracking_code || 'Aguardando Rastreio'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={o.status === 'shipped' ? 'default' : 'secondary'} className="text-[10px]">
                            {o.status === 'shipped' ? 'Enviado' : 'Aguardando Envio'}
                        </Badge>
                        {o.status === 'paid' && (
                            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleUpdateShipping(o.id)}>
                                Despachar
                            </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-indigo-600 text-white">
                <CardHeader><CardTitle>Contrato Ship</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm opacity-90 mb-4">Você possui <strong>-45% de desconto</strong> nas etiquetas de envio este mês.</p>
                  <div className="flex items-center gap-2 text-xl font-bold"><ShieldCheck className="w-6 h-6" /> Proteção Total</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="supplies" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Gestão de Suprimentos B2B</h2>
                <div className="flex gap-2">
                    <Dialog open={isNewSupplierModalOpen} onOpenChange={setIsNewSupplierModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Novo Fornecedor</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cadastrar Fornecedor</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateSupplier} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Nome/Razão Social</Label>
                                    <Input value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Contato</Label>
                                        <Input value={newSupplier.contact_name} onChange={e => setNewSupplier({...newSupplier, contact_name: e.target.value})} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Email</Label>
                                        <Input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Salvar Fornecedor</Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isNewPOModalOpen} onOpenChange={setIsNewPOModalOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Ordem de Compra</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nova Ordem de Compra (PO)</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreatePO} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Fornecedor</Label>
                                    <Select value={newPO.supplier_id} onValueChange={val => setNewPO({...newPO, supplier_id: val})}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Valor Total (R$)</Label>
                                        <Input type="number" value={newPO.total_amount} onChange={e => setNewPO({...newPO, total_amount: parseFloat(e.target.value)})} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Previsão Entrega</Label>
                                        <Input type="date" value={newPO.expected_date} onChange={e => setNewPO({...newPO, expected_date: e.target.value})} required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Gerar PO</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
              <CardHeader><CardTitle>Ordens de Compra Recentes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchaseOrders.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground italic">Nenhuma ordem de compra registrada.</div>
                  ) : purchaseOrders.map(po => (
                    <div key={po.id} className="flex justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-bold">{po.ref}</p>
                        <p className="text-xs text-muted-foreground">{po.suppliers?.name} • Valor: R$ {po.total_amount}</p>
                      </div>
                      <Badge variant={po.status === 'received' ? 'default' : 'outline'}>{po.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
                <div>
                    <h3 className="font-bold text-blue-700 dark:text-blue-300">Importação Inteligente</h3>
                    <p className="text-xs text-muted-foreground">Cadastre fornecedores e produtos automaticamente via XML.</p>
                </div>
                <Button onClick={() => window.location.href='/dashboard/erp/import'} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <Upload className="w-4 h-4" /> Importar NFe
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Faturamento Pendente
                            <Badge variant="outline" className="text-orange-500 border-orange-200">
                                {pendingInvoices.length} aguardando
                            </Badge>
                        </CardTitle>
                        <CardDescription>Pedidos prontos para emissão de NFe</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="text-left border-b">
                                        <th className="p-4 w-10">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedOrders.length === pendingInvoices.length && pendingInvoices.length > 0}
                                                onChange={() => {
                                                    if (selectedOrders.length === pendingInvoices.length) setSelectedOrders([])
                                                    else setSelectedOrders(pendingInvoices.map(p => p.id))
                                                }}
                                            />
                                        </th>
                                        <th className="p-4 font-medium">Pedido</th>
                                        <th className="p-4 font-medium">Cliente</th>
                                        <th className="p-4 font-medium">Valor</th>
                                        <th className="p-4 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingInvoices.length === 0 ? (
                                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground italic">Nenhum pedido pendente de faturamento.</td></tr>
                                    ) : pendingInvoices.map((p) => (
                                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="p-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedOrders.includes(p.id)}
                                                    onChange={() => toggleOrderSelection(p.id)}
                                                />
                                            </td>
                                            <td className="p-4 font-mono font-bold text-xs">{p.external_id}</td>
                                            <td className="p-4">{p.customer_name}</td>
                                            <td className="p-4 font-bold">R$ {p.total_amount}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {p.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700" 
                            disabled={selectedOrders.length === 0}
                            onClick={handleEmitInvoices}
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            Emitir {selectedOrders.length} Nota(s) Selecionada(s)
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Status Fiscal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg border flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="text-sm font-bold">Certificado A1</p>
                                <p className="text-[10px] text-muted-foreground">Válido até 12/2026</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase text-muted-foreground">Resumo do Mês</p>
                            <div className="flex justify-between text-sm">
                                <span>Total Emitido:</span>
                                <span className="font-bold text-green-600">R$ {invoices.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Impostos Est.:</span>
                                <span className="font-bold text-orange-600">R$ {(invoices.reduce((acc, curr) => acc + curr.amount, 0) * 0.06).toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Histórico de Notas Emitidas</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr className="text-left border-b">
                                <th className="p-4 font-medium">Nº Nota</th>
                                <th className="p-4 font-medium">Cliente</th>
                                <th className="p-4 font-medium">Valor</th>
                                <th className="p-4 font-medium">Data</th>
                                <th className="p-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground italic">Nenhuma nota emitida recentemente.</td></tr>
                            ) : invoices.map((inv) => (
                                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="p-4 font-mono font-bold">{inv.number}</td>
                                    <td className="p-4">{inv.customer}</td>
                                    <td className="p-4 font-bold text-green-600">R$ {inv.amount}</td>
                                    <td className="p-4 text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(inv.id)}>
                                            <ArrowDownRight className="w-4 h-4 mr-1 rotate-90" />
                                            PDF
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crm" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Gestão de Franquias & Revenda</CardTitle></CardHeader>
              <CardContent className="h-40 flex items-center justify-center text-muted-foreground italic border rounded-xl border-dashed">
                <div className="text-center">
                  <Users2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>Módulo de expansão B2B: 12 parceiros ativos</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </ModuleGuard>
  )
}
