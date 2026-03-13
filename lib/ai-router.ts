/**
 * Roteador de IA por Nicho - Chat consultoria + WhatsApp atendimento
 * Garante que cada verticalização (DanceFlow, FireControl, AgroFlowAI) use sua API correta.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'
import { getPlugin } from '@/lib/plugins'
import type { NicheSlug } from '@/lib/plugins'

export type { NicheSlug }

/** Mapeamento niche (organization_settings) → slug da API */
const NICHE_TO_SLUG: Record<string, NicheSlug> = {
  dance: 'dance',
  fire_protection: 'fire_protection',
  agroflowai: 'agroflowai',
  environmental_compliance: 'agroflowai', // AgroFlow verticalização
}

/** Endpoints de IA por nicho — lê de lib/plugins (single source of truth) */
export const AI_ENDPOINTS: Record<NicheSlug, string> = {
  dance: getPlugin('dance').aiEndpoint,
  fire_protection: getPlugin('fire_protection').aiEndpoint,
  agroflowai: getPlugin('agroflowai').aiEndpoint,
}

/** Regras padrão de assuntos por camada - admin vê tudo, outros têm restrições */
const DEFAULT_LAYER_RULES: Record<NicheSlug, Record<string, { allowed: string[]; denied: string[] }>> = {
  dance: {
    admin: { allowed: ['turmas', 'horarios', 'financeiro', 'devedores', 'metricas', 'retencao', 'leads'], denied: [] },
    student: { allowed: ['turmas', 'horarios', 'creditos', 'agendamento'], denied: ['financeiro', 'devedores', 'metricas'] },
    lead: { allowed: ['turmas', 'horarios', 'precos', 'aula_experimental'], denied: ['financeiro', 'devedores', 'metricas', 'creditos'] },
  },
  fire_protection: {
    admin: { allowed: ['extintores', 'os', 'vistorias', 'clientes', 'financeiro', 'metricas', 'alertas'], denied: [] },
    technician: { allowed: ['os', 'vistorias', 'extintores', 'clientes'], denied: ['financeiro', 'metricas'] },
    engineer: { allowed: ['os', 'vistorias', 'extintores', 'laudos', 'clientes', 'metricas'], denied: ['financeiro'] },
    client: { allowed: ['extintores', 'vistorias', 'agendamento'], denied: ['financeiro', 'os_internas', 'metricas'] },
    lead: { allowed: ['precos', 'vistorias'], denied: ['financeiro', 'clientes', 'os'] },
  },
  agroflowai: {
    admin: { allowed: ['propriedades', 'os', 'laudos', 'clientes', 'financeiro', 'satelite', 'alertas', 'metricas'], denied: [] },
    engineer: { allowed: ['propriedades', 'os', 'laudos', 'clientes'], denied: ['financeiro', 'metricas'] },
    client: { allowed: ['propriedades', 'os', 'laudos', 'alertas'], denied: ['financeiro', 'metricas', 'outros_clientes'] },
    lead: { allowed: ['servicos', 'precos'], denied: ['financeiro', 'clientes', 'propriedades'] },
  },
}

/**
 * Obtém o niche do estúdio via organization_settings.
 * Fallback: dance (DanceFlow) para compatibilidade.
 */
export async function getStudioNiche(studioId: string): Promise<NicheSlug> {
  if (!studioId || studioId === '00000000-0000-0000-0000-000000000000') {
    return 'dance'
  }
  try {
    const { data } = await supabaseAdmin
      .from('organization_settings')
      .select('niche')
      .eq('studio_id', studioId)
      .maybeSingle()
    const niche = (data?.niche || 'dance').toLowerCase().replace(/-/g, '_')
    return (NICHE_TO_SLUG[niche] || 'dance') as NicheSlug
  } catch (e) {
    logger.warn('ai-router: Erro ao buscar niche, usando dance', e)
    return 'dance'
  }
}

/**
 * Retorna a URL base do endpoint de IA para o nicho.
 * Usado pelo webhook WhatsApp e pelo chat do dashboard.
 */
export async function getAiEndpointForStudio(studioId: string): Promise<string> {
  const niche = await getStudioNiche(studioId)
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}${AI_ENDPOINTS[niche]}`
}

/**
 * Resolve a camada do contato: admin, student, lead, technician, engineer, client.
 */
export function resolveContactLayer(
  isAdmin: boolean,
  isStudent: boolean,
  niche: NicheSlug,
  customLayer?: string
): string {
  if (customLayer && ['admin', 'student', 'lead', 'technician', 'engineer', 'client'].includes(customLayer)) {
    return customLayer
  }
  if (isAdmin) return 'admin'
  if (isStudent) return 'student'
  if (niche === 'fire_protection' || niche === 'agroflowai') return 'lead' // número desconhecido = lead
  return 'lead'
}

/**
 * Retorna instrução de camada para injetar no system prompt.
 */
export function getLayerPromptInstruction(
  niche: NicheSlug,
  contactLayer: string
): string {
  const rules = DEFAULT_LAYER_RULES[niche]?.[contactLayer] ?? DEFAULT_LAYER_RULES[niche]?.['lead'] ?? { allowed: [], denied: [] }
  if (contactLayer === 'admin') {
    return 'Você pode fornecer TODOS os dados do relatório, incluindo financeiro e métricas sensíveis. Seja um consultor e sugira ações.'
  }
  if (rules.denied.length > 0) {
    return `NUNCA mencione: ${rules.denied.join(', ')}. Use apenas: ${rules.allowed.join(', ')}.`
  }
  return `Use apenas assuntos permitidos: ${rules.allowed.join(', ')}.`
}
