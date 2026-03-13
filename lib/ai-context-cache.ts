/**
 * Cache de contexto de estúdio para endpoints de AI.
 * Reduz 5-10 queries por request ao cachear report, training, rules.
 * learnedKnowledge NÃO é cacheado (depende da mensagem do usuário).
 *
 * Usa lib/plugins para config por nicho — evita copy-paste entre dance, fire_protection, agroflowai.
 */

import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getLeadsData, getInventoryData } from '@/lib/supabase'
import { getCachedData, cacheKeys, CACHE_TTL } from '@/lib/cache/ai-cache'
import { getPlugin } from '@/lib/plugins'
import type { NicheSlug } from '@/lib/plugins'

export interface CachedStudioContextDance {
  reportRes: { data: { content?: string; created_at?: string } | null }
  trainingRes: { data: any[] }
  rulesRes: { data: { rules_text?: string } | null }
  modelSettingRes: { data: { setting_value?: string } | null }
  leadsData: Awaited<ReturnType<typeof getLeadsData>>
  invData: Awaited<ReturnType<typeof getInventoryData>>
}

export interface CachedStudioContextVertical {
  reportRes: { data: { content?: string; created_at?: string; metadata?: unknown } | null }
  trainingRes: { data: any[] }
  rulesRes: { data: { rules_text?: string } | null }
}

/** Função genérica — usa config do plugin para montar queries */
async function getCachedStudioContextGeneric(
  studioId: string,
  niche: NicheSlug
): Promise<Record<string, unknown>> {
  const plugin = getPlugin(niche)
  const cfg = plugin.contextCache
  const key = cacheKeys.studioContextByNiche(studioId, niche)

  return getCachedData(
    key,
    async () => {
      const q1 = supabaseAdmin.from('studio_ai_reports').select('content, created_at, metadata').eq('studio_id', studioId).order('created_at', { ascending: false }).limit(1).maybeSingle()
      const q2 = supabaseAdmin.from('ai_training_conversations').select('student_message, ai_response').eq('niche', niche).order('created_at', { ascending: false }).limit(cfg.trainingLimit)
      const q3 = supabaseAdmin.from('niche_ai_rules').select('rules_text').eq('niche', niche).maybeSingle()

      const queries: Promise<unknown>[] = [
        Promise.resolve(q1).then((r) => r, () => ({ data: null })),
        Promise.resolve(q2).then((r) => r, () => ({ data: [] as any[] })),
        Promise.resolve(q3).then((r) => r, () => ({ data: null })),
      ]
      if (cfg.includeModelSetting) {
        const qModel = supabaseAdmin.from('studio_settings').select('setting_value').eq('studio_id', studioId).eq('setting_key', 'ai_model').maybeSingle()
        queries.push(Promise.resolve(qModel).then((r) => r, () => ({ data: null })))
      }
      if (cfg.includeLeads) queries.push(getLeadsData(studioId))
      if (cfg.includeInventory) queries.push(getInventoryData(studioId))

      const results = await Promise.all(queries)
      let i = 0
      const out: Record<string, unknown> = {
        reportRes: results[i++],
        trainingRes: results[i++],
        rulesRes: results[i++],
      }
      if (cfg.includeModelSetting) out.modelSettingRes = results[i++]
      if (cfg.includeLeads) out.leadsData = results[i++]
      if (cfg.includeInventory) out.invData = results[i++]
      return out
    },
    CACHE_TTL.STUDIO_KNOWLEDGE
  )
}

export async function getCachedStudioContextDance(studioId: string): Promise<CachedStudioContextDance> {
  return getCachedStudioContextGeneric(studioId, 'dance') as unknown as Promise<CachedStudioContextDance>
}

export async function getCachedStudioContextAgroflowai(studioId: string): Promise<CachedStudioContextVertical> {
  return getCachedStudioContextGeneric(studioId, 'agroflowai') as unknown as Promise<CachedStudioContextVertical>
}

export async function getCachedStudioContextFireProtection(
  studioId: string
): Promise<CachedStudioContextVertical & { modelSettingRes: { data: { setting_value?: string } | null } }> {
  return getCachedStudioContextGeneric(studioId, 'fire_protection') as unknown as Promise<
    CachedStudioContextVertical & { modelSettingRes: { data: { setting_value?: string } | null } }
  >
}
