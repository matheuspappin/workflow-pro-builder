'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { guardModule } from '@/lib/modules-server'
import logger from '@/lib/logger'

// --- Tipos ---
export type BusinessType = 'dance_school' | 'tattoo_studio' | 'gym' | 'clinic' | 'generic'

export interface OrganizationSettings {
  id: string
  business_type: BusinessType
  nomenclature: Record<string, string>
  theme_config: any
}

export interface IntegrationChannel {
  id: string
  name: string
  platform: string
  status: 'active' | 'inactive' | 'error' | 'syncing'
  last_sync: string | null
  config?: {
    metric_label?: string
    metric_value?: number | null
    metric_unit?: string
    color?: string
  }
}

export interface B2BPartner {
  name: string
  orderCount: number
  totalSpend: number
  lastOrder: string
}

export interface B2BStats {
  partners: B2BPartner[]
  totalPartners: number
  totalGMV: number
  avgOrderValue: number
  activeThisMonth: number
}

export interface ERPOrder {
  id: string
  external_id: string
  customer_name: string
  total_amount: number
  status: string
  channel_id: string
  items: any[]
  shipping_info?: { tracking_code: string, carrier: string, status: string }
  created_at: string
  integration_channels?: { name: string }
}

export interface Supplier {
  id: string
  name: string
  contact_name: string
  email: string
  category: string
}

export interface PurchaseOrder {
  id: string
  ref?: string // Adicionado via código, não no banco
  supplier_id: string
  status: 'draft' | 'sent' | 'received' | 'cancelled'
  total_amount: number
  items: any[]
  expected_date: string
  suppliers?: { name: string } // Join
  created_at: string
}

// --- Configuração do Negócio ---

export async function getOrganizationSettings(studioId: string) {
  await guardModule('erp')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('studio_id', studioId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 é "not found"
    logger.error('Erro ao buscar configs:', error)
  }

  // Se não existir, retorna default (Workflow AI padrão)
  if (!data) {
    return {
      business_type: 'generic',
      nomenclature: { client: "Cliente", service: "Serviço", professional: "Profissional" }
    }
  }

  return data
}

export async function updateBusinessType(studioId: string, type: BusinessType) {
  await guardModule('erp')
  const supabase = await createClient()
  // Definições de nomenclatura por tipo
  const nomenclatureMap: Record<BusinessType, any> = {
    dance_school: { client: "Aluno", service: "Aula", professional: "Professor" },
    tattoo_studio: { client: "Cliente", service: "Sessão", professional: "Tatuador" },
    gym: { client: "Aluno", service: "Treino", professional: "Instrutor" },
    clinic: { client: "Paciente", service: "Consulta", professional: "Médico" },
    generic: { client: "Cliente", service: "Serviço", professional: "Profissional" }
  }

  const { error } = await supabase
    .from('organization_settings')
    .upsert({
      studio_id: studioId,
      business_type: type,
      nomenclature: nomenclatureMap[type] || nomenclatureMap.generic
    }, { onConflict: 'studio_id' })

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function getStudioPlan(studioId: string) {
  await guardModule('erp') // ou outro módulo que dependa do plano, como 'financial'
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('studios')
    .select('plan')
    .eq('id', studioId)
    .single()
  
  if (error) {
    logger.error('Erro ao buscar plano do estúdio:', error)
    return 'gratuito'
  }
  return data?.plan || 'gratuito'
}

// --- Canais de Integração ---

export async function getChannels(studioId: string) {
  await guardModule('erp')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('integration_channels')
    .select('*')
    .eq('studio_id', studioId)
  
  if (error) throw error
  return data as IntegrationChannel[]
}

export async function connectChannel(studioId: string, platform: string, name: string, apiKey: string) {
  await guardModule('erp')

  if (!apiKey || apiKey.trim().length < 8) {
    throw new Error('API Key inválida. Mínimo 8 caracteres.')
  }

  // Configurações de métricas padrão por plataforma — values iniciam nulos (sem dados ainda)
  const platformDefaults: Record<string, { metric_label: string; metric_unit: string; color: string }> = {
    mercadolivre: { metric_label: 'Reputação', metric_unit: '/5', color: 'green' },
    amazon:       { metric_label: 'SLA',        metric_unit: '%',  color: 'blue' },
    shopee:       { metric_label: 'Avaliação',   metric_unit: '/5', color: 'orange' },
    woocommerce:  { metric_label: 'Uptime',      metric_unit: '%',  color: 'purple' },
  }

  const config = {
    ...(platformDefaults[platform] ?? { metric_label: 'Score', metric_unit: '', color: 'gray' }),
    metric_value: null,
  }

  const supabase = await createClient()
  const { error } = await supabase.from('integration_channels').insert({
    studio_id: studioId,
    platform,
    name,
    api_key: apiKey,
    status: 'active',
    last_sync: new Date().toISOString(),
    config,
  })

  if (error) throw error
  revalidatePath('/dashboard/erp')
}

// --- Catálogo e Estoque ---

export async function getERPCatalog(studioId: string) {
  await guardModule('erp')
  const supabase = await createClient()

  // Contagem real de canais ativos — todos os produtos sincronizam com todos os canais ativos
  const { count: activeChannelsCount } = await supabase
    .from('integration_channels')
    .select('*', { count: 'exact', head: true })
    .eq('studio_id', studioId)
    .eq('status', 'active')

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('studio_id', studioId)
    .order('name')

  if (error) throw error

  return data.map(p => ({
    ...p,
    channels: activeChannelsCount ?? 0,
    stock: p.quantity,
    price: p.selling_price,
  }))
}

// --- Pedidos Unificados ---

export async function getERPOrders(studioId: string) {
  await guardModule('erp')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('erp_orders')
    .select('*, integration_channels(name)')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createPublicERPOrder(studioId: string, orderData: { customer_name: string, total_amount: number, items: any[] }) {
  // Validação de entrada rigorosa para a função pública
  if (!studioId || typeof studioId !== 'string' || studioId.trim() === '') {
    throw new Error('ID do estúdio inválido.');
  }

  if (!orderData || typeof orderData !== 'object') {
    throw new Error('Dados do pedido inválidos.');
  }

  if (!orderData.customer_name || typeof orderData.customer_name !== 'string' || orderData.customer_name.trim() === '') {
    throw new Error('Nome do cliente inválido.');
  }

  if (typeof orderData.total_amount !== 'number' || orderData.total_amount <= 0) {
    throw new Error('Valor total do pedido inválido.');
  }

  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new Error('Itens do pedido inválidos ou vazios.');
  }

  for (const item of orderData.items) {
    if (!item || typeof item !== 'object') {
      throw new Error('Item do pedido inválido.');
    }
    if (!item.product_id || typeof item.product_id !== 'string' || item.product_id.trim() === '') {
      throw new Error('ID do produto do item inválido.');
    }
    if (typeof item.qty !== 'number' || !Number.isInteger(item.qty) || item.qty <= 0) {
      throw new Error('Quantidade do item inválida.');
    }
    if (typeof item.price !== 'number' || item.price < 0) {
      throw new Error('Preço do item inválido.');
    }
  }

  const supabase = await createClient()

  // 1. Cria o Pedido ERP
  const { data: order, error: orderError } = await supabase
    .from('erp_orders')
    .insert({
      studio_id: studioId,
      customer_name: orderData.customer_name,
      total_amount: orderData.total_amount,
      status: 'pending', // Pending shipping/payment
      items: orderData.items,
      external_id: `WEB-${Date.now().toString().slice(-6)}`
    })
    .select()
    .single()

  if (orderError) throw orderError

  // 2. Atualiza Estoque e Cria Log via RPC (Atômico)
  // Filtra itens que têm product_id
  const itemsToProcess = orderData.items.filter(item => item.product_id)
  
  if (itemsToProcess.length > 0) {
    const { error: rpcError } = await supabase.rpc('process_sale_transaction', {
        p_studio_id: studioId,
        p_items: itemsToProcess,
        p_reason: `Venda Online #${order.external_id}`,
        p_user_id: null // Público
    })

    if (rpcError) {
        logger.error('Erro ao processar estoque (RPC):', rpcError)
        // Não revertemos o pedido pois ele já foi criado, mas logamos o erro.
        // Em um sistema ideal, o pedido ficaria com status "error" ou similar.
    }
  }

  return order
}

export async function createERPOrder(studioId: string, orderData: { customer_name: string, total_amount: number, items: any[] }) {
  await guardModule('erp')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Cria o Pedido ERP
  const { data: order, error: orderError } = await supabase
    .from('erp_orders')
    .insert({
      studio_id: studioId,
      customer_name: orderData.customer_name,
      total_amount: orderData.total_amount,
      status: 'pending', // Pending shipping/payment
      items: orderData.items,
      external_id: `MANUAL-${Date.now().toString().slice(-6)}`
    })
    .select()
    .single()

  if (orderError) throw orderError

  // 2. Atualiza Estoque e Cria Log via RPC (Atômico)
  const itemsToProcess = orderData.items.filter(item => item.product_id)
  
  if (itemsToProcess.length > 0) {
    const { error: rpcError } = await supabase.rpc('process_sale_transaction', {
        p_studio_id: studioId,
        p_items: itemsToProcess,
        p_reason: `Venda ERP #${order.external_id}`,
        p_user_id: user?.id || null
    })

    if (rpcError) {
        logger.error('Erro ao processar estoque (RPC):', rpcError)
        throw rpcError
    }
  }

  revalidatePath('/dashboard/erp')
  return order
}

export async function updateERPOrderStatus(studioId: string, orderId: string, newStatus: string) {
  await guardModule('erp')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('erp_orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .eq('studio_id', studioId)
    .select()
    .single()

  if (error) throw error;
  revalidatePath('/dashboard/erp');
  return data;
}

// --- Logística ---
export async function updateOrderShipping(studioId: string, orderId: string, shippingInfo: { tracking_code: string, carrier: string }) {
    await guardModule('erp')
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('erp_orders')
        .update({ 
            status: 'shipped',
            shipping_info: {
                ...shippingInfo,
                status: 'In Transit',
                updated_at: new Date().toISOString()
            }
        })
        .eq('id', orderId)
        .eq('studio_id', studioId)
        .select()
        .single()

    if (error) throw error
    revalidatePath('/dashboard/erp')
    return data
}

// --- Suprimentos (B2B) ---

export async function getSuppliers(studioId: string) {
    await guardModule('erp')
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('studio_id', studioId)
        .order('name')
    
    if (error) throw error
    return data as Supplier[]
}

export async function createSupplier(studioId: string, supplier: Partial<Supplier>) {
    await guardModule('erp')
    const supabase = await createClient()
    const { error } = await supabase
        .from('suppliers')
        .insert({ ...supplier, studio_id: studioId })
    
    if (error) throw error
    revalidatePath('/dashboard/erp')
}

export async function getPurchaseOrders(studioId: string) {
    await guardModule('erp')
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name)')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false })

    if (error) throw error
    
    // Adiciona ref fictício se não existir
    return data.map((po: any) => ({
        ...po,
        ref: `PO-${po.created_at.slice(0,4)}-${po.id.slice(0,4).toUpperCase()}`
    })) as PurchaseOrder[]
}

export async function createPurchaseOrder(studioId: string, po: { supplier_id: string, total_amount: number, items: any[], expected_date: string }) {
    await guardModule('erp')
    const supabase = await createClient()
    const { error } = await supabase
        .from('purchase_orders')
        .insert({
            studio_id: studioId,
            supplier_id: po.supplier_id,
            total_amount: po.total_amount,
            items: po.items,
            expected_date: po.expected_date,
            status: 'draft'
        })

    if (error) throw error
    revalidatePath('/dashboard/erp')
}

// --- Financeiro / NFe ---

export async function getPendingInvoices(studioId: string) {
    await guardModule('erp')
    const supabase = await createClient()
    // Busca pedidos pagos ou enviados que ainda não foram finalizados (sem nota emitida)
    const { data, error } = await supabase
        .from('erp_orders')
        .select('*, integration_channels(name)')
        .eq('studio_id', studioId)
        .in('status', ['paid', 'shipped'])
        .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
}

export async function emitInvoicesBatch(studioId: string, orderIds: string[]) {
    await guardModule('erp')
    await guardModule('fiscal')
    const supabase = await createClient()
    const results = []
    
    for (const orderId of orderIds) {
        // 1. Busca o pedido com itens
        const { data: order, error: fetchError } = await supabase
            .from('erp_orders')
            .select('*')
            .eq('id', orderId)
            .eq('studio_id', studioId)
            .single()
            
        if (fetchError || !order) continue

        try {
            // 2. Chama a API NF-e (emissor fiscal próprio)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const cookieStore = await cookies()
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            const cookie = cookieStore.toString()
            if (cookie) headers['Cookie'] = cookie

            const nfeResponse = await fetch(`${baseUrl}/api/nfe/emit`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    studio_id: studioId,
                    order_id: orderId,
                    customer: {
                        name: order.customer_name || 'Cliente',
                        email: order.customer_email || undefined,
                    },
                    items: (order.items || []).map((item: any) => ({
                        description: item.name || item.sku || 'Produto/Serviço',
                        quantity: item.qty || 1,
                        unit_price: item.price || 0,
                    })),
                    total_amount: order.total_amount,
                    payment_method: order.payment_method,
                    observations: `Pedido ${order.external_id}`,
                }),
            })

            const nfeResult = await nfeResponse.json()

            if (!nfeResponse.ok) {
                logger.error(`Erro NF-e para pedido ${orderId}:`, nfeResult)
                results.push({ order_id: order.external_id, status: 'error', error: nfeResult.error })
                continue
            }

            results.push({
                order_id: order.external_id,
                status: 'success',
                invoice_number: nfeResult.invoice_number,
                provider: nfeResult.provider,
                simulated: nfeResult.simulated || false,
            })
        } catch (err: any) {
            logger.error(`Erro ao emitir NF-e para pedido ${orderId}:`, err)
            results.push({ order_id: order.external_id, status: 'error', error: err.message })
        }
    }
    
    revalidatePath('/dashboard/erp')
    return results
}

export async function getInvoices(studioId: string) {
    await guardModule('erp')
    const supabase = await createClient()
    // Busca na tabela real de notas fiscais
    const { data, error } = await supabase
        .from('invoices')
        .select(`
            *,
            order:erp_orders(external_id, customer_name)
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false })
    
    if (error) {
        logger.error('Erro ao buscar notas fiscais:', error)
        throw error
    }
    
    return data.map(i => ({
        id: i.id,
        number: i.invoice_number,
        order_id: (i.order as any)?.external_id,
        customer: (i.order as any)?.customer_name,
        amount: i.amount,
        date: i.created_at,
        status: i.status
    }))
}

export async function downloadInvoicePDF(invoiceId: string) {
    await guardModule('erp')
    const supabase = await createClient()

    // Busca a nota no banco para pegar url real do PDF
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select('invoice_number, pdf_url, provider, simulated')
        .eq('id', invoiceId)
        .single()

    if (error || !invoice) {
        throw new Error('Nota fiscal não encontrada')
    }

    // Se tiver URL real do PDF (FocusNFe DANFE ou PlugNotas PDF)
    if (invoice.pdf_url && !invoice.simulated) {
        return {
            url: invoice.pdf_url,
            filename: `${invoice.invoice_number || `NFe-${invoiceId.slice(0,8)}`}.pdf`
        }
    }

    // Fallback: PDF de exemplo em homologação ou nota simulada
    logger.debug(`[NF-e] Nota ${invoiceId} é simulada ou sem PDF — retornando exemplo`)
    return {
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        filename: `${invoice.invoice_number || `NFe-${invoiceId.slice(0,8)}`}.pdf`,
        simulated: true,
    }
}


export async function getERPDashboardStats(studioId: string) {
  await guardModule('erp')
  const supabase = await createClient()
  // 1. Receita Omnichannel (Total de pedidos finalizados + vendas do PDV)
  const { data: revenueData } = await supabase
    .from('erp_orders')
    .select('total_amount, created_at')
    .eq('studio_id', studioId)
    .eq('status', 'finished')

  const totalRevenue = revenueData?.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) || 0
  
  // Cálculo de crescimento mensal
  const currentMonth = new Date().getMonth()
  const lastMonthRevenue = revenueData?.filter(o => new Date(o.created_at).getMonth() === currentMonth - 1)
    .reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) || 0
  
  const currentMonthRevenue = revenueData?.filter(o => new Date(o.created_at).getMonth() === currentMonth)
    .reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) || 0

  const growth = lastMonthRevenue > 0 
    ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0

  // 2. Pedidos em Aberto
  const { count: pendingOrders } = await supabase
    .from('erp_orders')
    .select('*', { count: 'exact', head: true })
    .eq('studio_id', studioId)
    .neq('status', 'finished')
    .neq('status', 'cancelled')

  const { count: pendingShipping } = await supabase
    .from('erp_orders')
    .select('*', { count: 'exact', head: true })
    .eq('studio_id', studioId)
    .eq('status', 'paid') // Pago, mas não enviado

  // 3. Logística (Envios ativos)
  const { count: activeShipments } = await supabase
    .from('erp_orders')
    .select('*', { count: 'exact', head: true })
    .eq('studio_id', studioId)
    .eq('status', 'shipped')

  // Pedidos atrasados: pagos há mais de 3 dias sem despacho
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const { count: lateOrders } = await supabase
    .from('erp_orders')
    .select('*', { count: 'exact', head: true })
    .eq('studio_id', studioId)
    .eq('status', 'paid')
    .lt('created_at', threeDaysAgo.toISOString())

  const shippedCount = activeShipments ?? 0
  const lateCount = lateOrders ?? 0
  const onTimePercentage = shippedCount + lateCount > 0
    ? Math.round((shippedCount / (shippedCount + lateCount)) * 100)
    : 100

  // 4. Canais Ativos
  const { count: activeChannels } = await supabase
    .from('integration_channels')
    .select('*', { count: 'exact', head: true })
    .eq('studio_id', studioId)
    .eq('status', 'active')

  return {
    revenue: {
      total: totalRevenue,
      growth: growth
    },
    orders: {
      pending: pendingOrders || 0,
      waiting_collection: pendingShipping || 0
    },
    logistics: {
      active: shippedCount,
      on_time_percentage: onTimePercentage
    },
    channels: {
      active: activeChannels || 0,
      total: activeChannels || 0
    }
  }
}

// --- CRM B2B ---

export async function getB2BStats(studioId: string): Promise<B2BStats> {
  await guardModule('erp')
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('erp_orders')
    .select('customer_name, total_amount, created_at')
    .eq('studio_id', studioId)
    .neq('status', 'cancelled')

  if (error) throw error

  // Agrega por cliente
  const customerMap = new Map<string, { orderCount: number; totalSpend: number; lastOrder: string }>()

  for (const order of orders ?? []) {
    const key = (order.customer_name || 'Anônimo').trim()
    const existing = customerMap.get(key)
    const amount = Number(order.total_amount) || 0
    const date = order.created_at || new Date().toISOString()

    if (existing) {
      existing.orderCount++
      existing.totalSpend += amount
      if (date > existing.lastOrder) existing.lastOrder = date
    } else {
      customerMap.set(key, { orderCount: 1, totalSpend: amount, lastOrder: date })
    }
  }

  const allCustomers = Array.from(customerMap.entries()).map(([name, data]) => ({ name, ...data }))

  // Parceiros B2B = clientes com 2+ pedidos, ordenados por volume
  const partners = allCustomers
    .filter(c => c.orderCount >= 2)
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 10)

  const now = new Date()
  const totalOrders = orders?.length ?? 0
  const totalAmount = allCustomers.reduce((acc, c) => acc + c.totalSpend, 0)

  return {
    partners,
    totalPartners: allCustomers.filter(c => c.orderCount >= 2).length,
    totalGMV: totalAmount,
    avgOrderValue: totalOrders > 0 ? totalAmount / totalOrders : 0,
    activeThisMonth: allCustomers.filter(c => {
      const d = new Date(c.lastOrder)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length,
  }
}
