'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ServiceOrderSchema, 
  ServiceOrderFormValues, 
  getStudentsForOS, 
  getProfessionalsForOS,
  getProductsForOS,
  getServices,
  createServiceOrder,
  updateServiceOrder
} from '@/lib/actions/service-orders'
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
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [showSignature, setShowSignature] = useState(false)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialData?.customer_signature_url || null)

  const form = useForm<ServiceOrderFormValues>({
    resolver: zodResolver(ServiceOrderSchema),
    defaultValues: initialData ? {
      customer_id: initialData.customer_id,
      professional_id: initialData.professional_id,
      status: initialData.status,
      description: initialData.description,
      observations: initialData.observations || '',
      private_notes: initialData.private_notes || '',
      discount: initialData.discount || 0,
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
      discount: 0
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
          getProfessionalsForOS(studioId),
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
  }, [studioId])

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
                    <FormLabel>Cliente / Aluno</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
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
                name="professional_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Técnico / Responsável</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um técnico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {professionals.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
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
                  <div className="grid grid-cols-1 gap-2">
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
                  <div className="grid grid-cols-1 gap-2">
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

        <div className="flex justify-end gap-4">
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
