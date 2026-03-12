"use server"

import { createClient } from '@/lib/supabase/server'
import { guardModule } from '@/lib/modules-server'
import logger from '@/lib/logger'

export interface Product {
  id: string
  name: string
  category: string
  quantity: number
  min_quantity: number
  cost_price: number
  selling_price: number
  price_in_credits?: number
  price_in_currency?: number
  sku?: string
  ncm?: string // Adicionado campo NCM
  image_url?: string
  status: 'active' | 'archived'
}

export interface Transaction {
  id: string
  type: 'in' | 'out' | 'sale' | 'adjustment'
  quantity: number
  reason: string
  created_at: string
  product?: { name: string }
  payment_method?: string
  student_id?: string // Adicionar esta linha
}

/**
 * Busca produto por código de barras (SKU)
 */
export async function getProductBySku(sku: string, studioId: string) {
  await guardModule('inventory', { studioId })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('studio_id', studioId)
    .eq('sku', sku)
    .maybeSingle()

  if (error) {
    logger.error('Erro ao buscar por SKU:', error)
    return null
  }
  
  return data as Product | null
}

/**
 * Busca o inventário com cálculo de valuation (valor total em estoque)
 */
export async function getInventory(studioId: string) {
  await guardModule('inventory', { studioId })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('studio_id', studioId)
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) throw error

  // Cálculo de KPIs de Estoque
  const totalItems = data.reduce((acc, curr) => acc + curr.quantity, 0)
  const totalCostValue = data.reduce((acc, curr) => acc + (curr.quantity * curr.cost_price), 0)
  const totalSalesValue = data.reduce((acc, curr) => acc + (curr.quantity * curr.selling_price), 0)
  const potentialProfit = totalSalesValue - totalCostValue

  return {
    products: data as Product[],
    stats: {
      totalItems,
      totalCostValue,
      totalSalesValue,
      potentialProfit
    }
  }
}

/**
 * Cria um novo produto
 */
export async function createProduct(productData: any, studioId: string) {
  await guardModule('inventory', { studioId })
  const supabase = await createClient()
  const sku = productData.sku?.toString?.()?.trim?.()
  const existingProduct = sku ? await getProductBySku(sku, studioId) : null

  if (existingProduct) {
    // Se o produto com o mesmo SKU já existe, atualiza o estoque e, opcionalmente, os preços
    const newQuantity = existingProduct.quantity + (productData.quantity || 0)
    const updatedProduct = await updateProduct(existingProduct.id, {
      quantity: newQuantity,
      // Pode adicionar lógica para recalcular cost_price e selling_price se necessário
      // Por exemplo, uma média ponderada ou manter o existente
      // Para simplicidade, vamos manter os preços existentes ou atualizá-los se forem passados explicitamente
      cost_price: productData.cost_price || existingProduct.cost_price,
      selling_price: productData.selling_price || existingProduct.selling_price,
    }, studioId)

    // Registrar transação de entrada para o estoque adicionado
    await registerTransaction(
      existingProduct.id,
      'in',
      productData.quantity || 0,
      `Entrada de estoque via ERP (SKU unificado)`, 
      studioId,
      productData.cost_price // Usar o custo do novo lote
    )

    return updatedProduct
  } else {
    // Se não existe, cria um novo produto (apenas campos válidos para a tabela)
    const insertData: Record<string, unknown> = {
      studio_id: studioId,
      name: productData.name || 'Produto sem nome',
      category: productData.category || 'Geral',
      quantity: productData.quantity ?? 0,
      min_quantity: productData.min_quantity ?? 5,
      cost_price: productData.cost_price ?? 0,
      selling_price: productData.selling_price ?? 0,
      status: 'active',
    }
    const skuVal = productData.sku?.toString?.()?.trim?.()
    if (skuVal) insertData.sku = skuVal
    // Se sku vazio, não enviamos (evita conflito UNIQUE com outros produtos sem SKU)
    if (productData.ncm?.trim()) insertData.ncm = productData.ncm.trim()
    if (productData.description?.trim()) insertData.description = productData.description.trim()
    if (productData.image_url?.trim()) insertData.image_url = productData.image_url.trim()

    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error('createProduct insert error:', error)
      throw new Error(error.message || 'Erro ao salvar produto no estoque')
    }

    // Registrar transação de entrada para estoque inicial (aparece em Últimas Movimentações)
    const initialQty = productData.quantity ?? 0
    if (data && initialQty > 0) {
      await registerTransaction(
        data.id,
        'in',
        initialQty,
        'Entrada Via Cadastro',
        studioId,
        productData.cost_price
      )
    }

    return data
  }
}

/**
 * Atualiza um produto existente
 */
export async function updateProduct(productId: string, updates: Partial<Product>, studioId: string) {
  await guardModule('inventory', { studioId })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .eq('studio_id', studioId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Remove (arquiva) um produto - Soft Delete
 */
export async function deleteProduct(productId: string, studioId: string) {
  await guardModule('inventory', { studioId })
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ status: 'archived' }) // Soft delete em vez de exclusão permanente
    .eq('id', productId)
    .eq('studio_id', studioId)

  if (error) {
    logger.error('Erro ao arquivar produto:', error)
    throw error
  }
  return true
}

/**
 * Registra movimentação de estoque (O Coração do Sistema)
 * Atualiza o saldo do produto e cria o log simultaneamente
 */
export async function registerTransaction(
  productId: string, 
  type: 'in' | 'out' | 'sale' | 'adjustment', 
  quantity: number, 
  reason: string,
  studioId: string,
  unitPrice?: number, // Preço unitário específico para esta transação (opcional)
  paymentMethod?: string, // Novo parâmetro
  studentId?: string // Novo parâmetro
) {
  await guardModule('inventory', { studioId })
  const supabase = await createClient()
  // 1. Buscar produto atual para validações
  const { data: product } = await supabase
    .from('products')
    .select('quantity, selling_price, cost_price')
    .eq('id', productId)
    .single()

  if (!product) throw new Error('Produto não encontrado')

  // Validação de Estoque Negativo
  if ((type === 'out' || type === 'sale') && product.quantity < quantity) {
    throw new Error(`Estoque insuficiente. Atual: ${product.quantity}`)
  }

  // 2. Calcular novo saldo e Custo Médio Ponderado (se for entrada)
  let newQuantity = type === 'in' 
    ? product.quantity + quantity 
    : product.quantity - quantity

  let newCostPrice = product.cost_price

  // Lógica de Custo Médio Ponderado:
  // (Valor Total Antigo + Valor Total Novo) / Quantidade Total Nova
  if (type === 'in' && unitPrice !== undefined && unitPrice > 0) {
    const currentTotalValue = product.quantity * product.cost_price
    const incomingTotalValue = quantity * unitPrice
    // Evita divisão por zero se for o primeiro item
    if (newQuantity > 0) {
      newCostPrice = (currentTotalValue + incomingTotalValue) / newQuantity
    } else {
      newCostPrice = unitPrice
    }
  }

  // 3. Atualizar Produto
  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      quantity: newQuantity,
      cost_price: newCostPrice 
    })
    .eq('id', productId)

  if (updateError) throw updateError

  // 4. Criar Log de Transação (Audit Trail)
  const transactionPrice = unitPrice !== undefined ? unitPrice : (type === 'in' ? product.cost_price : product.selling_price)

  const txInsert: Record<string, unknown> = {
    studio_id: studioId,
    product_id: productId,
    type,
    quantity,
    unit_price: transactionPrice,
    reason,
    total_value: quantity * transactionPrice
  }
  if (paymentMethod) txInsert.payment_method = paymentMethod
  if (studentId) txInsert.student_id = studentId

  const { error: logError } = await supabase
    .from('inventory_transactions')
    .insert(txInsert)

  if (logError) logger.error('Erro ao logar transação:', logError)

  return true
}

/**
 * Busca histórico de transações recentes
 */
export async function getRecentTransactions(studioId: string) {
  await guardModule('inventory', { studioId })
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory_transactions')
    .select('*, product:products(name)')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })
    .limit(10)

  return data as Transaction[]
}
