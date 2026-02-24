"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Search, Package, TrendingUp, AlertTriangle, 
  Archive, Camera, MoreHorizontal, Trash2, Edit2, Loader2, RefreshCw
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  getInventory, createProduct, registerTransaction, getRecentTransactions, Product, Transaction, getProductBySku, updateProduct, deleteProduct
} from "@/lib/actions/inventory"
import { BarcodeScanner } from "@/components/dashboard/barcode-scanner"
import { GLOBAL_SKU_LIST } from "@/lib/constants/global-skus"
import { searchNcm, type Ncm } from "@/lib/services/brasil-api"
import { validateGTIN } from "@/lib/validation-utils"
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
  const { vocabulary, t, language } = useVocabulary()
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({ totalItems: 0, totalSalesValue: 0, potentialProfit: 0 })
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState<string | null>(null)
  
  // Modais
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  const [isTransactionOpen, setIsTransactionOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  
  // Categorias
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const defaultCategories = ["Bebidas", "Alimentos", "Acessórios", "Uniformes", "Equipamentos", "Suplementos", "Geral"]
  const allCategories = Array.from(new Set([
    ...defaultCategories,
    ...products.map(p => p.category).filter(Boolean),
    ...customCategories
  ])).sort()
  
  // Busca
  const [searchInput, setSearchInput] = useState("")

  // Formulários
  const [newProduct, setNewProduct] = useState({ 
    name: "", 
    category: "Geral", 
    min_quantity: 5, 
    quantity: 0, 
    cost_price: 0, 
    selling_price: 0, 
    sku: "", 
    ncm: "" 
  })
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
      
      setProducts(inventory.products)
      setStats(inventory.stats as any)
      setTransactions(history)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `${language === 'en' ? '$' : 'R$'} ${price.toFixed(2)}`
  }

  const handleCreateProduct = async () => {
    if (newProduct.sku) {
      const existing = await getProductBySku(newProduct.sku, studioId!)
      if (existing) {
        if (confirm(`O produto "${existing.name}" já está cadastrado com este SKU.\n\nDeseja adicionar estoque a ele ao invés de criar um novo?`)) {
          setIsNewProductOpen(false)
          setSelectedProduct(existing.id)
          setTransactionType('in')
          setTransactionData({ 
            quantity: newProduct.quantity || 1, 
            reason: "Entrada via Cadastro (Merge)", 
            costPrice: newProduct.cost_price 
          })
          setIsTransactionOpen(true)
        }
        return 
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
      const reason = transactionData.reason || (transactionType === 'in' ? 'Entrada Manual' : 'Ajuste de Estoque')
      const price = transactionType === 'in' && transactionData.costPrice > 0 ? transactionData.costPrice : undefined
      
      await registerTransaction(selectedProduct, transactionType as any, transactionData.quantity, reason, studioId!, price)
      
      toast({ title: "Movimentação registrada com sucesso!" })
      setIsTransactionOpen(false)
      setTransactionData({ quantity: 1, reason: "", costPrice: 0 }) 
      fetchData()
    } catch (error: any) {
      toast({ title: "Erro na movimentação", description: error.message, variant: "destructive" })
    }
  }

  const handleScanSuccess = async (decodedText: string) => {
    const existingProduct = await getProductBySku(decodedText, studioId!)
    if (existingProduct) {
      handleEditClick(existingProduct)
    } else {
      setNewProduct(prev => ({ ...prev, sku: decodedText }))
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchInput.toLowerCase()) || 
    (p.sku && p.sku.includes(searchInput))
  )

  return (
    <ModuleGuard module="inventory" showFullError>
      <div className="min-h-screen bg-background flex flex-col">
        <Header title={`Gestão de Estoque - ${vocabulary.establishment}`} />
      
      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />

      <div className="flex-1 p-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="p-3 bg-primary/10 rounded-full">
                <Package className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h2 className="text-lg font-bold">Controle de Inventário</h2>
                <p className="text-sm text-muted-foreground">Gerencie produtos, entradas e alertas de estoque.</p>
             </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="lg" className="h-12 bg-primary hover:bg-primary/90 px-4" onClick={() => setIsNewProductOpen(true)}>
              <Plus className="w-5 h-5 mr-2" /> Novo Produto
            </Button>
            <Button size="lg" variant="outline" className="h-12 border-primary/20 text-primary hover:bg-primary/5" onClick={() => setIsScannerOpen(true)}>
              <Camera className="w-5 h-5 mr-2" /> Escanear
            </Button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor em Estoque (Venda)</p>
                <h3 className="text-2xl font-bold text-primary">{formatPrice(stats.totalSalesValue)}</h3>
              </div>
              <Package className="w-8 h-8 text-primary/50" />
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Lucro Potencial</p>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{formatPrice(stats.potentialProfit)}</h3>
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

        {/* MAIN CONTENT: PRODUCTS TABLE */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Inventário Atual</CardTitle>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou SKU..." 
                className="pl-9" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
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
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {product.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0 font-normal bg-muted text-muted-foreground">
                                {product.category}
                              </Badge>
                              {product.sku && (
                                <p className="text-[10px] text-muted-foreground">
                                  SKU: {product.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold">
                        {product.quantity}
                      </td>
                      <td className="p-3 text-right font-medium">{formatPrice(product.selling_price)}</td>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(product)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedProduct(product.id)
                              setTransactionType('in')
                              setIsTransactionOpen(true)
                            }}>
                              <Plus className="mr-2 h-4 w-4" /> Adicionar Estoque
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDeleteClick(product.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* RECENT TRANSACTIONS */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {transactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'sale' ? 'bg-green-100 text-green-600' : 
                      tx.type === 'in' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                       {tx.type === 'in' ? <Plus className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate max-w-[100px]">{tx.product?.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{tx.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${tx.type === 'in' ? 'text-blue-600' : 'text-red-600'}`}>
                      {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* MODALS */}
      <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Cadastrar Novo Produto</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Código de Barras (SKU)</Label>
              <div className="flex gap-2">
                <Input value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}><Camera className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
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
                <Label>Preço Venda</Label>
                <Input type="number" step="0.01" value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: parseFloat(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label>Estoque Inicial</Label>
                <Input type="number" value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: parseInt(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreateProduct} className="w-full">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Movimentação</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Quantidade</Label>
              <Input type="number" value={transactionData.quantity} onChange={e => setTransactionData({...transactionData, quantity: parseInt(e.target.value)})} />
            </div>
            <div className="grid gap-2">
              <Label>Motivo</Label>
              <Input value={transactionData.reason} onChange={e => setTransactionData({...transactionData, reason: e.target.value})} />
            </div>
          </div>
          <DialogFooter><Button onClick={handleTransaction} className="w-full">Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar</DialogTitle></DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Tipo de Produto (Categoria)</Label>
                <Select 
                  value={editingProduct.category} 
                  onValueChange={val => {
                    if (val === "ADD_NEW") {
                      const name = prompt("Digite o nome do novo tipo de produto:");
                      if (name) {
                        setCustomCategories(prev => [...prev, name]);
                        setEditingProduct(prev => prev ? ({ ...prev, category: name }) : null);
                      }
                    } else {
                      setEditingProduct(prev => prev ? ({ ...prev, category: val }) : null);
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
                  <Label>Preço Venda</Label>
                  <Input type="number" step="0.01" value={editingProduct.selling_price} onChange={e => setEditingProduct({...editingProduct, selling_price: parseFloat(e.target.value)})} />
                </div>
                <div className="grid gap-2">
                  <Label>Estoque</Label>
                  <Input type="number" value={editingProduct.quantity} onChange={e => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value)})} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={handleSaveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600">Sim</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleGuard>
  )
}
