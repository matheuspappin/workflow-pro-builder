'use server'

import { createClient } from '@/lib/supabase/server'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'

export async function getServerOrganizationConfig(studioId: string) {
  try {
    const client = await createClient()
    
    const { data: studio } = await client
      .from('studios')
      .select('enabled_modules, name')
      .eq('id', studioId)
      .single()
    
    return {
      studioId,
      user: { id: studioId }, // Simplificado
      niche: 'general',
      vocabulary: {},
      enabledModules: studio?.enabled_modules || {}
    }
  } catch (error) {
    logger.error('Erro ao buscar config do estúdio:', error)
    return null
  }
}

export interface AIChatUpgradeOptions {
  studioId: string
  planId?: string
  enableAIChat: boolean
  customApiKey?: {
    provider: 'openai' | 'google'
    apiKey: string
  }
}

export async function checkAIChatAvailability(studioId: string): Promise<{
  available: boolean
  currentPlan: string
  canUpgrade: boolean
  upgradeOptions: Array<{
    planName: string
    price: number
    features: string[]
  }>
}> {
  try {
    // 1. Buscar configuração atual do estúdio
    const config = await getServerOrganizationConfig(studioId)
    
    if (!config) {
      return {
        available: false,
        currentPlan: 'Unknown',
        canUpgrade: false,
        upgradeOptions: []
      }
    }
    
    // 2. Verificar se AI Chat está disponível no plano atual
    const hasAIChat = config.enabledModules?.ai_chat || false
    
    // 3. Buscar planos disponíveis com AI Chat
    const { data: plans } = await supabase
      .from('system_plans')
      .select('name, price, features, modules')
      .contains('modules', ['ai_chat'])
      .eq('status', 'active')
      .order('price', { ascending: true })
    
    const upgradeOptions = (plans || []).map(plan => ({
      planName: plan.name,
      price: plan.price,
      features: plan.features || []
    }))
    
    // 4. Verificar se pode fazer upgrade
    const canUpgrade = upgradeOptions.length > 0 && !hasAIChat
    
    return {
      available: hasAIChat,
      currentPlan: 'Professional', // Hardcoded por enquanto
      canUpgrade,
      upgradeOptions
    }
    
  } catch (error) {
    logger.error('Erro ao verificar disponibilidade AI Chat:', error)
    return {
      available: false,
      currentPlan: 'Unknown',
      canUpgrade: false,
      upgradeOptions: []
    }
  }
}

export async function enableAIChatForStudio(options: AIChatUpgradeOptions): Promise<{
  success: boolean
  message: string
  requiresPayment?: boolean
  paymentUrl?: string
}> {
  try {
    const { studioId, enableAIChat, customApiKey } = options
    
    // 1. Verificar se estúdio pode habilitar AI Chat
    const availability = await checkAIChatAvailability(studioId)
    
    if (!enableAIChat) {
      // Desativar AI Chat
      await updateStudioAIChatStatus(studioId, false)
      return {
        success: true,
        message: 'AI Chat desativado com sucesso.'
      }
    }
    
    if (availability.available) {
      // Já está disponível, apenas ativar
      await updateStudioAIChatStatus(studioId, true)
      
      // Salvar API key customizada se fornecida
      if (customApiKey) {
        await saveCustomAPIKey(studioId, customApiKey)
      }
      
      return {
        success: true,
        message: 'AI Chat ativado com sucesso!'
      }
    }
    
    if (!availability.canUpgrade) {
      return {
        success: false,
        message: 'AI Chat não está disponível para seu plano atual.'
      }
    }
    
    // 2. Processar upgrade do plano
    const upgradePlan = availability.upgradeOptions[0] // Plano mais barato com AI Chat
    
    if (upgradePlan.price > 0) {
      // Requer pagamento
      const paymentUrl = await generateUpgradePaymentUrl(studioId, upgradePlan.planName)
      
      return {
        success: false,
        message: `Upgrade para plano ${upgradePlan.planName} necessário para habilitar AI Chat.`,
        requiresPayment: true,
        paymentUrl
      }
    }
    
    // Upgrade gratuito (se houver)
    await processPlanUpgrade(studioId, upgradePlan.planName)
    await updateStudioAIChatStatus(studioId, true)
    
    if (customApiKey) {
      await saveCustomAPIKey(studioId, customApiKey)
    }
    
    return {
      success: true,
      message: `AI Chat ativado com upgrade para plano ${upgradePlan.planName}!`
    }
    
  } catch (error) {
    logger.error('Erro ao habilitar AI Chat:', error)
    return {
      success: false,
      message: 'Erro ao processar solicitação. Tente novamente.'
    }
  }
}

async function updateStudioAIChatStatus(studioId: string, enabled: boolean): Promise<void> {
  try {
    // Atualizar módulos do estúdio
    const { data: currentModules } = await supabase
      .from('studios')
      .select('enabled_modules')
      .eq('id', studioId)
      .single()
    
    const updatedModules = {
      ...(currentModules?.enabled_modules || {}),
      ai_chat: enabled
    }
    
    await supabase
      .from('studios')
      .update({ enabled_modules: updatedModules })
      .eq('id', studioId)
    
    // Log da mudança
    logger.info('AI Chat status atualizado', {
      studioId,
      enabled,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    logger.error('Erro ao atualizar status AI Chat:', error)
    throw error
  }
}

async function saveCustomAPIKey(
  studioId: string, 
  apiKey: { provider: 'openai' | 'google'; apiKey: string }
): Promise<void> {
  try {
    await supabase
      .from('studio_api_keys')
      .upsert({
        studio_id: studioId,
        service_name: apiKey.provider,
        api_key: apiKey.apiKey,
        created_at: new Date().toISOString()
      })
      .eq('studio_id', studioId)
      .eq('service_name', apiKey.provider)
    
    logger.info('API key customizada salva', {
      studioId,
      provider: apiKey.provider
    })
    
  } catch (error) {
    logger.error('Erro ao salvar API key:', error)
    throw error
  }
}

async function generateUpgradePaymentUrl(
  studioId: string, 
  planName: string
): Promise<string> {
  // Implementar integração com Stripe ou similar
  // Por agora, retorna URL simulada
  return `/checkout?studio=${studioId}&plan=${planName}&feature=ai_chat`
}

async function processPlanUpgrade(studioId: string, planName: string): Promise<void> {
  try {
    // 1. Buscar detalhes do plano
    const { data: plan } = await supabase
      .from('system_plans')
      .select('modules, features')
      .eq('name', planName)
      .single()
    
    if (!plan) {
      throw new Error('Plano não encontrado')
    }
    
    // 2. Atualizar plano do estúdio
    await supabase
      .from('studios')
      .update({ 
        plan_name: planName,
        enabled_modules: plan.modules,
        updated_at: new Date().toISOString()
      })
      .eq('id', studioId)
    
    logger.info('Plano atualizado com sucesso', {
      studioId,
      planName,
      features: plan.features
    })
    
  } catch (error) {
    logger.error('Erro ao processar upgrade:', error)
    throw error
  }
}

export async function getAIChatUsageStats(studioId: string): Promise<{
  totalInteractions: number
  thisMonth: number
  averageResponseTime: string
  topIntents: Array<{ intent: string; count: number }>
}> {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // 1. Total de interações
    const { count: totalInteractions } = await supabase
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
    
    // 2. Interações deste mês
    const { count: thisMonth } = await supabase
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .gte('created_at', firstDayOfMonth.toISOString())
    
    // 3. Top intenções
    const { data: intentStats } = await supabase
      .from('ai_interactions')
      .select('intent_type')
      .eq('studio_id', studioId)
      .gte('created_at', firstDayOfMonth.toISOString())
    
    const intentCounts = (intentStats || []).reduce((acc: any, item: any) => {
      acc[item.intent_type] = (acc[item.intent_type] || 0) + 1
      return acc
    }, {})
    
    const topIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return {
      totalInteractions: totalInteractions || 0,
      thisMonth: thisMonth || 0,
      averageResponseTime: '2.3s', // Simulado
      topIntents
    }
    
  } catch (error) {
    logger.error('Erro ao buscar estatísticas AI Chat:', error)
    return {
      totalInteractions: 0,
      thisMonth: 0,
      averageResponseTime: '0s',
      topIntents: []
    }
  }
}
