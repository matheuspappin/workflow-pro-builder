'use server'

import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'
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
    logger.error('Erro ao buscar marketplace:', error)
  }

  return data as MarketplaceSettings | null
}

export async function updateMarketplaceSettings(studioId: string, settings: Partial<MarketplaceSettings>) {
  await guardModule('marketplace')
  logger.debug('DEBUG_SERVER: Tentando salvar configurações do marketplace para studioId:', studioId, 'com settings:', settings);
  const { error } = await supabase
    .from('marketplace_settings')
    .upsert({
      studio_id: studioId,
      ...settings,
      updated_at: new Date().toISOString()
    })

  if (error) {
    logger.error('DEBUG_SERVER: ERRO ao salvar marketplace:', error);
    throw new Error(error.message); // Re-lança o erro para ser capturado no frontend
  }
  logger.debug('DEBUG_SERVER: Configurações do marketplace salvas com sucesso para studioId:', studioId);
  revalidatePath('/dashboard/marketplace')
}

// --- Área Pública (Storefront) ---

export async function getStoreBySlug(slug: string) {
  logger.debug('DEBUG: Buscando loja pelo slug:', slug)
  
  const { data: store, error } = await supabase
    .from('marketplace_settings')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    logger.error('DEBUG: Erro no banco ao buscar loja:', error)
    return null
  }

  if (!store) {
    logger.warn('DEBUG: Nenhuma loja encontrada com o slug:', slug)
    return null
  }

  logger.debug('DEBUG: Loja encontrada:', store.store_name, 'Ativa:', store.is_active)

  if (!store.is_active) {
    logger.warn('DEBUG: Loja encontrada, mas está DESATIVADA:', slug)
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
    logger.error('DEBUG: Erro ao buscar produtos:', productsError)
    return { store, products: [] }
  }

  logger.debug('DEBUG: Produtos encontrados para a loja:', products.length)
  return { store, products }
}
