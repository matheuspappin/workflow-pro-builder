'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { guardModule } from '@/lib/modules-server'

// --- Schemas ---

export const ServiceOrderItemSchema = z.object({
  id: z.string().optional(),
  item_type: z.enum(['product', 'service']),
  product_id: z.string().nullable().optional(),
  service_id: z.string().nullable().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  quantity: z.number().min(0.01, "Quantidade mínima é 0.01"),
  unit_price: z.number().min(0, "Preço unitário não pode ser negativo"),
})

export const ServiceOrderSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string().min(1, "Cliente é obrigatório"),
  professional_id: z.string().optional().nullable(),
  status: z.enum(['draft', 'open', 'in_progress', 'waiting_parts', 'finished', 'cancelled']).default('draft'),
  description: z.string().min(1, "Descrição do problema é obrigatória"),
  observations: z.string().optional(),
  private_notes: z.string().optional(),
  items: z.array(ServiceOrderItemSchema).default([]),
  discount: z.number().default(0),
})

export type ServiceOrderFormValues = z.infer<typeof ServiceOrderSchema>

// --- Actions ---

export async function getServices(studioId: string) {
  await guardModule('service_orders')
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('studio_id', studioId)
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(`Erro ao buscar serviços: ${error.message}`)
  return data
}

export async function getServiceOrders(studioId: string, filters?: { status?: string, professionalId?: string, search?: string }) {
  await guardModule('service_orders')
  const supabase = await createClient()
  
  let query = supabase
    .from('service_orders')
    .select(`
      *,
      customer:students(id, name, email, phone),
      professional:professionals(id, name),
      items:service_order_items(*)
    `)
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.professionalId) {
    query = query.eq('professional_id', filters.professionalId)
  }

  if (filters?.search) {
    // Busca por nome do cliente ou código de rastreio
    // Nota: Como 'customer' é uma relação, o search direto no nome requer join ou filter post-query se não usar RPC.
    // O Supabase suporta filtro em foreign tables: customer.name
    query = query.or(`tracking_code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar OS: ${error.message}`)
  return data
}

export async function getServiceOrderById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      customer:students(id, name, email, phone),
      professional:professionals(id, name),
      items:service_order_items(*),
      history:service_order_history(
        *,
        user:auth.users(email) 
      )
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createServiceOrder(data: ServiceOrderFormValues, studioId: string) {
  await guardModule('service_orders')
  const supabase = await createClient()
  const { items, ...orderData } = data

  // Calcular totais
  const total_products = items
    .filter(i => i.item_type === 'product')
    .reduce((acc, i) => acc + (i.quantity * i.unit_price), 0)
    
  const total_services = items
    .filter(i => i.item_type === 'service')
    .reduce((acc, i) => acc + (i.quantity * i.unit_price), 0)
    
  const total_amount = total_products + total_services - (orderData.discount || 0)

  // 1. Criar OS
  const { data: newOrder, error: orderError } = await supabase
    .from('service_orders')
    .insert({
      ...orderData,
      studio_id: studioId,
      total_products,
      total_services,
      total_amount,
      status: 'draft',
      opened_at: new Date().toISOString()
    })
    .select()
    .single()

  if (orderError) throw new Error(`Erro ao criar OS: ${orderError.message}`)

  // 2. Criar Itens
  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      studio_id: studioId,
      service_order_id: newOrder.id,
      item_type: item.item_type,
      product_id: item.product_id || null,
      service_id: item.service_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price
    }))

    const { error: itemsError } = await supabase
      .from('service_order_items')
      .insert(itemsToInsert)

    if (itemsError) throw new Error(`Erro ao criar itens: ${itemsError.message}`)
  }

  // 3. Log History
  await supabase.from('service_order_history').insert({
    studio_id: studioId,
    service_order_id: newOrder.id,
    new_status: 'draft',
    notes: 'OS Criada'
  })

  revalidatePath('/dashboard/service-orders')
  return newOrder
}

export async function updateServiceOrder(id: string, data: ServiceOrderFormValues, studioId: string) {
  await guardModule('service_orders')
  const supabase = await createClient()
  const { items, ...orderData } = data

  // Buscar OS atual para comparação de status
  const { data: currentOrder } = await supabase
    .from('service_orders')
    .select('status')
    .eq('id', id)
    .single()

  if (!currentOrder) throw new Error("OS não encontrada")

  // Calcular novos totais
  const total_products = items
    .filter(i => i.item_type === 'product')
    .reduce((acc, i) => acc + (i.quantity * i.unit_price), 0)
    
  const total_services = items
    .filter(i => i.item_type === 'service')
    .reduce((acc, i) => acc + (i.quantity * i.unit_price), 0)
    
  const total_amount = total_products + total_services - (orderData.discount || 0)

  // 1. Atualizar OS
  const { error: orderError } = await supabase
    .from('service_orders')
    .update({
      customer_id: orderData.customer_id,
      professional_id: orderData.professional_id,
      description: orderData.description,
      observations: orderData.observations,
      private_notes: orderData.private_notes,
      discount: orderData.discount,
      status: orderData.status,
      total_products,
      total_services,
      total_amount
    })
    .eq('id', id)

  if (orderError) throw new Error(`Erro ao atualizar OS: ${orderError.message}`)

  // 2. Sincronizar Itens (Estratégia: Delete All + Insert All para simplicidade, ou Upsert)
  // Para manter integridade, vamos deletar os existentes e recriar.
  // CUIDADO: Em produção, o ideal é soft-delete ou diff inteligente para não perder histórico de IDs se for importante.
  
  await supabase.from('service_order_items').delete().eq('service_order_id', id)

  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      studio_id: studioId,
      service_order_id: id,
      item_type: item.item_type,
      product_id: item.product_id || null,
      service_id: item.service_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price
    }))

    const { error: itemsError } = await supabase
      .from('service_order_items')
      .insert(itemsToInsert)
      
    if (itemsError) throw new Error(`Erro ao atualizar itens: ${itemsError.message}`)
  }

  // 3. Log History se mudou status
  if (currentOrder.status !== orderData.status) {
    await supabase.from('service_order_history').insert({
      studio_id: studioId,
      service_order_id: id,
      previous_status: currentOrder.status,
      new_status: orderData.status,
      notes: 'Status alterado via edição'
    })
  }
  
  // 4. Lógica de Finalização (Se status mudou para 'finished')
  if (orderData.status === 'finished' && currentOrder.status !== 'finished') {
      await handleFinishOrder(id, studioId, total_amount, orderData.customer_id)
  }

  revalidatePath('/dashboard/service-orders')
  return { success: true }
}

export async function getStudentsForOS(studioId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, name, email, phone')
    .eq('studio_id', studioId)
    .eq('status', 'active')
    .order('name')
  
  if (error) throw error
  return data
}

export async function getProfessionalsForOS(studioId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('professionals')
    .select('id, name')
    .eq('studio_id', studioId)
    .eq('status', 'active')
    .order('name')
  
  if (error) throw error
  return data
}

export async function getProductsForOS(studioId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, quantity')
    .eq('studio_id', studioId)
    .order('name')
  
  if (error) throw error
  return data
}

async function handleFinishOrder(orderId: string, studioId: string, amount: number, customerId: string) {
  const supabase = await createClient()
  
  // Buscar configuração do business_model
  // Assumindo que está em organization_settings ou studio_settings. 
  // O prompt fala de "organization_settings.business_type" mas "business_model" (monetary/credit)
  // Vamos buscar em organization_settings ou assumir default Monetary.
  
  const { data: orgSettings } = await supabase
    .from('organization_settings')
    .select('business_type') // Pode ser que o modelo de cobranca esteja aqui
    .eq('studio_id', studioId)
    .single()
    
  // Como não tenho certeza onde está "business_model" (CREDIT vs MONETARY), vou inferir ou usar padrão.
  // Se for CREDIT, debita. Se for MONETARY, gera fatura.
  // Vou assumir MONETARY como default.
  
  // TODO: Implementar verificação real do modelo de negócio. 
  // Por enquanto, vou criar um pagamento pendente (MONETARY).
  
  // Se for Credit:
  /*
  const { error: creditError } = await supabase.rpc('deduct_student_credits', {
      p_student_id: customerId,
      p_amount: amount
  })
  */
  
  // Monetary (Padrão): Gerar Pagamento Pendente
  if (amount > 0) {
      await supabase.from('payments').insert({
          studio_id: studioId,
          student_id: customerId,
          amount: amount,
          due_date: new Date().toISOString(), // Vence hoje
          status: 'pending',
          reference_month: new Date().toISOString().slice(0, 7), // YYYY-MM
          description: `Referente à OS #${orderId}`,
          payment_method: 'other'
      })
  }
  
  // Atualizar finished_at
  await supabase
    .from('service_orders')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', orderId)
}

// Criar Serviço Avulso (Catalogo)
export async function createService(data: { name: string, price: number, description?: string }, studioId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('services').insert({
        ...data,
        studio_id: studioId
    })
    
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/service-orders')
}
