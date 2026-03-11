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
  ShieldCheck,
  Plus,
  RefreshCw,
  FileText,
  Users2,
  Box,
  Sparkles,
  AlertCircle,
  Lock,
  Trash2,
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
  getB2BStats,
  type IntegrationChannel,
  type ERPOrder,
  type OrganizationSettings as OrgSettings,
  type Supplier,
  type PurchaseOrder,
  type B2BStats,
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
  const { vocabulary, t, language } = useVocabulary()
  const { toast } = useToast()
  const [userPlan, setUserPlan] = useState<string>("free")
  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState<IntegrationChannel[]>([])
  const [erpOrders, setErpOrders] = useState<ERPOrder[]>([])
  const [catalog, setCatalog] = useState<any[]>([])
  const [settings, setSettings] = useState<OrgSettings | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [b2bStats, setB2bStats] = useState<B2BStats | null>(null)
  
  // Categorias
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const defaultCategories = ["Bebidas", "Alimentos", "Acessórios", "Uniformes", "Equipamentos", "Suplementos", "Geral"]
  // Catalog pode ter produtos com categorias que não estão no default
  const allCategories = Array.from(new Set([
    ...defaultCategories,
    ...(catalog?.map(p => p.category).filter(Boolean) || []),
    ...customCategories
  ])).sort()

  // --- UI States ---
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false)
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false)
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
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, stock: 0, sku: '', image_url: '', category: 'Geral' })
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_name: '', email: '', category: 'products' })
  const [newPO, setNewPO] = useState({ supplier_id: '', total_amount: 0, items: [] as any[], expected_date: '' })

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem("danceflow_user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          const isSuperAdmin = user.role === 'super_admin'
          
          let currentPlan = isSuperAdmin ? "enterprise" : (user.plan || user.plan_name || user.studio?.plan || "gratuito")
          const sId = user.studio_id || user.studioId || user.studio?.id 
          
          setStudioId(sId)

          if (sId) {
             const [chData, ordData, catData, settsData, dbPlan, dashboardStats, suppliersData, poData, b2bData] = await Promise.all([
               getChannels(sId),
               getERPOrders(sId),
               getERPCatalog(sId),
               getOrganizationSettings(sId),
               !isSuperAdmin ? getStudioPlan(sId) : Promise.resolve("enterprise"),
               getERPDashboardStats(sId),
               getSuppliers(sId),
               getPurchaseOrders(sId),
               getB2BStats(sId),
             ])
             
             setChannels(chData || [])
             setErpOrders(ordData || [])
             setCatalog(catData || [])
             setSettings(settsData)
             setSuppliers(suppliersData || [])
             setPurchaseOrders(poData || [])
             setB2bStats(b2bData)
             if (dashboardStats) setStats(dashboardStats)
             
             if (dbPlan) {
               currentPlan = dbPlan.toLowerCase()
             }
          }
          
          setUserPlan(currentPlan)

        } catch (e) {
          console.error(t.common.errorLoadingData + " ERP:", e)
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
      toast({ title: t.common.error, description: t.erp.studioIdNotFound, variant: "destructive" })
      return
    }

    // Validação básica dos campos
    if (!newProduct.name || newProduct.price <= 0 || newProduct.stock < 0 || !newProduct.sku) {
      toast({ title: t.common.error, description: t.erp.fillAllRequiredFields, variant: "destructive" })
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
        category: newProduct.category || 'Geral',
        status: 'active',
        min_quantity: 5
      }, studioId)

      const updatedCatalog = await getERPCatalog(studioId)
      setCatalog(updatedCatalog)
      
      toast({ title: t.erp.productCreated, description: t.erp.productAddedToCatalog.replace('{productName}', newProduct.name) })
      setIsNewProductModalOpen(false)
      setNewProduct({ name: '', price: 0, stock: 0, sku: '', image_url: '', category: 'Geral' })
    } catch (err: any) {
      console.error(t.erp.errorCreatingProduct, err)
      toast({ title: t.common.error, description: t.erp.failedToCreateProduct.replace('{errorMessage}', err.message || t.common.unknownError), variant: "destructive" })
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!studioId) return
    if (!confirm(t.erp.confirmDeleteProduct.replace('{productName}', productName))) return

    try {
      await deleteProduct(productId, studioId)
      const updatedCatalog = await getERPCatalog(studioId)
      setCatalog(updatedCatalog)
      toast({ title: t.erp.productDeleted, description: t.erp.productRemovedFromCatalog.replace('{productName}', productName) })
    } catch (err: any) {
      console.error(t.erp.detailedErrorDeletingProduct, err)
      const detail = err.details || err.message || t.common.unknownError
      toast({ 
        title: t.erp.errorDeletingProduct, 
        description: t.erp.couldNotDeleteProduct.replace('{detail}', detail), 
        variant: "destructive" 
      })
    }
  }

  const handleGenerateReport = async () => {
    if (!studioId) return
    try {
      const res = await fetch(`/api/admin/reports/generate?studioId=${studioId}&type=erp`)
      if (!res.ok) throw new Error('Falha ao gerar relatório')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-erp-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: t.erp.reportGenerated, description: t.erp.pdfDownloadWillStart })
    } catch (err) {
      // Fallback: exportar CSV dos pedidos
      if (erpOrders.length === 0) { toast({ title: "Sem dados para exportar" }); return }
      const rows = [
        ['ID', 'Canal', 'Cliente', 'Valor', 'Status', 'Data'].join(','),
        ...erpOrders.map((o: any) => [
          o.external_id || o.id?.slice(0, 8),
          o.integration_channels?.name || 'Manual',
          o.customer_name,
          o.total_amount,
          o.status,
          o.created_at?.split('T')[0],
        ].join(',')),
      ].join('\n')
      const blob = new Blob([rows], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pedidos-erp-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: t.erp.reportGenerated, description: 'Relatório CSV exportado' })
    }
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
      
      toast({ title: t.erp.saleRegistered, description: t.erp.orderCreatedFor.replace('{customerName}', newOrder.customer) })
      setIsNewOrderModalOpen(false)
      setNewOrder({ customer: '', product_id: '', qty: 1 })
    } catch (err) {
      toast({ title: t.common.error, description: t.erp.failedToCreateOrder, variant: "destructive" })
    }
  }

  const handleSync = async (sku: string) => {
    if (!studioId) return
    setIsSyncing(sku)
    try {
      const res = await fetch('/api/admin/integrations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studioId, sku, action: 'sync_product' }),
      })
      if (res.ok) {
        toast({ title: t.erp.synchronized, description: t.erp.productUpdatedInChannels.replace('{sku}', sku) })
        const updatedCatalog = await getERPCatalog(studioId)
        setCatalog(updatedCatalog)
      } else {
        throw new Error('Sync falhou')
      }
    } catch {
      toast({ title: t.common.error, description: `Falha ao sincronizar SKU ${sku}`, variant: 'destructive' })
    } finally {
      setIsSyncing(null)
    }
  }

  const handleConnectChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId) return

    try {
      await connectChannel(studioId, newChannel.platform, newChannel.name, newChannel.apiKey)
      const updatedChannels = await getChannels(studioId)
      setChannels(updatedChannels)
      
      toast({
        title: t.erp.channelConnected,
        description: t.erp.integrationConfiguredSuccessfully.replace('{channelName}', newChannel.name),
      })
      setIsConnectModalOpen(false)
      setNewChannel({ platform: '', name: '', apiKey: '' })
    } catch (err) {
      toast({
        title: t.erp.connectionError,
        description: t.erp.checkApiKeyAndTryAgain,
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
      toast({ title: t.erp.supplierRegistered, description: t.erp.supplierAddedSuccessfully.replace('{supplierName}', newSupplier.name) })
      setIsNewSupplierModalOpen(false)
      setNewSupplier({ name: '', contact_name: '', email: '', category: 'products' })
    } catch (err) {
      toast({ title: t.common.error, description: t.erp.failedToRegisterSupplier, variant: "destructive" })
    }
  }

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioId) return
    try {
      await createPurchaseOrder(studioId, newPO)
      const updated = await getPurchaseOrders(studioId)
      setPurchaseOrders(updated)
      toast({ title: t.erp.purchaseOrderCreated, description: t.erp.sentForProcessing })
      setIsNewPOModalOpen(false)
      setNewPO({ supplier_id: '', total_amount: 0, items: [], expected_date: '' })
    } catch (err) {
      toast({ title: t.common.error, description: t.erp.failedToCreatePurchaseOrder, variant: "destructive" })
    }
  }

  const handleUpdateShipping = async (orderId: string) => {
    if (!studioId) return
    const tracking = prompt(t.erp.enterTrackingCode)
    if (!tracking) return
    
    try {
        await updateOrderShipping(studioId, orderId, { tracking_code: tracking, carrier: 'Correios' })
        const updatedOrders = await getERPOrders(studioId)
        setErpOrders(updatedOrders)
        toast({ title: t.erp.statusUpdated, description: t.erp.orderMarkedAsShipped })
    } catch (err) {
        toast({ title: t.common.error, description: t.erp.failedToUpdateShipping, variant: "destructive" })
    }
  }

  if (loading) return null

  return (
    <ModuleGuard module="erp" showFullError>
      <div className="min-h-screen bg-background flex flex-col">
        <Header title={t.sidebar.erp} />

      <div className="flex-1 p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium opacity-80">{t.erp.omnichannelRevenue}</p>
                  <h3 className="text-2xl font-bold mt-1">{language === 'en' ? '$' : 'R$'} {stats.revenue.total.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>
                <BarChart3 className="w-5 h-5 opacity-50" />
              </div>
              <div className="flex items-center mt-4 text-xs">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span>+{stats.revenue.growth}% {t.erp.thisMonth}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t.erp.pendingOrders}</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.orders.pending}</h3>
                </div>
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-xs text-orange-500 mt-4">{stats.orders.waiting_collection} {t.erp.awaitingCollection}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t.erp.activeLogistics}</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.logistics.active}</h3>
                </div>
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-xs text-blue-500 mt-4">{stats.logistics.on_time_percentage}% {t.erp.deliveriesOnTime}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t.erp.activeChannels}</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.channels.active}</h3>
                </div>
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-xs text-green-500 mt-4">{t.erp.allOperationalHubs}</div>
            </CardContent>
          </Card>
        </div>

        {/* ERP Tabs */}
        <Tabs defaultValue="channels" onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted p-1 overflow-x-auto inline-flex w-full md:w-auto h-auto">
            <TabsTrigger value="channels" className="gap-2 shrink-0"><Globe className="w-4 h-4" /> {t.erp.channels}</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 shrink-0"><ShoppingCart className="w-4 h-4" /> {t.erp.orders}</TabsTrigger>
            <TabsTrigger value="catalog" className="gap-2 shrink-0"><Database className="w-4 h-4" /> {t.erp.catalog}</TabsTrigger>
            <TabsTrigger value="logistics" className="gap-2 shrink-0"><Truck className="w-4 h-4" /> {t.erp.logistics}</TabsTrigger>
            <TabsTrigger value="supplies" className="gap-2 shrink-0"><Box className="w-4 h-4" /> {t.erp.supplies}</TabsTrigger>
            <TabsTrigger value="crm" className="gap-2 shrink-0"><Users2 className="w-4 h-4" /> {t.erp.crmB2B}</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader><CardTitle className="text-lg">{t.erp.integrationHub}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {channels.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground text-sm">{t.erp.noChannelsConnected}</div>
                  ) : channels.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-bold">{m.name}</p>
                        <Badge variant={m.status === 'active' ? 'outline' : 'destructive'} className="text-[10px] h-4">
                          {m.status === 'active' ? t.common.online : t.common.error}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{m.platform.toUpperCase()}</p>
                        <p className="text-[9px] text-muted-foreground">{t.erp.lastSync}: {new Date(m.last_sync || '').toLocaleTimeString(language === 'en' ? 'en-US' : 'pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                  <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-dashed"><Plus className="w-4 h-4 mr-2" /> {t.erp.connectNew}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.erp.connectNewChannel}</DialogTitle>
                        <DialogDescription>{t.erp.integrateStores}</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleConnectChannel} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>{t.erp.platform}</Label>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={newChannel.platform}
                            onChange={e => setNewChannel({...newChannel, platform: e.target.value})}
                            required
                          >
                            <option value="">{t.common.select}...</option>
                            <option value="mercadolivre">{t.erp.mercadolivre}</option>
                            <option value="amazon">{t.erp.amazon}</option>
                            <option value="shopee">{t.erp.shopee}</option>
                            <option value="woocommerce">{t.erp.woocommerce}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t.erp.storeName}</Label>
                          <Input 
                            placeholder={t.erp.storeNamePlaceholder} 
                            value={newChannel.name}
                            onChange={e => setNewChannel({...newChannel, name: e.target.value})}
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t.erp.apiKey}</Label>
                          <Input 
                            type="password" 
                            value={newChannel.apiKey}
                            onChange={e => setNewChannel({...newChannel, apiKey: e.target.value})}
                            required 
                          />
                        </div>
                        <Button type="submit" className="w-full">{t.erp.connectChannel}</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader><CardTitle>{t.erp.channelPerformance}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  {channels.filter(c => c.status === 'active').length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground flex flex-col items-center gap-2">
                      <Globe className="w-8 h-8 opacity-20" />
                      <p className="text-sm font-medium">{t.erp.noConnectedChannels}</p>
                      <p className="text-xs">{t.erp.connectFirstStoreHint}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-around py-6">
                        {(() => {
                          const active = channels.filter(c => c.status === 'active').slice(0, 3)
                          const colorMap: Record<string, string> = {
                            green: 'text-green-600',
                            blue: 'text-blue-600',
                            orange: 'text-orange-600',
                            purple: 'text-purple-600',
                            gray: 'text-muted-foreground',
                          }
                          const slots = [0, 1, 2].map(i => active[i] || null)
                          return slots.map((ch, i) => (
                            <div
                              key={i}
                              className={cn(
                                "text-center",
                                i === 1 && "border-x px-10",
                                !ch && "opacity-25 pointer-events-none"
                              )}
                            >
                              <p className={cn("text-3xl font-bold", ch ? colorMap[ch.config?.color ?? 'gray'] : 'text-muted-foreground')}>
                                {ch
                                  ? ch.config?.metric_value != null
                                    ? `${ch.config.metric_value}${ch.config.metric_unit ?? ''}`
                                    : '—'
                                  : '—'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {ch
                                  ? `${ch.config?.metric_label ?? 'Score'} · ${ch.name}`
                                  : t.erp.waitingChannelData}
                              </p>
                            </div>
                          ))
                        })()}
                      </div>
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                          <Sparkles className="w-4 h-4" /> {t.erp.aiInsight}
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          {stats.orders.pending > 100
                            ? t.erp.highOrderVolume.replace('{pendingOrders}', stats.orders.pending.toString())
                            : stats.revenue.growth > 10
                              ? t.erp.greatRevenueGrowth.replace('{revenueGrowth}', stats.revenue.growth.toString())
                              : t.erp.stableSalesSuggestPromotion}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.erp.omnichannelOrderManagement}</CardTitle>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateReport}><FileText className="w-4 h-4 mr-2" /> {t.erp.report}</Button>
                  
                  <Dialog open={isNewOrderModalOpen} onOpenChange={setIsNewOrderModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="w-4 h-4 mr-2" /> {t.erp.manualSale}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.erp.newManualSale}</DialogTitle>
                        <DialogDescription>{t.erp.registerSaleAndDownloadStock}</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateOrder} className="space-y-4">
                        <div className="grid gap-2">
                          <Label>{t.erp.clientName}</Label>
                          <Input 
                            value={newOrder.customer}
                            onChange={e => setNewOrder({...newOrder, customer: e.target.value})}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>{t.erp.product}</Label>
                          <Select 
                            value={newOrder.product_id} 
                            onValueChange={val => setNewOrder({...newOrder, product_id: val})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t.common.select + "..."} />
                            </SelectTrigger>
                            <SelectContent>
                              {catalog.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} ({language === 'en' ? '$' : 'R$'} {p.selling_price}) - {t.erp.stock}: {p.quantity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>{t.erp.quantity}</Label>
                          <Input 
                            type="number" 
                            min="1"
                            value={newOrder.qty}
                            onChange={e => setNewOrder({...newOrder, qty: parseInt(e.target.value)})}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit">{t.erp.confirmSale}</Button>
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
                        <th className="p-4 font-medium">{t.common.id}</th>
                        <th className="p-4 font-medium">{t.erp.channel}</th>
                        <th className="p-4 font-medium">{t.erp.client}</th>
                        <th className="p-4 font-medium">{t.common.value}</th>
                        <th className="p-4 font-medium">{t.common.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {erpOrders.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">{t.erp.noOrdersFound}</td></tr>
                      ) : erpOrders.map((o) => (
                        <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4 font-mono font-bold text-primary">{o.external_id}</td>
                          <td className="p-4 text-xs">{o.integration_channels?.name || t.erp.manual}</td>
                          <td className="p-4">{o.customer_name}</td>
                          <td className="p-4 font-bold">{language === 'en' ? '$' : 'R$'} {o.total_amount}</td>
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
            {/* Atalho para o módulo de Estoque completo */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="w-4 h-4 text-primary" />
                <span>Os produtos abaixo são gerenciados pelo módulo de <strong>Estoque</strong> — cadastre, dê entrada/saída e escaneie código de barras lá.</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => window.location.href = '/dashboard/estoque'}
              >
                <Box className="w-4 h-4" /> Ir para Estoque
              </Button>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t.erp.masterCatalog}</CardTitle>
                  <CardDescription>{t.erp.centralizedAdSync}</CardDescription>
                </div>
                
                <Dialog open={isNewProductModalOpen} onOpenChange={setIsNewProductModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary"><Plus className="w-4 h-4 mr-2" /> {t.erp.newGlobalProduct}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.erp.newGlobalProduct}</DialogTitle>
                      <DialogDescription>{t.erp.productSyncDescription}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProduct} className="space-y-4 pt-4">
                      <div className="grid gap-2">
                        <Label>{t.erp.productName}</Label>
                        <Input 
                          value={newProduct.name}
                          onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Tipo de Produto (Categoria)</Label>
                        <Select 
                          value={newProduct.category} 
                          onValueChange={val => {
                            if (val === "ADD_NEW") {
                              const name = prompt("Digite o nome do novo tipo de produto:");
                              if (name) {
                                setCustomCategories(prev => [...prev, name]);
                                setNewProduct(prev => ({ ...prev, category: name }));
                              }
                            } else {
                              setNewProduct({...newProduct, category: val});
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                            <SelectItem value="ADD_NEW" className="text-primary font-medium focus:bg-primary/10">
                              <Plus className="w-3 h-3 mr-2 inline" /> Criar novo tipo...
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>{t.erp.sellingPrice.replace('{currency}', language === 'en' ? '$' : 'R$')}</Label>
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
                          <Label>{t.erp.initialStock}</Label>
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
                        <Label>{t.erp.uniqueCode}</Label>
                        <Input 
                          placeholder={t.erp.skuPlaceholder}
                          value={newProduct.sku}
                          onChange={e => setNewProduct({...newProduct, sku: e.target.value.toUpperCase()})}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>{t.erp.imageUrlOptional}</Label>
                        <div className="flex gap-2">
                            <Input 
                              placeholder={t.erp.imagePlaceholder}
                              value={newProduct.image_url}
                              onChange={e => setNewProduct({...newProduct, image_url: e.target.value})}
                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setNewProduct({...newProduct, image_url: `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&auto=format&fit=crop&q=60`})}
                                title={t.erp.generateExample}
                            >
                                🎲
                            </Button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">{t.erp.registerProduct}</Button>
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
                        <th className="p-4 font-medium">{t.erp.product}</th>
                        <th className="p-4 font-medium">{t.erp.sku}</th>
                        <th className="p-4 font-medium text-center">{t.erp.channels}</th>
                        <th className="p-4 font-medium text-center">{t.erp.totalStock}</th>
                        <th className="p-4 font-medium text-right">{t.erp.price}</th>
                        <th className="p-4 font-medium text-right">{t.common.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">{t.erp.noProductsInCatalog}</td></tr>
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
                          <td className="p-4 text-right">{language === 'en' ? '$' : 'R$'} {p.price}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleSync(p.sku)} disabled={isSyncing === p.sku}>
                                <RefreshCw className={cn("w-4 h-4 mr-1", isSyncing === p.sku && "animate-spin")} />
                                {t.erp.sync}
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
                <CardHeader><CardTitle>{t.erp.shippingMonitor}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {erpOrders.filter(o => o.status === 'paid' || o.status === 'shipped').length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground italic">{t.erp.noActiveShipments}</div>
                  ) : erpOrders.filter(o => o.status === 'paid' || o.status === 'shipped').map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-4 border rounded-xl bg-card">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><Truck className="w-5 h-5" /></div>
                        <div>
                          <p className="font-bold text-sm">{t.erp.order} {o.external_id}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {o.customer_name} • {o.shipping_info?.tracking_code || t.erp.awaitingTracking}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={o.status === 'shipped' ? 'default' : 'secondary'} className="text-[10px]">
                            {o.status === 'shipped' ? t.erp.shipped : t.erp.awaitingShipment}
                        </Badge>
                        {o.status === 'paid' && (
                            <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleUpdateShipping(o.id)}>
                                {t.erp.dispatch}
                            </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-indigo-600 text-white">
                <CardHeader><CardTitle>{t.erp.shipContract}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm opacity-90 mb-4">{t.erp.discountNotice.replace('{discount}', '-45%').replace('{thisMonth}', t.erp.thisMonth)}</p>
                  <div className="flex items-center gap-2 text-xl font-bold"><ShieldCheck className="w-6 h-6" /> {t.erp.fullProtection}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="supplies" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t.erp.b2bSupplyManagement}</h2>
                <div className="flex gap-2">
                    <Dialog open={isNewSupplierModalOpen} onOpenChange={setIsNewSupplierModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> {t.erp.newSupplier}</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t.erp.registerSupplier}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateSupplier} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>{t.erp.companyNameSocialReason}</Label>
                                    <Input value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t.erp.contact}</Label>
                                        <Input value={newSupplier.contact_name} onChange={e => setNewSupplier({...newSupplier, contact_name: e.target.value})} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t.common.emailLabel}</Label>
                                        <Input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">{t.erp.saveSupplier}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isNewPOModalOpen} onOpenChange={setIsNewPOModalOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> {t.erp.newPurchaseOrder}</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t.erp.newPurchaseOrderPO}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreatePO} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>{t.erp.supplier}</Label>
                                    <Select value={newPO.supplier_id} onValueChange={val => setNewPO({...newPO, supplier_id: val})}>
                                        <SelectTrigger><SelectValue placeholder={t.common.select + "..."} /></SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t.erp.totalAmount.replace('{currency}', language === 'en' ? '$' : 'R$')}</Label>
                                        <Input type="number" value={newPO.total_amount} onChange={e => setNewPO({...newPO, total_amount: parseFloat(e.target.value)})} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t.erp.deliveryForecast}</Label>
                                        <Input type="date" value={newPO.expected_date} onChange={e => setNewPO({...newPO, expected_date: e.target.value})} required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">{t.erp.generatePO}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
              <CardHeader><CardTitle>{t.erp.recentPurchaseOrders}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchaseOrders.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground italic">{t.erp.noPurchaseOrdersRegistered}</div>
                  ) : purchaseOrders.map(po => (
                    <div key={po.id} className="flex justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-bold">{po.ref}</p>
                        <p className="text-xs text-muted-foreground">{po.suppliers?.name} • {t.common.value}: {language === 'en' ? '$' : 'R$'} {po.total_amount}</p>
                      </div>
                      <Badge variant={po.status === 'received' ? 'default' : 'outline'}>{po.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crm" className="space-y-4">
            {/* KPI Cards B2B */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs font-medium text-muted-foreground">{t.erp.b2bPartnersCount}</p>
                  <h3 className="text-2xl font-bold mt-1">{b2bStats?.totalPartners ?? 0}</h3>
                  <p className="text-xs text-muted-foreground mt-2">{t.erp.recurringBuyersLabel}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs font-medium text-muted-foreground">{t.erp.b2bTotalGMV}</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {language === 'en' ? '$' : 'R$'}{' '}
                    {(b2bStats?.totalGMV ?? 0).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2">{t.erp.totalVolumeLabel}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs font-medium text-muted-foreground">{t.erp.avgTicketLabel}</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {language === 'en' ? '$' : 'R$'}{' '}
                    {(b2bStats?.avgOrderValue ?? 0).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2">{t.erp.perOrderLabel}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs font-medium text-muted-foreground">{t.erp.activeThisMonthLabel}</p>
                  <h3 className="text-2xl font-bold mt-1">{b2bStats?.activeThisMonth ?? 0}</h3>
                  <p className="text-xs text-muted-foreground mt-2">{t.erp.customersWithPurchase}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Parceiros */}
            <Card>
              <CardHeader>
                <CardTitle>{t.erp.topB2BPartnersTitle}</CardTitle>
                <CardDescription>{t.erp.recurringBuyersDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                {!b2bStats?.partners?.length ? (
                  <div className="text-center p-12 text-muted-foreground border rounded-xl border-dashed flex flex-col items-center gap-2">
                    <Users2 className="w-8 h-8 opacity-20" />
                    <p className="font-medium">{t.erp.noB2BPartnersYet}</p>
                    <p className="text-xs">{t.erp.autoIdentifyB2BHint}</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-left border-b">
                          <th className="p-4 font-medium w-8">#</th>
                          <th className="p-4 font-medium">{t.erp.client}</th>
                          <th className="p-4 font-medium text-center">{t.erp.orders}</th>
                          <th className="p-4 font-medium text-right">{t.erp.totalVolumeColumn}</th>
                          <th className="p-4 font-medium text-right">{t.erp.avgTicketColumn}</th>
                          <th className="p-4 font-medium text-right">{t.erp.lastPurchaseDate}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b2bStats.partners.map((partner, i) => (
                          <tr key={partner.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-4 text-muted-foreground font-bold">{i + 1}</td>
                            <td className="p-4 font-medium">{partner.name}</td>
                            <td className="p-4 text-center">
                              <Badge variant="outline">{partner.orderCount}</Badge>
                            </td>
                            <td className="p-4 text-right font-bold text-green-600">
                              {language === 'en' ? '$' : 'R$'}{' '}
                              {partner.totalSpend.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-right">
                              {language === 'en' ? '$' : 'R$'}{' '}
                              {(partner.totalSpend / partner.orderCount).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-right text-xs text-muted-foreground">
                              {new Date(partner.lastOrder).toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </ModuleGuard>
  )
}
