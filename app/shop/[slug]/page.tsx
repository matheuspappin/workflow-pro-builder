"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getStoreBySlug, type MarketplaceSettings } from "@/lib/actions/marketplace"
import { createERPOrder } from "@/lib/actions/erp"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ShoppingBag, Loader2, Menu, X, ChevronRight, Search } from "lucide-react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function ShopPage() {
  const params = useParams()
  const { toast } = useToast()
  const slug = params?.slug as string
  
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<MarketplaceSettings | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<{product: any, qty: number}[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '' })
  const [processing, setProcessing] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Todos")

  useEffect(() => {
    const loadStore = async () => {
      if (slug) {
        const data = await getStoreBySlug(slug)
        if (data) {
          setStore(data.store)
          setProducts(data.products || [])
        }
      }
      setLoading(false)
    }
    loadStore()
  }, [slug])

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      if (existing.qty < product.quantity) {
        setCart(cart.map(item => item.product.id === product.id ? {...item, qty: item.qty + 1} : item))
        toast({ title: "Carrinho atualizado", description: "Quantidade aumentada." })
      } else {
        toast({ title: "Limite atingido", description: "Estoque máximo no carrinho.", variant: "destructive" })
      }
    } else {
      setCart([...cart, { product, qty: 1 }])
      toast({ title: "Adicionado", description: `${product.name} está na sacola.` })
    }
    setIsCheckoutOpen(true) // Abre o carrinho/checkout ao adicionar (comportamento Nike)
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.selling_price * item.qty), 0)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return
    setProcessing(true)

    try {
      const orderItemsList = cart.map(item => ({
        product_id: item.product.id,
        qty: item.qty,
        price: item.product.selling_price,
        sku: item.product.sku
      }))

      const checkoutSession = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          line_items, 
          customerInfo, 
          storeId: store.studio_id,
          orderItems: orderItemsList,
          totalAmount: cartTotal
        }),
      }).then(res => res.json());

      if (checkoutSession.url) {
        window.location.href = checkoutSession.url;
      } else {
        throw new Error('Failed to create Stripe checkout session.');
      }

      await createERPOrder(store.studio_id, {
        customer_name: `${customerInfo.name} (${customerInfo.phone})`,
        total_amount: cartTotal,
        items: orderItemsList
      })

      toast({ 
        title: "Pedido Confirmado", 
        description: `Obrigado! Enviamos a confirmação para ${customerInfo.email}.` 
      })
      
      setCart([])
      setIsCheckoutOpen(false)
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível processar o pedido.", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>

  if (!store) return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-4 bg-white">
      <h1 className="text-4xl font-black tracking-tighter mb-4">LOJA NÃO ENCONTRADA</h1>
      <p className="text-gray-500">Verifique a URL digitada.</p>
    </div>
  )

  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category || 'Geral')))]
  const filteredProducts = activeCategory === "Todos" ? products : products.filter(p => p.category === activeCategory)

  // Style Variables
  const primaryColor = store.primary_color || '#000000'
  const buttonStyle = store.style_config?.buttonStyle || 'rounded' // 'rounded', 'pill', 'square'
  
  const getButtonClass = () => {
    if (buttonStyle === 'pill') return 'rounded-full'
    if (buttonStyle === 'square') return 'rounded-none'
    return 'rounded-md'
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-gray-200">
      
      {/* Navigation (Nike Style: Clean, Sticky) */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="font-black text-2xl tracking-tighter uppercase cursor-pointer">
              {store.store_name}
            </div>
            {/* Desktop Menu */}
            <div className="hidden md:flex gap-6 text-sm font-medium text-gray-500">
              {categories.slice(0, 5).map(c => (
                 <button 
                    key={c} 
                    onClick={() => setActiveCategory(c)}
                    className={`hover:text-black transition-colors ${activeCategory === c ? 'text-black' : ''}`}
                 >
                   {c}
                 </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            <button 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              onClick={() => setIsCheckoutOpen(true)}
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute top-1 right-0 w-4 h-4 bg-black text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </button>
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger><Menu className="w-6 h-6" /></SheetTrigger>
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle className="text-left font-black text-xl uppercase">{store.store_name}</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col gap-4 mt-8">
                             {categories.map(c => (
                                <button 
                                    key={c} 
                                    onClick={() => setActiveCategory(c)}
                                    className="text-left font-medium text-lg hover:text-gray-500"
                                >
                                {c}
                                </button>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section (Impactful) */}
      <div className="relative w-full h-[60vh] md:h-[70vh] bg-gray-100 overflow-hidden flex items-center justify-center">
        {store.banner_url ? (
            <img 
                src={store.banner_url} 
                alt="Banner" 
                className="absolute inset-0 w-full h-full object-cover"
            />
        ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-100" />
        )}
        
        <div className="relative z-10 text-center px-4 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-black drop-shadow-sm uppercase">
            {store.style_config?.welcomeTitle || 'NOVA COLEÇÃO'}
          </h1>
          <p className="text-lg md:text-xl text-gray-700 font-medium mb-8 max-w-2xl mx-auto">
            {store.style_config?.welcomeSubtitle || 'Performance e estilo para o seu movimento.'}
          </p>
          <Button 
            size="lg" 
            className={`px-8 h-12 text-base font-bold transition-transform hover:scale-105 ${getButtonClass()}`}
            style={{ backgroundColor: primaryColor }}
          >
            Comprar Agora
          </Button>
        </div>
      </div>

      {/* Product Grid (Nike Style: Clean, Large Images) */}
      <main className="container mx-auto px-4 py-16">
        <div className="flex items-baseline justify-between mb-8 border-b pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Produtos ({filteredProducts.length})</h2>
            <div className="flex gap-2">
               {/* Sort/Filter placeholders could go here */}
            </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Nenhum produto encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {filteredProducts.map(product => (
              <div key={product.id} className="group cursor-pointer">
                {/* Image Container */}
                <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-sm">
                    {product.image_url ? (
                        <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">Sem Imagem</div>
                    )}
                    
                    {/* Hover Action */}
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                         <Button 
                            className={`w-full shadow-lg ${getButtonClass()}`} 
                            style={{ backgroundColor: primaryColor }}
                            onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                            }}
                            disabled={product.quantity <= 0}
                         >
                            {product.quantity > 0 ? 'Adicionar à Sacola' : 'Esgotado'}
                         </Button>
                    </div>

                    {product.quantity <= 0 && (
                        <div className="absolute top-2 right-2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 uppercase">
                            Esgotado
                        </div>
                    )}
                     {product.quantity > 0 && product.quantity < 5 && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase">
                            Últimas Unidades
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-1">
                    <h3 className="font-medium text-base text-gray-900 leading-tight group-hover:underline decoration-1 underline-offset-2">
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    <p className="font-bold text-base mt-1">R$ {product.selling_price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Minimalista */}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
                <h2 className="text-2xl font-black tracking-tighter uppercase mb-4">{store.store_name}</h2>
                <p className="text-gray-400 text-sm max-w-md">
                    Parte da rede DanceFlow AI. Trazendo os melhores produtos do mercado diretamente do seu estúdio favorito para sua casa.
                </p>
            </div>
            <div>
                <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Ajuda</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li className="hover:text-white cursor-pointer">Status do Pedido</li>
                    <li className="hover:text-white cursor-pointer">Envios e Entregas</li>
                    <li className="hover:text-white cursor-pointer">Devoluções</li>
                    <li className="hover:text-white cursor-pointer">Fale Conosco</li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Sobre</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li className="hover:text-white cursor-pointer">Nossa História</li>
                    <li className="hover:text-white cursor-pointer">Termos de Uso</li>
                    <li className="hover:text-white cursor-pointer">Privacidade</li>
                </ul>
            </div>
        </div>
        <div className="container mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
            <p>&copy; 2026 {store.store_name}. Todos os direitos reservados.</p>
            <p>Powered by DanceFlow AI</p>
        </div>
      </footer>

      {/* Checkout Sidebar (Nike Style Bag) */}
      <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
            <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-xl font-bold">Sua Sacola ({cart.reduce((a, b) => a + b.qty, 0)})</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto py-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-500">
                        <ShoppingBag className="w-12 h-12 opacity-20" />
                        <p>Sua sacola está vazia.</p>
                        <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Começar a comprar</Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="w-24 h-24 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0">
                                     {item.product.image_url ? (
                                        <img src={item.product.image_url} className="w-full h-full object-cover" />
                                     ) : <div className="w-full h-full bg-gray-200" />}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between">
                                            <h4 className="font-medium line-clamp-2 pr-4">{item.product.name}</h4>
                                            <p className="font-bold">R$ {item.product.selling_price.toFixed(2)}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{item.product.category}</p>
                                        <p className="text-sm text-gray-500">Qtd: {item.qty}</p>
                                    </div>
                                    <button 
                                        className="text-sm text-gray-400 hover:text-red-500 text-left underline decoration-1 underline-offset-2"
                                        onClick={() => removeFromCart(item.product.id)}
                                    >
                                        Remover
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {cart.length > 0 && (
                <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 text-center">Frete e impostos calculados no checkout.</p>
                    
                    {/* Checkout Form embedded inside Sheet for simplicity or Modal trigger */}
                    <Dialog>
                        <DialogContent>
                             <DialogHeader><DialogTitle>Finalizar Pedido</DialogTitle></DialogHeader>
                             <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Nome Completo</Label>
                                    <Input required value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Ex: João Silva" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>E-mail</Label>
                                    <Input type="email" required value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} placeholder="joao@email.com" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>WhatsApp</Label>
                                    <Input required value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} placeholder="(11) 99999-9999" />
                                </div>
                             </form>
                             <DialogFooter>
                                <Button type="submit" form="checkout-form" disabled={processing} className="w-full h-12 text-base" style={{ backgroundColor: primaryColor }}>
                                    {processing ? <Loader2 className="animate-spin" /> : `Pagar R$ ${cartTotal.toFixed(2)}`}
                                </Button>
                             </DialogFooter>
                        </DialogContent>
                        {/* Trigger Button inside Sheet */}
                        <div className="grid gap-2">
                             {/* Hacky way to trigger the nested Dialog from the button, usually separate state is better but this keeps it contained */}
                             <Button 
                                className={`w-full h-14 text-base font-bold ${getButtonClass()}`} 
                                style={{ backgroundColor: primaryColor }}
                                onClick={() => {
                                    // In a real app we'd close the sheet and open the modal properly via state
                                    // For now we render the Dialog Trigger around this button or use a separate state
                                    // Let's use the separate state approach in next iteration if needed, 
                                    // but for now I'll implement the checkout form DIRECTLY in the sheet to be even more "Nike mobile" style
                                }}
                             >
                                 Finalizar Compra
                             </Button>
                             {/* NOTE: Re-implementing the form trigger properly below */}
                        </div>
                    </Dialog>
                    
                    {/* Checkout Accordion / Form Direct Implementation for better UX */}
                     <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold mb-3 text-sm uppercase text-gray-500">Dados para Pagamento</h4>
                        <form id="drawer-checkout" onSubmit={handleCheckout} className="space-y-3">
                             <Input className="bg-white" required value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Nome Completo" />
                             <Input className="bg-white" type="email" required value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} placeholder="E-mail" />
                             <Input className="bg-white" required value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} placeholder="WhatsApp" />
                             <Button type="submit" disabled={processing} className={`w-full h-12 font-bold mt-2 ${getButtonClass()}`} style={{ backgroundColor: primaryColor }}>
                                 {processing ? <Loader2 className="animate-spin" /> : `Pagar R$ ${cartTotal.toFixed(2)}`}
                             </Button>
                        </form>
                    </div>
                </div>
            )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
