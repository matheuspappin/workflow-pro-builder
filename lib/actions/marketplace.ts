'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { guardModule } from '@/lib/modules-server'

export interface MarketplaceSettings {
  studio_id: string
  store_name: string
  slug: string
  description?: string
  primary_color: string
  banner_url?: string
  is_active: boolean
  style_config?: {
    buttonStyle: 'rounded' | 'square' | 'pill'
    cardStyle: 'shadow' | 'border' | 'flat'
    welcomeTitle: string
    welcomeSubtitle: string
  }
}

// --- Configurações da Loja ---

export async function getMarketplaceSettings(studioId: string) {
  await guardModule('marketplace')
  const { data, error } = await supabase
    .from('marketplace_settings')
    .select('*')
    .eq('studio_id', studioId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar marketplace:', error)
  }

  return data as MarketplaceSettings | null
}

export async function updateMarketplaceSettings(studioId: string, settings: Partial<MarketplaceSettings>) {
  await guardModule('marketplace')
  console.log('DEBUG_SERVER: Tentando salvar configurações do marketplace para studioId:', studioId, 'com settings:', settings);
  const { error } = await supabase
    .from('marketplace_settings')
    .upsert({
      studio_id: studioId,
      ...settings,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('DEBUG_SERVER: ERRO ao salvar marketplace:', error);
    throw new Error(error.message); // Re-lança o erro para ser capturado no frontend
  }
  console.log('DEBUG_SERVER: Configurações do marketplace salvas com sucesso para studioId:', studioId);
  revalidatePath('/dashboard/marketplace')
}

// --- Área Pública (Storefront) ---

export async function getStoreBySlug(slug: string) {
  console.log('DEBUG: Buscando loja pelo slug:', slug)
  
  const { data: store, error } = await supabase
    .from('marketplace_settings')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('DEBUG: Erro no banco ao buscar loja:', error)
    return null
  }

  if (!store) {
    console.warn('DEBUG: Nenhuma loja encontrada com o slug:', slug)
    return null
  }

  console.log('DEBUG: Loja encontrada:', store.store_name, 'Ativa:', store.is_active)

  if (!store.is_active) {
    console.warn('DEBUG: Loja encontrada, mas está DESATIVADA:', slug)
    return null
  }

  // Busca produtos ativos deste estúdio
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('studio_id', store.studio_id)
    .eq('status', 'active')
    .gt('quantity', 0)

  if (productsError) {
    console.error('DEBUG: Erro ao buscar produtos:', productsError)
    return { store, products: [] }
  }

  console.log('DEBUG: Produtos encontrados para a loja:', products.length)
  return { store, products }
}
