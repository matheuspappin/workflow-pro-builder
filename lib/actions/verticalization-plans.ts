"use server"

import { getAuthenticatedClient, getAdminClient } from "@/lib/server-utils"
import logger from "@/lib/logger"
import { logAdmin } from "@/lib/admin-logs"
export interface VerticalizationPlanData {
  plan_id: string
  name: string
  price: number
  description?: string
  features?: string[]
  max_students?: number
  max_teachers?: number
  modules?: Record<string, boolean>
  is_popular?: boolean
  status?: 'active' | 'inactive'
  trial_days?: number
}

export interface VerticalizationPlanRecord extends VerticalizationPlanData {
  id: string
  verticalization_id: string
  stripe_price_id?: string
  created_at: string
  updated_at?: string
}

async function assertSuperAdmin(accessToken?: string) {
  const { getAuthenticatedClient, getAdminClient } = await import("@/lib/server-utils")
  const { createClient } = await import("@supabase/supabase-js")
  const { cookies } = await import("next/headers")

  let user = null
  const authClient = await getAuthenticatedClient()
  const adminClient = await getAdminClient()

  if (authClient) {
    const { data: { user: authUser } } = await authClient.auth.getUser()
    if (authUser) user = authUser
  }

  if (!user && accessToken) {
    const validator = adminClient || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user: tokenUser } } = await validator.auth.getUser(accessToken)
    if (tokenUser) user = tokenUser
  }

  if (!user) {
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-auth-token')?.value || cookieStore.get('sb-access-token')?.value
    if (token && adminClient) {
      const { data: { user: cookieUser } } = await adminClient.auth.getUser(token)
      if (cookieUser) user = cookieUser
    }
  }

  if (!user) throw new Error("Não autorizado: Sessão inválida. Faça login novamente.")

  const dbClient = adminClient || await getAuthenticatedClient()
  if (!dbClient) throw new Error("Erro interno: cliente de banco indisponível.")

  const { data: profile } = await dbClient
    .from('users_internal')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isSuperAdmin =
    profile?.role === 'super_admin' ||
    user.user_metadata?.role === 'super_admin' ||
    user.app_metadata?.role === 'super_admin'

  if (!isSuperAdmin) throw new Error("Permissão negada: Apenas Super Admins podem gerenciar planos de verticalizações.")

  return { dbClient }
}

export async function getVerticalizationPlans(verticalizationId: string): Promise<VerticalizationPlanRecord[]> {
  try {
    const adminClient = await getAdminClient()
    const authClient = await getAuthenticatedClient()
    const dbClient = adminClient || authClient

    if (!dbClient) return []

    const { data, error } = await dbClient
      .from('verticalization_plans')
      .select('*')
      .eq('verticalization_id', verticalizationId)
      .order('price', { ascending: true })

    if (error) {
      logger.error('❌ Erro ao buscar planos da verticalização:', error)
      return []
    }

    return (data || []).map((p: any) => ({
      ...p,
      modules: (p.modules && typeof p.modules === 'object') ? p.modules : {},
      features: Array.isArray(p.features) ? p.features : [],
    }))
  } catch (err) {
    logger.error('❌ Exceção ao buscar planos:', err)
    return []
  }
}

export async function getVerticalizationPlansBySlug(slug: string): Promise<VerticalizationPlanRecord[]> {
  try {
    const adminClient = await getAdminClient()
    const authClient = await getAuthenticatedClient()
    const dbClient = adminClient || authClient

    if (!dbClient) return []

    const { data: vertical, error: vError } = await dbClient
      .from('verticalizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (vError || !vertical) return []

    return getVerticalizationPlans(vertical.id)
  } catch (err) {
    logger.error('❌ Exceção ao buscar planos por slug:', err)
    return []
  }
}

export async function createVerticalizationPlan(
  verticalizationId: string,
  data: VerticalizationPlanData,
  accessToken?: string
): Promise<VerticalizationPlanRecord> {
  logger.info('📋 Criando plano da verticalização:', data.name)

  const { dbClient } = await assertSuperAdmin(accessToken)

  const planId = (data.plan_id || data.name)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const { data: plan, error } = await dbClient
    .from('verticalization_plans')
    .insert({
      verticalization_id: verticalizationId,
      plan_id: planId,
      name: data.name,
      price: data.price,
      description: data.description || null,
      features: data.features || [],
      max_students: data.max_students ?? 10,
      max_teachers: data.max_teachers ?? 1,
      modules: data.modules || {},
      is_popular: data.is_popular ?? false,
      status: data.status ?? 'active',
      trial_days: data.trial_days ?? 14,
    })
    .select()
    .single()

  if (error) {
    logger.error('❌ Erro ao criar plano:', error)
    if (error.code === '23505') {
      throw new Error(`Já existe um plano com o ID "${planId}" nesta verticalização.`)
    }
    throw new Error(`Erro ao salvar: ${error.message}`)
  }

  logger.info('✅ Plano criado:', plan.id)
  await logAdmin('success', 'super-admin/verticalization-plan', `Plano "${data.name}" criado na verticalização ${verticalizationId}`, {
    metadata: { planId: plan.id, verticalizationId, plan_id: planId },
  })
  return { ...plan, modules: plan.modules || {}, features: plan.features || [] }
}

export async function updateVerticalizationPlan(
  id: string,
  data: Partial<VerticalizationPlanData>,
  accessToken?: string
): Promise<VerticalizationPlanRecord> {
  logger.info('✏️ Atualizando plano:', id)

  const { dbClient } = await assertSuperAdmin(accessToken)

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.name !== undefined) updatePayload.name = data.name
  if (data.price !== undefined) updatePayload.price = data.price
  if (data.description !== undefined) updatePayload.description = data.description
  if (data.features !== undefined) updatePayload.features = data.features
  if (data.max_students !== undefined) updatePayload.max_students = data.max_students
  if (data.max_teachers !== undefined) updatePayload.max_teachers = data.max_teachers
  if (data.modules !== undefined) updatePayload.modules = data.modules
  if (data.is_popular !== undefined) updatePayload.is_popular = data.is_popular
  if (data.status !== undefined) updatePayload.status = data.status
  if (data.trial_days !== undefined) updatePayload.trial_days = data.trial_days

  const { data: plan, error } = await dbClient
    .from('verticalization_plans')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('❌ Erro ao atualizar plano:', error)
    throw new Error(`Erro ao atualizar: ${error.message}`)
  }

  await logAdmin('info', 'super-admin/verticalization-plan', `Plano ${id} atualizado`, { metadata: { planId: id, changes: Object.keys(updatePayload) } })
  return { ...plan, modules: plan.modules || {}, features: plan.features || [] }
}

export async function deleteVerticalizationPlan(id: string, accessToken?: string): Promise<void> {
  logger.info('🗑️ Deletando plano:', id)

  const { dbClient } = await assertSuperAdmin(accessToken)

  const { error } = await dbClient
    .from('verticalization_plans')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('❌ Erro ao deletar plano:', error)
    throw new Error(`Erro ao deletar: ${error.message}`)
  }

  await logAdmin('warning', 'super-admin/verticalization-plan', `Plano ${id} deletado`, { metadata: { planId: id } })
}
