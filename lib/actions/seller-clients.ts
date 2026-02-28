'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Actions para Vendedores (Seller) ---

// Obtém a lista de clientes cadastrados pelo vendedor
export async function getSellerClients(sellerId: string, studioId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('seller_id', sellerId)
    .eq('studio_id', studioId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Erro ao buscar clientes do vendedor:', error.message)
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }
  return data
}

// Cria um novo cliente associado ao vendedor
export async function createClientBySeller(data: any, sellerId: string, studioId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('students').insert({
    ...data,
    seller_id: sellerId,
    studio_id: studioId,
    status: 'active', // Ou o status inicial padrão
  })

  if (error) {
    console.error('Erro ao criar cliente pelo vendedor:', error.message)
    throw new Error(`Erro ao criar cliente: ${error.message}`)
  }
  revalidatePath('/seller/clientes')
  return { success: true }
}

// Atualiza um cliente existente do vendedor
export async function updateClientBySeller(clientId: string, data: any, sellerId: string, studioId: string) {
  const supabase = await createClient()

  // Garante que o vendedor só possa atualizar seus próprios clientes
  const { data: existingClient, error: fetchError } = await supabase
    .from('students')
    .select('id')
    .eq('id', clientId)
    .eq('seller_id', sellerId)
    .eq('studio_id', studioId)
    .single()

  if (fetchError || !existingClient) {
    console.error('Cliente não encontrado ou não pertence ao vendedor:', fetchError?.message)
    throw new Error('Cliente não encontrado ou você não tem permissão para editá-lo.')
  }

  const { error } = await supabase
    .from('students')
    .update(data)
    .eq('id', clientId)
    .eq('seller_id', sellerId) // Reforça a segurança RLS
    .eq('studio_id', studioId)

  if (error) {
    console.error('Erro ao atualizar cliente pelo vendedor:', error.message)
    throw new Error(`Erro ao atualizar cliente: ${error.message}`)
  }
  revalidatePath('/seller/clientes')
  return { success: true }
}

// Deleta um cliente do vendedor
export async function deleteClientBySeller(clientId: string, sellerId: string, studioId: string) {
  const supabase = await createClient()

  // Garante que o vendedor só possa deletar seus próprios clientes
  const { data: existingClient, error: fetchError } = await supabase
    .from('students')
    .select('id')
    .eq('id', clientId)
    .eq('seller_id', sellerId)
    .eq('studio_id', studioId)
    .single()

  if (fetchError || !existingClient) {
    console.error('Cliente não encontrado ou não pertence ao vendedor:', fetchError?.message)
    throw new Error('Cliente não encontrado ou você não tem permissão para deletá-lo.')
  }

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', clientId)
    .eq('seller_id', sellerId) // Reforça a segurança RLS
    .eq('studio_id', studioId)

  if (error) {
    console.error('Erro ao deletar cliente pelo vendedor:', error.message)
    throw new Error(`Erro ao deletar cliente: ${error.message}`)
  }
  revalidatePath('/seller/clientes')
  return { success: true }
}
