"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Search, Package, TrendingUp, AlertTriangle, 
  ArrowDownCircle, ArrowUpCircle, ShoppingCart, DollarSign, Archive, Camera
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  getInventory, createProduct, registerTransaction, getRecentTransactions, Product, Transaction, getProductBySku, updateProduct, deleteProduct
} from "@/lib/actions/inventory"
import { getStudents } from "@/lib/database-utils"
import { BarcodeScanner } from "@/components/dashboard/barcode-scanner"
import { GLOBAL_SKU_LIST, type GlobalSku } from "@/lib/constants/global-skus"
import { searchNcm, type Ncm } from "@/lib/services/brasil-api"
import { validateGTIN } from "@/lib/validation-utils"
import { MoreHorizontal, Trash2, Edit2, User, CreditCard, Banknote, QrCode, RefreshCw } from "lucide-react"
import { ModuleGuard } from "@/components/providers/module-guard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useVocabulary } from "@/hooks/use-vocabulary"

export default function InventoryPage() {
  const { toast } = useToast()
  const { vocabulary } = useVocabulary()
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({ totalItems: 0, totalSalesValue: 0, potentialProfit: 0 })
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState<string | null>(null)
  
  // Modais
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  const [isTransactionOpen, setIsTransactionOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<'in' | 'sale'>('sale')
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  
  // PDV / Carrinho
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([])
  const [isFinalizingSale, setIsFinalizingSale] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | 'pix' | null>(null)
  
  // Alunos para associação
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentSearch, setStudentSearch] = useState("")
  
  // Busca PDV
  const [pdvSearchInput, setPdvSearchInput] = useState("")
  const [showPdvResults, setShowPdvResults] = useState(false)
  
  // Formulários
  const [newProduct, setNewProduct] = useState({ name: "", category: "Bebidas", min_quantity: 5, quantity: 0, cost_price: 0, selling_price: 0, sku: "", ncm: "" })
  const [skuSearchQuery, setSkuSearchQuery] = useState("")
  const [showSkuGlobalResults, setShowSkuGlobalResults] = useState(false)
  const [ncmSearchQuery, setNcmSearchQuery] = useState("")
  const [ncmResults, setNcmResults] = useState<Ncm[]>([])
  const [showNcmResults, setShowNcmResults] = useState(false)
  const [transactionData, setTransactionData] = useState({ quantity: 1, reason: "", costPrice: 0 })

  useEffect(() => {
    const userStr = localStorage.getItem("danceflow_user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setStudioId(user.studioId || user.studio_id)
    }
  }, [])

  useEffect(() => {
    if (studioId) fetchData()
  }, [studioId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const inventory = await getInventory(studioId!)
      const history = await getRecentTransactions(studioId!)
      const studentsData = await getStudents({ studioId: studioId!, limit: 100 })
      setProducts(inventory.products)
      setStats(inventory.stats as any)
      setTransactions(history)
      setStudents(studentsData.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async () => {
    // Validação de Duplicidade
    if (newProduct.sku) {
      const existing = await getProductBySku(newProduct.sku, studioId!)
      if (existing) {
        // Se já existe, perguntar se quer adicionar estoque
        if (confirm(`O produto "${existing.name}" já está cadastrado com este SKU.\n\nDeseja adicionar estoque a ele ao invés de criar um novo?`)) {
          setIsNewProductOpen(false)
          setSelectedProduct(existing.id)
          setTransactionType('in')
          // Passamos o preço de custo e a QUANTIDADE informada no cadastro
          setTransactionData({ 
            quantity: newProduct.quantity || 1, 
            reason: "Entrada via Cadastro (Merge)", 
            costPrice: newProduct.cost_price 
          })
          setIsTransactionOpen(true)
        }
        return // Abortar criação
      }
    }

    try {
      await createProduct(newProduct, studioId!)
      toast({ title: "Produto cadastrado!" })
      setIsNewProductOpen(false)
      fetchData()
    } catch (error) {
      toast({ title: "Erro ao criar produto", variant: "destructive" })
    }
  }

  const handleOpenPaymentModal = () => {
    if (cart.length === 0) return
    setIsPaymentModalOpen(true)
  }

  const handleFinalizeSaleWithPayment = async () => {
    if (!paymentMethod) {
      toast({ title: "Selecione um método de pagamento", variant: "destructive" })
      return
    }
    setIsFinalizingSale(true)
    try {
      for (const item of cart) {
        await registerTransaction(
          item.product.id,
          'sale',
          item.quantity,
          'Venda PDV Local',
          studioId!,
          undefined,
          paymentMethod, // Passar o método de pagamento
          selectedStudentId || undefined // Passar o ID do aluno
        )
      }
      toast({ title: "Venda finalizada com sucesso!", description: `${cart.length} itens vendidos.` })
      setCart([])
      setPaymentMethod(null)
      setSelectedStudentId(null)
      setIsPaymentModalOpen(false)
      fetchData()
    } catch (error: any) {
      toast({ 
        title: "Erro ao finalizar venda", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setIsFinalizingSale(false)
    }
  }

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.1)
    } catch (e) {
      console.warn("Audio feedback failed")
    }
  }

  const handleEditClick = (product: Product) => {
    setEditingProduct(product)
    setIsEditProductOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingProduct) return
    try {
      await updateProduct(editingProduct.id, editingProduct, studioId!)
      toast({ title: "Produto atualizado!" })
      setIsEditProductOpen(false)
      fetchData()
    } catch (error) {
      toast({ title: "Erro ao atualizar produto", variant: "destructive" })
    }
  }

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId)
    setIsDeleteAlertOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return
    try {
      await deleteProduct(productToDelete, studioId!)
      toast({ title: "Produto removido!" })
      setIsDeleteAlertOpen(false)
      fetchData()
    } catch (error) {
      toast({ title: "Erro ao remover produto", variant: "destructive" })
    }
  }

  const handleTransaction = async () => {
    try {
      const reason = transactionData.reason || (transactionType === 'sale' ? 'Venda Balcão' : 'Compra Fornecedor')
      // Se for entrada, passamos o costPrice se tiver sido preenchido
      const price = transactionType === 'in' && transactionData.costPrice > 0 ? transactionData.costPrice : undefined
      
      await registerTransaction(selectedProduct, transactionType, transactionData.quantity, reason, studioId!, price)
      
      toast({ title: "Movimentação registrada com sucesso!" })
      setIsTransactionOpen(false)
      setTransactionData({ quantity: 1, reason: "", costPrice: 0 }) // Reset
      fetchData()
    } catch (error: any) {
      toast({ title: "Erro na movimentação", description: error.message, variant: "destructive" })
    }
  }

  // Lógica do Carrinho / PDV
  const addToCart = (product: Product) => {
    playBeep()
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    toast({ title: "Adicionado ao carrinho", description: product.name })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ))
  }

  const finalizeSale = async () => {
    if (cart.length === 0) return
    setIsFinalizingSale(true)
    try {
      for (const item of cart) {
        await registerTransaction(
          item.product.id,
          'sale',
          item.quantity,
          'Venda PDV Local',
          studioId!
        )
      }
      toast({ title: "Venda finalizada com sucesso!", description: `${cart.length} itens vendidos.` })
      setCart([])
      fetchData()
    } catch (error: any) {
      toast({ 
        title: "Erro ao finalizar venda", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setIsFinalizingSale(false)
    }
  }

  const fetchExternalProduct = async (sku: string) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${sku}.json`)
      const data = await res.json()
      return data.status === 1 ? data.product : null
    } catch (e) {
      console.error("Erro na API externa:", e)
      return null
    }
  }

  const handleSkuBlur = async () => {
    if (!newProduct.sku) return
    
    // Feedback visual
    toast({ title: "Buscando informações..." })

    // 0. Tentar Base Global Local (Mais rápido)
    const localMatch = GLOBAL_SKU_LIST.find(item => item.sku === newProduct.sku)
    if (localMatch) {
      setNewProduct(prev => ({
        ...prev,
        name: localMatch.name,
        category: localMatch.category,
        selling_price: localMatch.suggested_price || prev.selling_price
      }))
      toast({ title: "Produto encontrado na base rápida!", description: localMatch.name })
      return
    }

    // 0. Tentar buscar na base interna estática (Mais rápido)
    const internalMatch = GLOBAL_SKU_LIST.find(p => p.sku === newProduct.sku);
    if (internalMatch) {
      setNewProduct(prev => ({
        ...prev,
        name: internalMatch.name,
        category: internalMatch.category,
        selling_price: internalMatch.suggested_price || prev.selling_price
      }));
      toast({ title: "Produto encontrado na base rápida!", description: internalMatch.name });
      return;
    }

    // 1. Tentar API Externa
    const productData = await fetchExternalProduct(newProduct.sku)
    
    if (productData) {
      setNewProduct(prev => ({
        ...prev,
        name: productData.product_name || prev.name,
        // image_url: productData.image_url || prev.image_url, // Se tiver campo de imagem no futuro
        category: "Alimentos" // Sugestão
      }))
      toast({ title: "Produto encontrado!", description: productData.product_name })
    } else {
      toast({ title: "Produto não encontrado na base global", description: "Preencha manualmente." })
    }
  }

  const handleScanSuccess = async (decodedText: string) => {
    // 1. Tentar encontrar produto no estoque
    const existingProduct = await getProductBySku(decodedText, studioId!)
    
    if (existingProduct) {
      // Adicionar direto ao carrinho no PDV
      addToCart(existingProduct)
    } else {
      // 2. Se não achou, abrir modal de cadastro pré-preenchido
      setNewProduct(prev => ({ ...prev, sku: decodedText }))
      
      // Tentar buscar na base interna primeiro
      const internalMatch = GLOBAL_SKU_LIST.find(p => p.sku === decodedText);
      if (internalMatch) {
         setNewProduct(prev => ({
           ...prev,
           name: internalMatch.name,
           category: internalMatch.category,
           selling_price: internalMatch.suggested_price || 0,
           quantity: 1
         }));
         toast({ title: "Produto identificado!", description: internalMatch.name });
         setIsNewProductOpen(true);
         return;
      }

      // Tentar buscar info externa
      toast({ title: "Buscando informações do produto..." })
      const productData = await fetchExternalProduct(decodedText)
        
      if (productData) {
        setNewProduct(prev => ({
          ...prev,
          name: productData.product_name || "",
          category: "Alimentos",
          cost_price: 0,
          selling_price: 0,
          quantity: 1 // Sugerir 1 unidade se acabou de escanear algo novo
        }))
        toast({ title: "Dados encontrados!", description: productData.product_name })
      } else {
        toast({ title: "Produto não encontrado na base global", description: "Preencha os dados manualmente." })
      }
      
      setIsNewProductOpen(true)
    }
  }

  const handleNcmSearch = async (query: string) => {
    setNcmSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchNcm(query);
      setNcmResults(results);
      setShowNcmResults(true);
    } else {
      setNcmResults([]);
      setShowNcmResults(false);
    }
  }

  return (
    <ModuleGuard module="pos" showFullError>
      <div className="min-h-screen bg-background flex flex-col">
        <Header title={`PDV Local - Caixa do ${vocabulary.establishment}`} />
        {/* ... restante do código ... */}
      
      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />

      <div className="flex-1 p-6 space-y-6">
        
        {/* TOP PDV BAR - AGILIDADE */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="p-3 bg-primary/10 rounded-full">
                <QrCode className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h2 className="text-lg font-bold">PDV Operacional</h2>
                <p className="text-sm text-muted-foreground">Registre vendas rápidas e gerencie o estoque local.</p>
             </div>
          </div>
          
          <div className="flex flex-1 gap-2 w-full md:w-auto max-w-lg relative group">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Busca rápida (Nome ou SKU)..." 
                className="pl-9 h-12 bg-slate-50 border-primary/20 focus:border-primary transition-all text-base"
                value={pdvSearchInput}
                onChange={(e) => {
                  setPdvSearchInput(e.target.value);
                  setShowPdvResults(true);
                }}
                onFocus={() => setShowPdvResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (pdvSearchInput) {
                      // Tenta achar primeiro por SKU exato
                      const exactSku = products.find(p => p.sku === pdvSearchInput);
                      if (exactSku) {
                        addToCart(exactSku);
                        setPdvSearchInput("");
                        setShowPdvResults(false);
                      } else {
                        handleScanSuccess(pdvSearchInput);
                        setPdvSearchInput("");
                        setShowPdvResults(false);
                      }
                    }
                  }
                  if (e.key === 'Escape') setShowPdvResults(false);
                }}
              />
              
              {/* RESULTADOS DA BUSCA RÁPIDA */}
              {showPdvResults && pdvSearchInput.length >= 2 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border shadow-xl rounded-lg overflow-hidden max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-1">
                  {products
                    .filter(p => 
                      p.name.toLowerCase().includes(pdvSearchInput.toLowerCase()) || 
                      (p.sku && p.sku.includes(pdvSearchInput))
                    )
                    .slice(0, 8)
                    .map(p => (
                      <button
                        key={p.id}
                        className="w-full text-left p-3 hover:bg-primary/5 border-b last:border-0 flex items-center justify-between transition-colors"
                        onClick={() => {
                          addToCart(p);
                          setPdvSearchInput("");
                          setShowPdvResults(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground">SKU: {p.sku || 'N/A'} • Estoque: {p.quantity}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-primary">R$ {p.selling_price.toFixed(2)}</span>
                          <Plus className="w-3 h-3 ml-2 inline text-primary" />
                        </div>
                      </button>
                    ))}
                  {products.filter(p => 
                    p.name.toLowerCase().includes(pdvSearchInput.toLowerCase()) || 
                    (p.sku && p.sku.includes(pdvSearchInput))
                  ).length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground italic">
                      Nenhum produto encontrado. <br/> Pressione Enter para tentar cadastrar.
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Button size="lg" className="h-12 bg-primary hover:bg-primary/90 px-4" onClick={() => setIsScannerOpen(true)}>
              <Camera className="w-5 h-5 mr-2" /> Escanear
            </Button>
          </div>
          
          {/* Overlay para fechar busca ao clicar fora */}
          {showPdvResults && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowPdvResults(false)}
            />
          )}

          <div className="flex gap-2 w-full md:w-auto z-10">
            <Button size="lg" variant="outline" className="flex-1 md:flex-none h-12 border-primary/20 text-primary hover:bg-primary/5" onClick={() => setIsNewProductOpen(true)}>
              <Plus className="w-5 h-5 mr-2" /> Novo Produto
            </Button>
          </div>
        </div>

        {/* KPI CARDS - VISÃO DE EXPERT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor em Estoque (Venda)</p>
                <h3 className="text-2xl font-bold text-primary">R$ {stats.totalSalesValue.toFixed(2)}</h3>
              </div>
              <Package className="w-8 h-8 text-primary/50" />
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Lucro Potencial</p>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {stats.potentialProfit.toFixed(2)}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500/50" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Itens em Estoque</p>
                <h3 className="text-2xl font-bold">{stats.totalItems} <span className="text-sm font-normal text-muted-foreground">unid.</span></h3>
              </div>
              <Archive className="w-8 h-8 text-muted-foreground/50" />
            </CardContent>
          </Card>
        </div>

        {/* QUICK ACCESS PRODUCTS (Dia-a-dia) */}
        {products.length > 0 && (
          <div className="space-y-3">
             <h3 className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Atalhos Rápidos
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {products.filter(p => p.quantity > 0).slice(0, 6).map(p => (
                  <Button 
                    key={p.id} 
                    variant="outline" 
                    className="h-auto py-3 flex flex-col gap-1 items-center bg-white hover:bg-slate-50 border-slate-200"
                    onClick={() => addToCart(p)}
                  >
                    <span className="text-xs font-bold truncate w-full text-center">{p.name}</span>
                    <span className="text-primary font-bold">R$ {p.selling_price.toFixed(2)}</span>
                  </Button>
                ))}
             </div>
          </div>
        )}

        {/* ACTIONS & FILTERS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar produto..." className="pl-9" />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {/* Removidos botões duplicados daqui para limpar interface */}
          </div>
        </div>

        {/* MODAIS DO SISTEMA */}
        <>
            {/* Modal de Novo Produto (ESTAVA FALTANDO!) */}
            <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Produto</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* BUSCA GLOBAL DE PRODUTOS */}
                  <div className="grid gap-2 relative">
                    <Label className="text-primary font-bold flex items-center gap-2">
                      <Search className="w-4 h-4" /> Busca na Base Global
                    </Label>
                    <div className="relative">
                      <Input 
                        placeholder="Procure por Água, Coca, Batata..." 
                        className="bg-primary/5 border-primary/20"
                        value={skuSearchQuery}
                        onChange={(e) => {
                          setSkuSearchQuery(e.target.value);
                          setShowSkuGlobalResults(true);
                        }}
                        onFocus={() => setShowSkuGlobalResults(true)}
                      />
                      
                      {showSkuGlobalResults && skuSearchQuery.length >= 2 && (
                        <div className="absolute top-full left-0 right-0 z-[60] mt-1 bg-white dark:bg-slate-800 border shadow-xl rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                          {GLOBAL_SKU_LIST
                            .filter(item => 
                              item.name.toLowerCase().includes(skuSearchQuery.toLowerCase()) || 
                              item.sku.includes(skuSearchQuery)
                            )
                            .map(item => (
                              <button
                                key={item.sku}
                                type="button"
                                className="w-full text-left p-3 hover:bg-primary/10 border-b last:border-0 flex flex-col transition-colors"
                                onClick={() => {
                                  setNewProduct({
                                    ...newProduct,
                                    name: item.name,
                                    sku: item.sku,
                                    category: item.category,
                                    selling_price: item.suggested_price || newProduct.selling_price
                                  });
                                  setSkuSearchQuery("");
                                  setShowSkuGlobalResults(false);
                                  toast({ title: "Produto selecionado!", description: item.name });
                                }}
                              >
                                <span className="font-bold text-sm">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground">SKU: {item.sku} • Categoria: {item.category}</span>
                              </button>
                            ))}
                          {GLOBAL_SKU_LIST.filter(item => 
                            item.name.toLowerCase().includes(skuSearchQuery.toLowerCase()) || 
                            item.sku.includes(skuSearchQuery)
                          ).length === 0 && (
                            <div className="p-4 text-center text-xs text-muted-foreground italic">
                              Não encontramos na base rápida. Continue o cadastro manual.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {showSkuGlobalResults && (
                      <div className="fixed inset-0 z-50" onClick={() => setShowSkuGlobalResults(false)} />
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sku">GTIN/EAN (Código de Barras) - Opcional</Label>
                    <div className="flex gap-2 relative">
                      <Input 
                        id="sku" 
                        placeholder="Ex: 7891234567890" 
                        value={newProduct.sku} 
                        onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                        onBlur={handleSkuBlur}
                        className={newProduct.sku && !validateGTIN(newProduct.sku) ? "border-red-500 focus-visible:ring-red-500 pr-16" : ""}
                      />
                      {newProduct.sku && !validateGTIN(newProduct.sku) && (
                         <span className="absolute right-14 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-bold bg-white px-1">Inválido</span>
                      )}
                      <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}>
                        <Camera className="w-4 h-4" />
                      </Button>
                      {newProduct.sku && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => window.open(`https://www.google.com/search?q=${newProduct.sku}`, '_blank')}
                          title="Pesquisar código no Google"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input id="name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  
                  {/* BUSCA DE NCM */}
                  <div className="grid gap-2 relative">
                     <Label htmlFor="ncm">Classificação Fiscal (NCM)</Label>
                     <div className="relative">
                        <Input 
                          id="ncm"
                          placeholder="Digite código ou descrição (Ex: 2201, Água...)" 
                          value={ncmSearchQuery || newProduct.ncm} 
                          onChange={e => {
                             // Se o usuário digitar, atualiza a query e o ncm do produto
                             const val = e.target.value;
                             setNewProduct({...newProduct, ncm: val});
                             handleNcmSearch(val);
                          }}
                          onFocus={() => {
                             if (newProduct.ncm) handleNcmSearch(newProduct.ncm);
                             setShowNcmResults(true);
                          }}
                        />
                        {showNcmResults && ncmResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-[60] mt-1 bg-white dark:bg-slate-800 border shadow-xl rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                             {ncmResults.map(ncm => (
                               <button
                                 key={ncm.code}
                                 type="button"
                                 className="w-full text-left p-2 hover:bg-primary/10 border-b last:border-0 text-xs flex flex-col transition-colors"
                                 onClick={() => {
                                   setNewProduct({...newProduct, ncm: ncm.code});
                                   setNcmSearchQuery(`${ncm.code} - ${ncm.description}`); // Mostra bonito no input mas salva só o code
                                   setShowNcmResults(false);
                                 }}
                               >
                                 <span className="font-bold text-primary">{ncm.code}</span>
                                 <span className="text-muted-foreground truncate">{ncm.description}</span>
                               </button>
                             ))}
                          </div>
                        )}
                     </div>
                     {showNcmResults && (
                       <div className="fixed inset-0 z-50" onClick={() => setShowNcmResults(false)} />
                     )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Categoria</Label>
                      <Select onValueChange={v => setNewProduct({...newProduct, category: v})} value={newProduct.category}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bebidas">Bebidas</SelectItem>
                          <SelectItem value="Vestuário">Vestuário</SelectItem>
                          <SelectItem value="Alimentos">Alimentos</SelectItem>
                          <SelectItem value="Acessórios">Acessórios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Estoque Mínimo</Label>
                      <Input type="number" value={newProduct.min_quantity} onChange={e => setNewProduct({...newProduct, min_quantity: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Preço de Custo (R$)</Label>
                      <Input type="number" step="0.01" value={newProduct.cost_price} onChange={e => setNewProduct({...newProduct, cost_price: parseFloat(e.target.value)})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Preço de Venda (R$)</Label>
                      <Input type="number" step="0.01" value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <div className="grid gap-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                    <Label className="text-primary font-bold">Estoque Inicial</Label>
                    <Input 
                      type="number" 
                      placeholder="Quantidade já em mãos" 
                      value={newProduct.quantity} 
                      onChange={e => setNewProduct({...newProduct, quantity: parseInt(e.target.value)})} 
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Isso registrará uma entrada automática no histórico.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateProduct} className="w-full">Cadastrar Produto</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Edição */}
            <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>Editar Produto</DialogTitle></DialogHeader>
                {editingProduct && (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Código de Barras (SKU)</Label>
                      <Input value={editingProduct.sku || ''} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Nome do Produto</Label>
                      <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <Select onValueChange={v => setEditingProduct({...editingProduct, category: v})} value={editingProduct.category}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bebidas">Bebidas</SelectItem>
                            <SelectItem value="Vestuário">Vestuário</SelectItem>
                            <SelectItem value="Alimentos">Alimentos</SelectItem>
                            <SelectItem value="Acessórios">Acessórios</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Estoque Mínimo</Label>
                        <Input 
                          type="number" 
                          value={editingProduct.min_quantity} 
                          onChange={e => setEditingProduct({...editingProduct, min_quantity: e.target.value === '' ? 0 : parseInt(e.target.value)})} 
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Quantidade em Estoque (Ajuste Manual)</Label>
                      <Input 
                        type="number" 
                        value={editingProduct.quantity} 
                        onChange={e => setEditingProduct({...editingProduct, quantity: e.target.value === '' ? 0 : parseInt(e.target.value)})} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Preço de Custo (R$)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={editingProduct.cost_price} 
                          onChange={e => setEditingProduct({...editingProduct, cost_price: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Preço de Venda (R$)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={editingProduct.selling_price} 
                          onChange={e => setEditingProduct({...editingProduct, selling_price: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                        />
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Exclusão */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto do inventário.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </>

        {/* MAIN CONTENT: PRODUCTS TABLE & PDV / CART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PRODUCT LIST */}
          <Card className="lg:col-span-8 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventário Atual</CardTitle>
              <div className="flex items-center gap-2">
                 <Badge variant="outline">{products.length} Produtos</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left border-b">
                      <th className="p-3 font-medium">Produto</th>
                      <th className="p-3 font-medium text-center">Qtd.</th>
                      <th className="p-3 font-medium text-right">Preço</th>
                      <th className="p-3 font-medium text-center">Status</th>
                      <th className="p-3 font-medium text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {product.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category} {product.sku && `• SKU: ${product.sku}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-bold ${product.quantity <= product.min_quantity ? 'text-red-500' : 'text-slate-700'}`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">R$ {product.selling_price.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          {product.quantity === 0 ? (
                            <Badge variant="destructive">Esgotado</Badge>
                          ) : product.quantity <= product.min_quantity ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">Baixo</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">OK</Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => addToCart(product)}
                              disabled={product.quantity <= 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(product)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteClick(product.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum produto cadastrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* PDV / SHOPPING CART */}
          <Card className="lg:col-span-4 border-none shadow-md bg-slate-50 dark:bg-slate-900/20 flex flex-col h-[calc(100vh-300px)] lg:h-auto min-h-[500px]">
            <CardHeader className="border-b bg-white dark:bg-slate-900 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" /> Carrinho PDV
                </CardTitle>
                <Badge variant="secondary">{cart.reduce((acc, item) => acc + item.quantity, 0)} itens</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* VINCULAR ALUNO */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center gap-2">
                  <User className="w-3 h-3" /> Vincular {vocabulary.client} (Opcional)
                </Label>
                <Select onValueChange={setSelectedStudentId} value={selectedStudentId || ''}>
                  <SelectTrigger className="bg-white h-9 text-xs">
                    <SelectValue placeholder={`Selecione um ${vocabulary.client.toLowerCase()}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (Venda Avulsa)</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground font-bold text-primary">R$ {item.product.selling_price.toFixed(2)} / un</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-md h-8 bg-slate-50">
                        <button 
                          className="px-2 h-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-bold"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button 
                          className="px-2 h-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-bold"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.quantity}
                        >
                          +
                        </button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                  <ShoppingCart className="w-12 h-12 mb-4 text-slate-300" />
                  <p className="text-sm">Carrinho vazio.<br/>Escanear ou use os atalhos.</p>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t bg-white dark:bg-slate-900 rounded-b-xl space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {cart.reduce((acc, item) => acc + (item.product.selling_price * item.quantity), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-black">
                  <span>TOTAL</span>
                  <span className="text-primary">R$ {cart.reduce((acc, item) => acc + (item.product.selling_price * item.quantity), 0).toFixed(2)}</span>
                </div>
              </div>
              <Button 
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg transition-all active:scale-95" 
                disabled={cart.length === 0 || isFinalizingSale}
                onClick={handleOpenPaymentModal}
              >
                {isFinalizingSale ? (
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <DollarSign className="w-6 h-6 mr-2" />
                )}
                FECHAR VENDA (F2)
              </Button>

              {/* Payment Method Dialog IMPROVED */}
              <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">Como o {vocabulary.client.toLowerCase()} pagou?</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-3 py-6">
                    <Button 
                      variant={paymentMethod === 'money' ? 'default' : 'outline'}
                      className={`h-16 text-lg justify-start px-6 gap-4 ${paymentMethod === 'money' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      onClick={() => setPaymentMethod('money')}
                    >
                      <Banknote className="w-8 h-8" /> Dinheiro
                    </Button>
                    <Button 
                      variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                      className={`h-16 text-lg justify-start px-6 gap-4 ${paymentMethod === 'pix' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : ''}`}
                      onClick={() => setPaymentMethod('pix')}
                    >
                      <QrCode className="w-8 h-8" /> PIX
                    </Button>
                    <Button 
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      className={`h-16 text-lg justify-start px-6 gap-4 ${paymentMethod === 'card' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard className="w-8 h-8" /> Cartão (Crédito/Débito)
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button 
                      className="w-full h-12 text-lg font-bold"
                      onClick={handleFinalizeSaleWithPayment} 
                      disabled={!paymentMethod || isFinalizingSale}
                    >
                      Confirmar e Finalizar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {cart.length > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground hover:text-red-500"
                  onClick={() => setCart([])}
                  disabled={isFinalizingSale}
                >
                  Limpar Carrinho
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* RECENT TRANSACTIONS (Optional / Moved below) */}
        <Card className="border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'sale' ? 'bg-green-100 text-green-600' : 
                      tx.type === 'in' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {tx.type === 'sale' ? <DollarSign className="w-4 h-4" /> : 
                       tx.type === 'in' ? <Plus className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate max-w-[100px]">{tx.product?.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{tx.reason} {tx.payment_method && `(${tx.payment_method})`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${tx.type === 'in' ? 'text-blue-600' : 'text-red-600'}`}>
                      {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center text-sm text-muted-foreground col-span-full">Sem histórico.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </ModuleGuard>
  )
}
