'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  getStudentsForOS, 
  getProfessionalsForOS,
  getProductsForOS,
  getServices,
  createServiceOrder,
  updateServiceOrder
} from '@/lib/actions/service-orders'
import { InviteClientDialog } from './invite-client-dialog'
import { useOrganization } from '@/components/providers/organization-provider'
import { ServiceOrderSchema, ServiceOrderFormValues } from '@/lib/schemas/service-orders'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Plus, Trash2, Search, Package, Wrench, Save, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { SignaturePad } from './signature-pad'
import { OSMilestones } from './os-milestones'
import { OSComments } from './os-comments'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ServiceOrderFormProps {
  studioId: string
  initialData?: any
  onSuccess?: () => void
}

export function ServiceOrderForm({ studioId, initialData, onSuccess }: ServiceOrderFormProps) {
  const { studios } = useOrganization()
  const studioName = studios.find(s => s.id === studioId)?.name || 'Nossa Empresa'
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [selectedProfessionalType, setSelectedProfessionalType] = useState<Array<'technician' | 'engineer' | 'architect' | 'other'>>(['technician', 'engineer', 'architect', 'other'])
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [showSignature, setShowSignature] = useState(false)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialData?.customer_signature_url || null)
  const [customService, setCustomService] = useState({ description: 'Mão de Obra', price: '' })
  const [customProduct, setCustomProduct] = useState({ description: '', price: '' })

  const form = useForm<ServiceOrderFormValues>({
    resolver: zodResolver(ServiceOrderSchema),
    defaultValues: initialData ? {
      customer_id: initialData.customer_id,
      professional_id: initialData.professional_id,
      status: initialData.status,
      project_type: initialData.project_type || 'common',
      description: initialData.description,
      observations: initialData.observations || '',
      private_notes: initialData.private_notes || '',
      discount: initialData.discount || 0,
      professional_commission_value: initialData.professional_commission_value ?? 0,
      professional_commission_status: initialData.professional_commission_status || 'pending',
      scheduled_at: initialData.scheduled_at ? new Date(initialData.scheduled_at).toISOString().slice(0, 16) : null,
      items: initialData.items?.map((item: any) => ({
        id: item.id,
        item_type: item.item_type,
        product_id: item.product_id,
        service_id: item.service_id,
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price)
      })) || []
    } : {
      status: 'draft',
      items: [],
      discount: 0,
      professional_commission_value: 0,
      professional_commission_status: 'pending'
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [s, p, prod, serv] = await Promise.all([
          getStudentsForOS(studioId),
          getProfessionalsForOS(studioId, selectedProfessionalType),
          getProductsForOS(studioId),
          getServices(studioId)
        ])
        setStudents(s)
        setProfessionals(p)
        setProducts(prod)
        setServices(serv)
      } catch (error) {
        toast.error('Erro ao carregar dados auxiliares')
      }
    }
    loadData()
  }, [studioId, selectedProfessionalType])

  const onSubmit = async (values: ServiceOrderFormValues) => {
    setLoading(true)
    try {
      const dataToSave = {
        ...values,
        customer_signature_url: signatureUrl
      }

      if (initialData?.id) {
        await updateServiceOrder(initialData.id, dataToSave, studioId)
        toast.success('Ordem de Serviço atualizada com sucesso!')
      } else {
        await createServiceOrder(dataToSave, studioId)
        toast.success('Ordem de Serviço criada com sucesso!')
      }
      
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar Ordem de Serviço')
    } finally {
      setLoading(false)
    }
  }

  const totals = form.watch('items').reduce((acc, item) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0)
    if (item.item_type === 'product') acc.products += subtotal
    else acc.services += subtotal
    return acc
  }, { products: 0, services: 0 })

  const discount = form.watch('discount') || 0
  const grandTotal = totals.products + totals.services - discount

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="items">Itens e Serviços</TabsTrigger>
            <TabsTrigger value="execution">Execução & Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control= {form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                <div className="flex flex-col py-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{student.name}</span>
                                    {student.modality && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border">
                                        {student.modality}
                                      </span>
                                    )}
                                  </div>
                                  {student.email && (
                                    <span className="text-xs text-muted-foreground">{student.email}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <InviteClientDialog 
                          studioId={studioId} 
                          studioName={studioName}
                          onClientCreated={async (clientId) => {
                            const updatedStudents = await getStudentsForOS(studioId)
                            setStudents(updatedStudents)
                            form.setValue('customer_id', clientId)
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="professional_id"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Responsável Técnico</FormLabel>
                          <div className="flex gap-2">
                            <Badge
                              variant={selectedProfessionalType.includes('technician') ? 'default' : 'outline'}
                              className="cursor-pointer" 
                              onClick={() => setSelectedProfessionalType(['technician'])}
                            >
                              Técnicos
                            </Badge>
                            <Badge
                              variant={selectedProfessionalType.includes('engineer') ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => setSelectedProfessionalType(['engineer'])}
                            >
                              Engenheiros
                            </Badge>
                            <Badge
                              variant={selectedProfessionalType.includes('architect') ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => setSelectedProfessionalType(['architect'])}
                            >
                              Arquitetos
                            </Badge>
                          </div>
                        </div>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um técnico ou arquiteto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professionals.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex flex-col py-1">
                                  <span className="font-medium">{p.name}</span>
                                  {p.professional_type && (
                                    <span className="text-xs text-muted-foreground capitalize">
                                      {p.professional_type === 'engineer' ? 'Engenheiro' : (p.professional_type === 'architect' ? 'Arquiteto' : 'Técnico')}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status da OS" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="open">Aberta</SelectItem>
                            <SelectItem value="in_progress">Em Execução</SelectItem>
                            <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
                            <SelectItem value="finished">Finalizada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Serviço / Projeto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de projeto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="common">OS Comum (Manutenção/Reparo)</SelectItem>
                            <SelectItem value="ppci">PPCI (Prevenção de Incêndio)</SelectItem>
                            <SelectItem value="maintenance">Manutenção Preventiva</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduled_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agendamento (Opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            value={field.value || ''} 
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Descrição e Laudo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Relato e Diagnóstico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição do Problema / Queixa</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva o que o cliente relatou..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Laudo Técnico / Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Diagnóstico, procedimentos realizados..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Informações de Comissão */}
            {form.watch('professional_id') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comissão do Responsável</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="professional_commission_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Comissão (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={field.value === undefined || field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const v = e.target.value
                              field.onChange(v === '' ? undefined : (parseFloat(v) || 0))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="professional_commission_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status da Comissão</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="approved">Aprovada</SelectItem>
                            <SelectItem value="paid">Paga</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="items" className="space-y-6 pt-4">
            {/* Itens da OS (Peças e Serviços) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Itens (Peças e Serviços)</CardTitle>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Peça
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar Peça / Produto</DialogTitle></DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2 border-b pb-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Descrição</FormLabel>
                            <Input
                              value={customProduct.description}
                              onChange={(e) => setCustomProduct({ ...customProduct, description: e.target.value })}
                              className="col-span-3"
                              placeholder="Ex: Parafuso, Filtro..."
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Preço</FormLabel>
                            <Input
                              type="number"
                              value={customProduct.price}
                              onChange={(e) => setCustomProduct({ ...customProduct, price: e.target.value })}
                              className="col-span-3"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              type="button"
                              size="sm"
                              disabled={!customProduct.description || !customProduct.price}
                              onClick={() => {
                                append({ 
                                  item_type: 'product', 
                                  description: customProduct.description, 
                                  quantity: 1, 
                                  unit_price: parseFloat(customProduct.price)
                                })
                                setCustomProduct({ description: '', price: '' })
                              }}
                            >
                              Adicionar Manual
                            </Button>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Ou selecione da lista</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                          {products.map(p => (
                            <Button 
                              key={p.id} 
                              variant="ghost" 
                              className="justify-start"
                              onClick={() => {
                                append({ 
                                  item_type: 'product', 
                                  product_id: p.id, 
                                  description: p.name, 
                                  quantity: 1, 
                                  unit_price: p.price 
                                })
                              }}
                            >
                              <Package className="w-4 h-4 mr-2" /> {p.name} - R$ {p.price}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Serviço
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar Mão de Obra</DialogTitle></DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2 border-b pb-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Descrição</FormLabel>
                            <Input
                              value={customService.description}
                              onChange={(e) => setCustomService({ ...customService, description: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Valor</FormLabel>
                            <Input
                              type="number"
                              value={customService.price}
                              onChange={(e) => setCustomService({ ...customService, price: e.target.value })}
                              className="col-span-3"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              type="button"
                              size="sm"
                              disabled={!customService.description || !customService.price}
                              onClick={() => {
                                append({ 
                                  item_type: 'service', 
                                  description: customService.description, 
                                  quantity: 1, 
                                  unit_price: parseFloat(customService.price)
                                })
                                setCustomService({ description: 'Mão de Obra', price: '' })
                              }}
                            >
                              Adicionar Manual
                            </Button>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Ou selecione da lista</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                          {services.map(s => (
                            <Button 
                              key={s.id} 
                              variant="ghost" 
                              className="justify-start"
                              onClick={() => {
                                append({ 
                                  item_type: 'service', 
                                  service_id: s.id, 
                                  description: s.name, 
                                  quantity: 1, 
                                  unit_price: s.price 
                                })
                              }}
                            >
                              <Wrench className="w-4 h-4 mr-2" /> {s.name} - R$ {s.price}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col md:flex-row gap-4 items-end border-b pb-4 last:border-0">
                      <div className="flex-1 space-y-2">
                        <FormLabel>{form.watch(`items.${index}.item_type`) === 'product' ? 'Produto' : 'Serviço'}</FormLabel>
                        <Input {...form.register(`items.${index}.description` as const)} readOnly />
                      </div>
                      <div className="w-24 space-y-2">
                        <FormLabel>Qtd</FormLabel>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...form.register(`items.${index}.quantity` as const, { valueAsNumber: true })} 
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <FormLabel>Preço Unit.</FormLabel>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...form.register(`items.${index}.unit_price` as const, { valueAsNumber: true })} 
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <FormLabel>Subtotal</FormLabel>
                        <Input 
                          value={(form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.unit_price`)).toFixed(2)} 
                          disabled 
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum item adicionado.
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-end border-t pt-4">
                <div className="w-full md:w-1/3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Produtos:</span>
                    <span>R$ {totals.products.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Serviços:</span>
                    <span>R$ {totals.services.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-sm">Desconto:</span>
                    <Input 
                      type="number" 
                      className="w-24 text-right" 
                      {...form.register('discount', { valueAsNumber: true })} 
                    />
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>R$ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="execution" className="space-y-6 pt-4">
            {initialData?.id ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {form.watch('project_type') === 'ppci' && (
                    <OSMilestones orderId={initialData.id} studioId={studioId} />
                  )}

                  {/* Assinatura */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Assinatura do Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                      {signatureUrl ? (
                        <div className="relative border rounded-md p-2 bg-white">
                          <img src={signatureUrl} alt="Assinatura" className="h-32 object-contain" />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-2 -right-2 rounded-full"
                            onClick={() => setSignatureUrl(null)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-4">A assinatura digital confirma a ciência do cliente sobre o serviço.</p>
                          <Button variant="outline" type="button" onClick={() => setShowSignature(true)}>
                            Coletar Assinatura
                          </Button>
                        </div>
                      )}

                      <Dialog open={showSignature} onOpenChange={setShowSignature}>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader><DialogTitle>Assinatura Digital</DialogTitle></DialogHeader>
                          <SignaturePad 
                            onSave={(data) => {
                              setSignatureUrl(data)
                              setShowSignature(false)
                            }} 
                            onClear={() => setSignatureUrl(null)}
                          />
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                </div>

                <div className="h-[600px]">
                  <OSComments orderId={initialData.id} studioId={studioId} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg border border-dashed">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Save className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Salve a OS primeiro</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-2">
                  Para acessar o chat, marcos e assinatura, você precisa salvar a Ordem de Serviço primeiro.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-4 border-t">
           <Button type="submit" disabled={loading} size="lg">
             {loading ? 'Salvando...' : (
               <>
                 <Save className="w-4 h-4 mr-2" />
                 Salvar Ordem de Serviço
               </>
             )}
           </Button>
        </div>
      </form>
    </Form>
  )
}
