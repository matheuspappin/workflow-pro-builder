'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { guardModule } from '@/lib/modules-server'
import { ServiceOrderFormValues } from '@/lib/schemas/service-orders'

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
      professional:professionals!professional_id(id, name, professional_type),
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
      professional:professionals!professional_id(id, name),
      items:service_order_items(*),
      milestones:service_order_milestones(id, title, status, order_index, completed_at, category),
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

/** Busca OS com milestones usando supabaseAdmin — evita problemas de RLS com studio/fire-protection */
export async function getServiceOrderByIdForStudio(id: string, studioId: string) {
  const { data, error } = await supabaseAdmin
    .from('service_orders')
    .select(`
      *,
      customer:students(id, name, email, phone),
      professional:professionals!professional_id(id, name),
      items:service_order_items(*),
      milestones:service_order_milestones(id, title, status, order_index, completed_at, category),
      history:service_order_history(
        *,
        user:auth.users(email) 
      )
    `)
    .eq('id', id)
    .eq('studio_id', studioId)
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
      project_type: orderData.project_type || 'common',
      professional_commission_value: orderData.professional_commission_value || 0,
      professional_commission_status: 'pending',
      opened_at: new Date().toISOString()
    })
    .select()
    .single()

  if (orderError) throw new Error(`Erro ao criar OS: ${orderError.message}`)

  // 2. Criar Itens
  if (items && items.length > 0) {
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
      project_type: orderData.project_type,
      professional_commission_value: orderData.professional_commission_value,
      professional_commission_status: orderData.professional_commission_status,
      scheduled_at: orderData.scheduled_at,
      customer_signature_url: orderData.customer_signature_url,
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

  if (items && items.length > 0) {
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

export async function getPendingServiceOrders(studioId: string) {
  await guardModule('service_orders', { studioId })
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      customer:students(id, name)
    `)
    .eq('studio_id', studioId)
    .eq('payment_status', 'pending')
    .in('status', ['finished', 'in_progress', 'open'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Erro ao buscar OS pendentes: ${error.message}`)
  return data
}

export async function deleteServiceOrder(id: string, studioId: string) {
  await guardModule('service_orders')
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('service_orders')
    .delete()
    .eq('id', id)
    .eq('studio_id', studioId)

  if (error) throw new Error(`Erro ao excluir OS: ${error.message}`)
  
  revalidatePath('/dashboard/os')
  return { success: true }
}

export async function getStudentsForOS(studioId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, name, email, phone')
    .eq('studio_id', studioId)
    .order('name')
  
  if (error) throw error
  return data
}

export async function getProfessionalsForOS(studioId: string, types?: Array<'technician' | 'engineer' | 'architect' | 'other'>) {
  const supabase = await createClient()
  let query = supabase
    .from('professionals')
    .select('id, name, professional_type') // Incluir professional_type
    .eq('studio_id', studioId)
    .eq('status', 'active')

  if (types && types.length > 0) {
    query = query.in('professional_type', types)
  }
  
  const { data, error } = await query.order('name')
  
  if (error) throw error
  return data
}

export async function getProductsForOS(studioId: string) {
  const supabase = await createClient()
  
  // Buscamos todas as colunas possíveis para garantir compatibilidade entre esquemas
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, selling_price, current_stock, quantity')
    .eq('studio_id', studioId)
    .eq('status', 'active')
    .order('name')
  
  if (error) {
    // Se der erro de coluna não existente, tentamos o fallback manual
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('products')
      .select('*')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('name')
    
    if (fallbackError) throw new Error(`Erro ao buscar produtos: ${fallbackError.message}`)
    
    return fallbackData.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price || p.selling_price || 0),
      current_stock: Number(p.current_stock ?? p.quantity ?? 0)
    }))
  }

  // Mapeia para o formato esperado pelo componente, preferindo valores preenchidos
  return data.map(p => ({
    id: p.id,
    name: p.name,
    price: Number(p.price || p.selling_price || 0),
    current_stock: Number(p.current_stock ?? p.quantity ?? 0)
  }))
}

async function handleFinishOrder(orderId: string, studioId: string, amount: number, customerId: string) {
  const supabase = await createClient()
  
  // Buscar configuração do business_model
  const { data: studio } = await supabase
    .from('studios')
    .select('business_model')
    .eq('id', studioId)
    .single()
    
  const businessModel = studio?.business_model || 'CREDIT'
  
  if (businessModel === 'CREDIT') {
      // Se for CREDIT, tenta debitar créditos do aluno
      const creditsToDebit = Math.ceil(amount)
      const { error: creditError } = await supabase.rpc('adjust_student_credits', {
          p_student_id: customerId,
          p_studio_id: studioId,
          p_amount: -creditsToDebit
      })

      if (creditError) {
          console.error("Erro ao debitar créditos na finalização da OS:", creditError)
      } else if (creditsToDebit > 0) {
          // Registrar cobrança no financeiro (uso de crédito em serviço/OS)
          const { data: order } = await supabase
            .from('service_orders')
            .select('description')
            .eq('id', orderId)
            .single()
          const today = new Date().toISOString().split('T')[0]
          const refMonth = new Date().toISOString().slice(0, 7)
          await supabase.from('payments').insert({
            studio_id: studioId,
            student_id: customerId,
            amount: 0,
            due_date: today,
            payment_date: today,
            status: 'paid',
            payment_method: 'credit',
            reference_month: refMonth,
            description: `Serviço: ${order?.description || `OS #${orderId.substring(0, 8)}`}`,
            payment_source: 'credit_usage',
            reference_id: orderId,
            credits_used: creditsToDebit,
          })
      }
  } else {
      // MONETARY (Padrão): Gerar Pagamento Pendente
      if (amount > 0) {
          await supabase.from('payments').insert({
              studio_id: studioId,
              student_id: customerId,
              service_order_id: orderId,
              amount: amount,
              due_date: new Date().toISOString().split('T')[0],
              status: 'pending',
              reference_month: new Date().toISOString().slice(0, 7),
              description: `Referente à OS #${orderId.substring(0, 8)}`,
              payment_method: 'other',
              payment_source: 'service_order',
          })
      }
   }
  
  // Atualizar payment_status da OS para 'pending' se a venda foi gerada aqui
  await supabase
    .from('service_orders')
    .update({ payment_status: 'pending' })
    .eq('id', orderId);
  
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

// --- Documents Actions ---

export async function getServiceOrderDocuments(orderId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('service_order_documents')
        .select('*')
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(`Erro ao buscar documentos: ${error.message}`)
    return data
}

export async function createServiceOrderDocument(data: any, studioId: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    const { error } = await supabase
        .from('service_order_documents')
        .insert({
            ...data,
            studio_id: studioId,
            uploaded_by: user.user?.id
        })

    if (error) throw new Error(`Erro ao anexar documento: ${error.message}`)
    revalidatePath('/dashboard/os')
}

export async function deleteServiceOrderDocument(id: string, studioId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('service_order_documents')
        .delete()
        .eq('id', id)
        .eq('studio_id', studioId)

    if (error) throw new Error(`Erro ao excluir documento: ${error.message}`)
    revalidatePath('/dashboard/os')
}

export async function signServiceOrderDocument(id: string, studioId: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    const { error } = await supabase
        .from('service_order_documents')
        .update({
            signed_at: new Date().toISOString(),
            signed_by_id: user.user?.id
        })
        .eq('id', id)
        .eq('studio_id', studioId)

    if (error) throw new Error(`Erro ao assinar documento: ${error.message}`)
    revalidatePath('/dashboard/os')
}

export async function updateServiceOrderStatus(id: string, status: string, studioId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('service_orders')
        .update({ status })
        .eq('id', id)
        .eq('studio_id', studioId)

    if (error) throw new Error(`Erro ao atualizar status do projeto: ${error.message}`)
    
    // Log history
    await supabase.from('service_order_history').insert({
        studio_id: studioId,
        service_order_id: id,
        new_status: status,
        notes: `Status alterado pelo engenheiro para ${status}`
    })

    revalidatePath('/dashboard/os')
    revalidatePath(`/solutions/fire-protection/engineer/projetos/${id}`)
    return { success: true }
}

export async function getServiceOrderMilestones(orderId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('service_order_milestones')
        .select('*')
        .eq('service_order_id', orderId)
        .order('order_index', { ascending: true })

    if (error) throw new Error(`Erro ao buscar marcos: ${error.message}`)
    return data
}

export async function createServiceOrderMilestone(data: any, studioId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('service_order_milestones')
        .insert({
            ...data,
            studio_id: studioId
        })

    if (error) throw new Error(`Erro ao criar marco: ${error.message}`)
    revalidatePath('/dashboard/os')
}

export async function updateMilestoneStatus(id: string, status: 'pending' | 'completed' | 'cancelled', studioId: string, assignedProfessionalId?: string) {
    const supabase = await createClient()
    const updateData: any = { 
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null
    }
    
    if (assignedProfessionalId) {
        updateData.assigned_professional_id = assignedProfessionalId
    }

    const { error } = await supabase
        .from('service_order_milestones')
        .update(updateData)
        .eq('id', id)
        .eq('studio_id', studioId)

    if (error) throw new Error(`Erro ao atualizar status do marco: ${error.message}`)
    revalidatePath('/dashboard/os')
}

export async function deleteMilestone(id: string, studioId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('service_order_milestones')
        .delete()
        .eq('id', id)
        .eq('studio_id', studioId)

    if (error) throw new Error(`Erro ao excluir marco: ${error.message}`)
    revalidatePath('/dashboard/os')
}

// --- Comments Actions ---

export async function getServiceOrderComments(orderId: string, studioId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('service_order_comments')
        .select(`
            *,
            user:auth.users(email)
        `)
        .eq('service_order_id', orderId)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: true })

    if (error) throw new Error(`Erro ao buscar comentários: ${error.message}`)
    
    // Fallback manual para nome de usuário se não tiver relação direta com tabela de users (dependendo da configuração do supabase)
    // O ideal seria fazer join com a tabela de perfis (students, teachers, professionals, users_internal)
    // Mas para simplificar, vamos usar o email do auth.users se disponível, ou buscar o nome.
    
    return data
}

export async function createServiceOrderComment(orderId: string, studioId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
        .from('service_order_comments')
        .insert({
            service_order_id: orderId,
            studio_id: studioId,
            user_id: user.id,
            content
        })

    if (error) throw new Error(`Erro ao adicionar comentário: ${error.message}`)
    revalidatePath('/dashboard/os')
}
