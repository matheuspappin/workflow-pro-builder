/**
 * Resolve limites de plano por estúdio.
 * Usa verticalization_plans quando o estúdio tem verticalization_plan_id,
 * senão usa system_plans / PLAN_LIMITS.
 */

import { supabaseAdmin } from "@/lib/supabase-admin"
import { PLAN_LIMITS } from "./plan-limits"

/**
 * Retorna o limite de profissionais (max_teachers) para um estúdio.
 * Respeita verticalization_plans quando o estúdio pertence a uma verticalização.
 */
export async function getProfessionalsLimitForStudio(studioId: string): Promise<number> {
  const { data: studio } = await supabaseAdmin
    .from("studios")
    .select("plan, verticalization_plan_id")
    .eq("id", studioId)
    .maybeSingle()

  if (!studio) return PLAN_LIMITS.gratuito.maxProfessionals

  if (studio.verticalization_plan_id) {
    const { data: vp } = await supabaseAdmin
      .from("verticalization_plans")
      .select("max_teachers")
      .eq("id", studio.verticalization_plan_id)
      .maybeSingle()
    const limit = vp?.max_teachers
    if (typeof limit === "number" && limit > 0) return limit
  }

  const plan = studio.plan || "gratuito"
  const normId = plan.toLowerCase().replace("pro+", "pro-plus")
  const limits = PLAN_LIMITS[normId] || PLAN_LIMITS.gratuito
  return limits.maxProfessionals
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
