"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, DollarSign, Camera, 
  Trash2, CreditCard, Banknote, QrCode, Loader2,
  Check
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  getInventory, getProductBySku, Product
} from "@/lib/actions/inventory"
import { processPosPayment, createPosStripeSession } from "@/lib/actions/pos"
import { getStudents } from "@/lib/database-utils"
import { getPendingServiceOrders } from "@/lib/actions/service-orders"
import { BarcodeScanner } from "@/components/dashboard/barcode-scanner"
import { ModuleGuard } from "@/components/providers/module-guard"
import { useOrganization } from "@/components/providers/organization-provider"
import { useSearchParams, useRouter } from "next/navigation"

export default function POSPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { vocabulary, t, language, businessModel, studioId: orgStudioId } = useOrganization()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState<string | null>(null)
  const [pendingOS, setPendingOS] = useState<any[]>([])
  
  // Modais
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | 'pix' | null>(null)
  
  // PDV / Carrinho
  const [cart, setCart] = useState<{product: any, quantity: number, type: 'product' | 'service_order'}[]>([])
  const [isFinalizingSale, setIsFinalizingSale] = useState(false)
  
  // Clientes
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  
  // Busca
  const [pdvSearchInput, setPdvSearchInput] = useState("")
  const [osSearchInput, setOsSearchInput] = useState("")
  const [showPdvResults, setShowPdvResults] = useState(false)
  const [amountReceived, setAmountReceived] = useState<number>(0)
  const [change, setChange] = useState<number>(0)

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({ title: "Pagamento confirmado!", description: "A venda foi processada com sucesso via Stripe." })
      setCart([])
      router.replace('/dashboard/vendas')
    } else if (searchParams.get('canceled') === 'true') {
      toast({ title: "Pagamento cancelado", description: "O pagamento via Stripe não foi concluído.", variant: "destructive" })
      router.replace('/dashboard/vendas')
    }
  }, [searchParams])

  // Resolver studioId: OrganizationProvider (workflow_pro) ou danceflow_user (legado)
  useEffect(() => {
    if (orgStudioId) {
      setStudioId(orgStudioId)
      return
    }
    const userStr = localStorage.getItem("danceflow_user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setStudioId(user.studioId || user.studio_id || null)
      } catch {
        setStudioId(null)
      }
    } else {
      setStudioId(null)
    }
  }, [orgStudioId])

  useEffect(() => {
    if (studioId) fetchData()
  }, [studioId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const inventory = await getInventory(studioId!)
      const studentsData = await getStudents({ studioId: studioId!, limit: 100 })
      const osData = await getPendingServiceOrders(studioId!)
      
      setProducts(inventory.products)
      setStudents(studentsData.data)
      setPendingOS(osData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `${language === 'en' ? '$' : 'R$'} ${price.toFixed(2)}`
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.type === 'product')
      if (existing) {
        return prev.map(item => 
          (item.product.id === product.id && item.type === 'product') ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1, type: 'product' }]
    })
    toast({ title: "Adicionado", description: product.name })
  }

  const addOSToCart = (os: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === os.id && item.type === 'service_order')
      if (existing) return prev
      return [...prev, { 
        product: {
          id: os.id,
          name: `OS #${os.tracking_code} - ${os.customer?.name || 'Cliente'}`,
          selling_price: os.total_amount,
          price_in_credits: os.total_amount
        }, 
        quantity: 1, 
        type: 'service_order' 
      }]
    })
    if (os.customer_id) setSelectedStudentId(os.customer_id)
    toast({ title: "OS Adicionada", description: `#${os.tracking_code}` })
  }

  const handleFinalizeSale = async (forcedMethod?: 'money' | 'card' | 'pix' | 'credit') => {
    const method = forcedMethod || paymentMethod || (businessModel === 'MONETARY' ? 'money' : 'credit');
    
    if (!method) {
      toast({ title: "Selecione o pagamento", variant: "destructive" })
      return
    }
    
    setIsFinalizingSale(true)
    try {
      const items = cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        priceInCredits: (item.product as any).price_in_credits || 0,
        priceInCurrency: item.product.selling_price || 0,
        quantity: item.quantity,
        type: item.type as any
      }))

      // Se for PIX ou CARTÃO, abre o Stripe (Frente de Caixa Mercantil)
      if (method === 'pix' || method === 'card') {
        const { url } = await createPosStripeSession(
          studioId!,
          selectedStudentId === 'none' ? null : selectedStudentId,
          items,
          method,
          window.location.origin
        )
        if (url) {
          window.location.href = url
          return 
        }
      }

      // Para DINHEIRO ou CRÉDITO, segue o fluxo normal de registro
      const result = await processPosPayment(
        studioId!,
        selectedStudentId === 'none' ? null : selectedStudentId,
        items,
        method
      )

      if (!result.success) throw new Error(result.message)

      toast({ title: t.common.success || "Venda finalizada!" })
      setCart([])
      setIsPaymentModalOpen(false)
      setPaymentMethod(null)
      setAmountReceived(0)
      setChange(0)
      fetchData()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setIsFinalizingSale(false)
    }
  }

  return (
    <ModuleGuard module="pos" showFullError>
      <div className="min-h-screen bg-background flex flex-col">
        <Header title={`Ponto de Venda (PDV) - ${vocabulary.establishment}`} />
        
        <BarcodeScanner 
          isOpen={isScannerOpen} 
          onClose={() => setIsScannerOpen(false)} 
          onScanSuccess={async (sku) => {
            if (!studioId) {
              toast({ title: "Erro", description: "Estúdio não identificado. Faça login e vincule-se a um estúdio.", variant: "destructive" })
              return
            }
            try {
              const prod = await getProductBySku(sku, studioId)
              if (prod) addToCart(prod)
              else toast({ title: "Não encontrado", variant: "destructive" })
            } catch (err: any) {
              toast({ title: "Erro", description: err?.message || "Não foi possível buscar o produto.", variant: "destructive" })
            }
          }} 
        />

        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 space-y-6">
            {/* BUSCA */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar produto ou bipar SKU..." 
                  className="pl-9 h-12"
                  value={pdvSearchInput}
                  onChange={(e) => setPdvSearchInput(e.target.value)}
                />
              </div>
              <Button type="button" size="lg" className="h-12" onClick={() => setIsScannerOpen(true)}>
                <Camera className="w-5 h-5 mr-2" /> Escanear
              </Button>
            </div>

            {/* PRODUTOS RÁPIDOS */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Produtos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                {products.filter(p =>
                  p.quantity > 0 &&
                  (pdvSearchInput.trim() === '' ||
                    p.name?.toLowerCase().includes(pdvSearchInput.toLowerCase()) ||
                    p.sku?.toLowerCase().includes(pdvSearchInput.toLowerCase()))
                ).map(p => (
                  <Card key={p.id} className="hover:border-primary cursor-pointer transition-all" onClick={() => addToCart(p)}>
                    <CardContent className="p-4 text-center">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      <p className="text-primary font-bold">{formatPrice(p.selling_price)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* OS PENDENTES */}
            {pendingOS.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">OS Pendentes de Pagamento</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input 
                      placeholder="Filtrar por nome ou código..." 
                      className="pl-7 h-8 text-xs"
                      value={osSearchInput}
                      onChange={(e) => setOsSearchInput(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {pendingOS
                    .filter(os => 
                      os.tracking_code?.toLowerCase().includes(osSearchInput.toLowerCase()) || 
                      os.customer?.name?.toLowerCase().includes(osSearchInput.toLowerCase())
                    )
                    .map(os => (
                      <Card key={os.id} className="hover:border-indigo-500 cursor-pointer border-l-4 border-l-indigo-500 transition-all" onClick={() => addOSToCart(os)}>
                        <CardContent className="p-4 flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">OS #{os.tracking_code}</p>
                            <p className="text-xs text-muted-foreground truncate">{os.customer?.name || 'Cliente Avulso'}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-indigo-600 font-bold">{formatPrice(os.total_amount)}</p>
                            <Badge variant="outline" className="text-[10px] capitalize">{os.status.replace('_', ' ')}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* CARRINHO */}
          <Card className="lg:col-span-4 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex justify-between">
                <span>Carrinho</span>
                <Badge>{cart.length} itens</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              <Select onValueChange={setSelectedStudentId} value={selectedStudentId || ''}>
                <SelectTrigger><SelectValue placeholder="Vincular Cliente (Opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Venda Avulsa</SelectItem>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>

              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between items-center p-2 border rounded-lg">
                  <div className="flex-1 truncate mr-2">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(item.product.selling_price)} x {item.quantity}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
            <div className="p-4 border-t space-y-4">
              <div className="flex justify-between text-xl font-black">
                <span>TOTAL</span>
                <span>{formatPrice(cart.reduce((acc, i) => acc + (i.product.selling_price * i.quantity), 0))}</span>
              </div>
              <Button 
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700" 
                disabled={cart.length === 0 || isFinalizingSale}
                onClick={() => setIsPaymentModalOpen(true)}
              >
                {isFinalizingSale ? <Loader2 className="animate-spin mr-2" /> : <DollarSign className="w-6 h-6 mr-2" />}
                FECHAR VENDA
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* PAGAMENTO */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Finalizar Venda</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
              <span className="font-medium">Total a pagar:</span>
              <span className="text-2xl font-black">{formatPrice(cart.reduce((acc, i) => acc + (i.product.selling_price * i.quantity), 0))}</span>
            </div>

            <div className="grid gap-4">
              <Button type="button" variant={paymentMethod === 'money' ? 'default' : 'outline'} className="h-16 justify-start gap-4" onClick={() => setPaymentMethod('money')}>
                <Banknote className="w-8 h-8" /> Dinheiro
              </Button>
              <Button type="button" variant="outline" className="h-16 justify-start gap-4" onClick={() => handleFinalizeSale('pix')}>
                <QrCode className="w-8 h-8" /> PIX (Stripe)
              </Button>
              <Button type="button" variant="outline" className="h-16 justify-start gap-4" onClick={() => handleFinalizeSale('card')}>
                <CreditCard className="w-8 h-8" /> Cartão (Stripe)
              </Button>
            </div>

            {paymentMethod === 'money' && (
              <div className="space-y-4 p-4 border rounded-xl bg-accent/50 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                  <Label>Valor Recebido</Label>
                  <Input 
                    type="number" 
                    className="w-32 text-right font-bold" 
                    placeholder="0.00"
                    value={amountReceived || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0
                      setAmountReceived(val)
                      const total = cart.reduce((acc, i) => acc + (i.product.selling_price * i.quantity), 0)
                      setChange(Math.max(0, val - total))
                    }}
                  />
                </div>
                {amountReceived > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-green-600">
                    <span>Troco:</span>
                    <span>{formatPrice(change)}</span>
                  </div>
                )}
                <Button type="button" className="w-full h-12 bg-green-600 hover:bg-green-700" onClick={() => handleFinalizeSale('money')} disabled={isFinalizingSale}>
                  {isFinalizingSale ? <Loader2 className="animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Confirmar e Finalizar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ModuleGuard>
  )
}
