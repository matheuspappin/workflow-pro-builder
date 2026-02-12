"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { getMarketplaceSettings, updateMarketplaceSettings, type MarketplaceSettings } from "@/lib/actions/marketplace"
import { getERPCatalog } from "@/lib/actions/erp"
import { Loader2, ExternalLink, Store, Smartphone, Palette, Globe, Upload, Search, ShoppingBag } from "lucide-react"
import { ModuleGuard } from "@/components/providers/module-guard"
import Link from "next/link"
import { useVocabulary } from "@/hooks/use-vocabulary"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function MarketplacePage() {
  const { vocabulary } = useVocabulary()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studioId, setStudioId] = useState<string | null>(null)
  
  // Data for preview
  const [previewProducts, setPreviewProducts] = useState<any[]>([])

  const [settings, setSettings] = useState<MarketplaceSettings>({
    studio_id: '',
    store_name: '',
    slug: '',
    primary_color: '#000000',
    is_active: false,
    style_config: {
        buttonStyle: 'rounded',
        cardStyle: 'shadow',
        welcomeTitle: 'Bem-vindo(a)!',
        welcomeSubtitle: 'Confira nossos produtos oficiais.'
    }
  })

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem("danceflow_user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          const sId = user.studio_id || user.studioId || user.studio?.id
          setStudioId(sId)

          if (sId) {
            const [data, products] = await Promise.all([
                getMarketplaceSettings(sId),
                getERPCatalog(sId)
            ])
            
            if (products) setPreviewProducts(products.slice(0, 4)) // Get first 4 products for preview

            if (data) {
              setSettings(data)
            } else {
              setSettings({
                studio_id: sId,
                store_name: user.studio?.name || 'Minha Loja',
                slug: (user.studio?.name || 'loja').toLowerCase().replace(/\s+/g, '-'),
                primary_color: '#E11D48', // Default Pink
                is_active: false
              })
            }
          }
        } catch (e) {
          console.error("Erro ao carregar settings:", e)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
    
    const userStr = localStorage.getItem("danceflow_user")
    let currentStudioId = studioId
    
    if (!currentStudioId && userStr) {
        const user = JSON.parse(userStr)
        currentStudioId = user.studio_id || user.studioId || user.studio?.id
        setStudioId(currentStudioId)
    }

    if (!currentStudioId) {
      toast({ title: "Erro de Sessão", description: `Não conseguimos identificar seu ${vocabulary.establishment.toLowerCase()}. Por favor, faça login novamente.`, variant: "destructive" })
      return
    }

    setSaving(true)
    console.log("Enviando para o Supabase:", { id: currentStudioId, settings })

    try {
      await updateMarketplaceSettings(currentStudioId, {
        store_name: settings.store_name,
        slug: settings.slug,
        primary_color: settings.primary_color,
        is_active: settings.is_active,
        style_config: settings.style_config
      })
      
      toast({ title: "Sucesso!", description: "Sua loja moderna foi publicada." })
    } catch (err: any) {
       console.error("Erro completo:", err)
       toast({ 
         title: "Erro ao Salvar", 
         description: err.message || "A tabela do marketplace pode não estar configurada no banco.", 
         variant: "destructive" 
       })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  return (
    <ModuleGuard module="marketplace" showFullError>
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Marketplace Builder" />
        
        <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full h-[calc(100vh-80px)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              
            {/* Left Column: Settings Form */}
            <div className="lg:col-span-7 space-y-6 overflow-y-auto pr-2 pb-20">
              <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-primary/10 rounded-full">
                      <Store className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                      <h2 className="text-2xl font-bold">Personalizar Loja</h2>
                      <p className="text-muted-foreground">Edite a aparência e configurações da sua vitrine.</p>
                  </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <CardTitle>Domínio e Visibilidade</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-base">Loja Online</Label>
                      <p className="text-sm text-muted-foreground">
                        {settings.is_active ? 'Sua loja está visível para o público.' : 'Sua loja está oculta (Modo Manutenção).'}
                      </p>
                    </div>
                    <Switch 
                      checked={settings.is_active}
                      onCheckedChange={checked => setSettings({...settings, is_active: checked})}
                    />
                  </div>

                    <div className="grid gap-2">
                      <Label>Endereço da Loja (Staging URL)</Label>
                      <div className="flex items-center">
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-2 text-sm border border-r-0 rounded-l-md truncate font-mono">
                          test-env.app.com/shop/
                        </span>
                        <Input 
                          className="rounded-l-none"
                          value={settings.slug} 
                          onChange={e => setSettings({...settings, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                          Esta é uma URL de teste (staging). Para conectar seu domínio personalizado (ex: loja.suaempresa.com.br), <span className="underline cursor-pointer">faça o upgrade</span>.
                      </p>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" />
                      <CardTitle>Aparência da Marca</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                      <Label>Nome da Loja</Label>
                      <Input 
                        value={settings.store_name} 
                        onChange={e => setSettings({...settings, store_name: e.target.value})}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Cor da Marca</Label>
                      <div className="flex gap-4 items-center">
                        <Input 
                          type="color" 
                          className="w-16 h-12 p-1 cursor-pointer"
                          value={settings.primary_color}
                          onChange={e => setSettings({...settings, primary_color: e.target.value})}
                        />
                        <div className="flex-1">
                            <Input 
                              value={settings.primary_color}
                              onChange={e => setSettings({...settings, primary_color: e.target.value})}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Essa cor será usada em botões, destaques e cabeçalho.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Banner da Loja (Opcional)</Label>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Clique para fazer upload de uma imagem</span>
                      </div>
                    </div>

                    <div className="border-t pt-6 mt-6">
                      <div className="flex items-center gap-2 mb-4">
                          <Palette className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">Personalização Avançada</CardTitle>
                      </div>
                      
                      <div className="grid gap-4">
                          <div className="grid gap-2">
                              <Label>Estilo dos Botões</Label>
                              <Select 
                                  value={settings.style_config?.buttonStyle || 'rounded'} 
                                  onValueChange={val => setSettings({
                                      ...settings, 
                                      style_config: { ...settings.style_config!, buttonStyle: val as any }
                                  })}
                              >
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="rounded">Padrão (Arredondado)</SelectItem>
                                      <SelectItem value="pill">Pílula (Redondo)</SelectItem>
                                      <SelectItem value="square">Quadrado (Reto)</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>

                          <div className="grid gap-2">
                              <Label>Título de Boas-vindas</Label>
                              <Input 
                                  value={settings.style_config?.welcomeTitle || ''}
                                  onChange={e => setSettings({
                                      ...settings, 
                                      style_config: { ...settings.style_config!, welcomeTitle: e.target.value }
                                  })}
                              />
                          </div>
                      </div>
                    </div>
                </CardContent>
              </Card>

              <div className="pt-4 flex gap-4">
                  <Button 
                      type="button"
                      onClick={async () => {
                          console.log("DIAGNÓSTICO: Verificando estado do banco...");
                          const sId = studioId || JSON.parse(localStorage.getItem("danceflow_user") || '{}').studio_id;
                          const data = await getMarketplaceSettings(sId);
                          console.log("Resultado Settings:", data);
                          await handleSave(); // Salva antes de tentar visualizar
                          // Redireciona para a loja após salvar
                          if (settings.slug) {
                            window.open(`/shop/${settings.slug}`, '_blank');
                          }
                      }} 
                      disabled={saving} 
                      className="flex-1" 
                      size="lg"
                  >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {saving ? "Salvando..." : "Salvar e Publicar"}
                  </Button>
                  <Button 
                      type="button"
                      variant="outline" 
                      size="lg"
                      disabled={!settings.slug} 
                      onClick={() => {
                          if (settings.slug) {
                              window.open(`/shop/${settings.slug}`, '_blank');
                          }
                      }}
                  >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Loja
                  </Button>
              </div>
            </div>

            {/* Right Column: Live Mobile Preview */}
            <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-start h-full sticky top-0 pt-4">
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm font-medium">Live Mobile Preview</span>
              </div>
              
              {/* Phone Frame */}
              <div className="relative w-[320px] h-[640px] bg-gray-900 rounded-[3rem] p-4 shadow-2xl border-4 border-gray-800 ring-1 ring-gray-950/50">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20"></div>
                  
                  {/* Screen Content */}
                  <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden flex flex-col relative">
                      {/* Mock Browser Bar */}
                      <div className="bg-gray-100 text-[10px] text-center py-1 text-gray-500 border-b flex items-center justify-center gap-1 pt-7">
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          app.com/shop/{settings.slug}
                      </div>

                      {/* Store Header Preview */}
                      <div className="p-4 bg-white/95 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                           <div className="font-black text-lg uppercase tracking-tight">{settings.store_name || 'NIKE STYLE'}</div>
                           <div className="flex gap-2 text-gray-400">
                               <Search className="w-4 h-4" />
                               <ShoppingBag className="w-4 h-4 text-black" />
                           </div>
                      </div>

                      {/* Store Body Preview */}
                      <div className="flex-1 bg-white overflow-hidden font-sans overflow-y-auto">
                          {/* Hero */}
                          <div className="relative h-40 bg-gray-100 flex items-center justify-center text-center p-4 mb-4">
                              <div className="absolute inset-0 bg-gray-200" />
                              <div className="relative z-10">
                                  <h3 className="font-black text-2xl uppercase tracking-tighter leading-none mb-1">{settings.style_config?.welcomeTitle || 'JUST DO IT'}</h3>
                                  <div className="text-[8px] bg-black text-white px-2 py-1 inline-block uppercase font-bold tracking-widest">Shop Now</div>
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-2 gap-y-6 px-3 pb-8">
                              {previewProducts.length > 0 ? previewProducts.map((p, i) => (
                                  <div key={i} className="group">
                                      <div className="aspect-[3/4] bg-gray-100 mb-2 relative overflow-hidden">
                                          {p.image_url ? (
                                              <img src={p.image_url} className="w-full h-full object-cover" alt="" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">IMG</div>
                                          )}
                                      </div>
                                      <div className="text-[10px] font-bold uppercase tracking-tight line-clamp-1">{p.name}</div>
                                      <div className="text-[10px] text-gray-500">{p.category || 'Lifestyle'}</div>
                                      <div className="text-[10px] font-bold mt-0.5">R$ {p.selling_price}</div>
                                  </div>
                              )) : (
                                  // ... placeholders ...
                                  [1, 2, 3, 4].map(i => (
                                     <div key={i} className="opacity-50">
                                        <div className="aspect-[3/4] bg-gray-100 mb-2"></div>
                                        <div className="h-2 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-2 w-1/2 bg-gray-200"></div>
                                     </div> 
                                  ))
                              )}
                          </div>
                      </div>
                      
                      {/* Mock Footer */}
                      <div className="bg-white border-t p-2 text-center text-[8px] text-gray-400">
                          Powered by AI
                      </div>
                  </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ModuleGuard>
  )
}
