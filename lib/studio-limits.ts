/**
 * Resolve limites de plano por estúdio.
 * Prioridade: 1) professionals_tier (theme_config), 2) verticalization_plans, 3) PLAN_LIMITS.
 */

import { supabaseAdmin } from "@/lib/supabase-admin"
import { PLAN_LIMITS } from "./plan-limits"
import { getTierLimit } from "@/config/professional-tiers"

/**
 * Retorna o limite de profissionais (max_teachers) para um estúdio.
 * Respeita professionals_tier em organization_settings.theme_config quando definido.
 */
export async function getProfessionalsLimitForStudio(studioId: string): Promise<number> {
  const { data: orgSettings } = await supabaseAdmin
    .from("organization_settings")
    .select("theme_config")
    .eq("studio_id", studioId)
    .maybeSingle()

  const tierId = orgSettings?.theme_config?.professionals_tier
  if (tierId) {
    const limit = getTierLimit(tierId)
    if (limit > 0) return limit
  }

  const { data: studio } = await supabaseAdmin
    .from("studios")
    .select("plan, verticalization_plan_id")
    .eq("id", studioId)
    .maybeSingle()

  if (!studio) return getTierLimit("1-10")

  if (studio.verticalization_plan_id) {
    const { data: vp } = await supabaseAdmin
      .from("verticalization_plans")
      .select("max_teachers")
      .eq("id", studio.verticalization_plan_id)
      .maybeSingle()
    const limit = vp?.max_teachers
    if (typeof limit === "number" && limit > 0) return limit
  }

  const plan = studio.plan || "custom"
  const normId = plan.toLowerCase().replace("pro+", "pro-plus")
  const limits = PLAN_LIMITS[normId]
  if (limits) return limits.maxProfessionals

  return getTierLimit("1-10")
}

/**
 * Verifica se o estúdio atingiu o limite de profissionais.
 */
export async function isProfessionalsLimitReachedForStudio(
  studioId: string,
  currentCount: number
): Promise<boolean> {
  const limit = await getProfessionalsLimitForStudio(studioId)
  return currentCount >= limit
}
