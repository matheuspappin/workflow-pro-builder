"use server"

import { getAuthenticatedClient, getAdminClient } from "@/lib/server-utils"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import logger from "@/lib/logger"
import { generateUniqueSlug } from "@/lib/utils/slug"
import { logAdmin } from "@/lib/admin-logs"

export interface VerticalData {
  name: string
  slug?: string
  description: string
  niche: string
  icon_name: string
  icon_color: string
  icon_bg: string
  landing_url?: string
  admin_url?: string
  status: 'active' | 'beta' | 'coming_soon'
  tags: string[]
  modules?: Record<string, boolean>
  accessToken?: string
}

export interface VerticalRecord extends Omit<VerticalData, 'accessToken'> {
  id: string
  slug: string
  created_at: string
  updated_at?: string
  created_by?: string
  modules: Record<string, boolean>
  stats?: {
    tenants: number
    users: number
    mrr: number
  }
}

async function resolveUser(accessToken?: string) {
  let user = null
  let authClient = await getAuthenticatedClient()
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
    if (token) {
      const validator = adminClient || createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user: cookieUser } } = await validator.auth.getUser(token)
      if (cookieUser) user = cookieUser
    }
  }

  return { user, adminClient }
}

async function assertSuperAdmin(accessToken?: string) {
  const { user, adminClient } = await resolveUser(accessToken)

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

  if (!isSuperAdmin) throw new Error("Permissão negada: Apenas Super Admins podem gerenciar verticalizações.")

  return { user, dbClient }
}

export async function createVerticalization(data: VerticalData) {
  logger.info('🚀 Criando nova verticalização:', data.name)

  const { user, dbClient } = await assertSuperAdmin(data.accessToken)

  const slug = data.slug?.trim()
    ? data.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : await generateUniqueSlug(data.name, 'verticalizations')

  const adminUrl = data.admin_url || `/admin/verticalizations/${slug}`
  const landingUrl = data.landing_url || `/solutions/${slug}`

  const { data: vertical, error } = await dbClient
    .from('verticalizations')
    .insert({
      name: data.name,
      slug,
      description: data.description,
      niche: data.niche,
      icon_name: data.icon_name,
      icon_color: data.icon_color,
      icon_bg: data.icon_bg,
      landing_url: landingUrl,
      admin_url: adminUrl,
      status: data.status,
      tags: data.tags,
      modules: data.modules || {},
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    logger.error('❌ Erro ao criar verticalização:', error)
    if (error.code === '23505') {
      throw new Error(`Já existe uma verticalização com o slug "${slug}". Escolha outro nome.`)
    }
    throw new Error(`Erro ao salvar: ${error.message}`)
  }

  logger.info('✅ Verticalização criada com ID:', vertical.id)
  await logAdmin('success', 'super-admin/verticalization', `Verticalização "${data.name}" criada (slug: ${slug})`, { metadata: { verticalId: vertical.id, slug, niche: data.niche, createdBy: user.id } })
  return { success: true, vertical }
}

export async function getVerticalizations(): Promise<VerticalRecord[]> {
  try {
    const adminClient = await getAdminClient()
    const authClient = await getAuthenticatedClient()
    const dbClient = adminClient || authClient

    if (!dbClient) {
      logger.warn('⚠️ Sem cliente DB para buscar verticalizações, usando fallback.')
      return []
    }

    const { data: verticals, error } = await dbClient
      .from('verticalizations')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('❌ Erro ao buscar verticalizações:', error)
      return []
    }

    const { data: nicheCounts } = await dbClient
      .from('organization_settings')
      .select('niche, studio_id')

    const countsByNiche: Record<string, number> = {}
    nicheCounts?.forEach(row => {
      if (row.niche) {
        countsByNiche[row.niche] = (countsByNiche[row.niche] || 0) + 1
      }
    })

    // Studios sem organization_settings (sem niche) contam para a primeira vertical ativa
    const studiosWithSettings = new Set((nicheCounts || []).map((r: any) => r.studio_id).filter(Boolean))
    const { data: allStudios } = await dbClient.from('studios').select('id')
    const studiosWithoutSettings = (allStudios || []).filter((s: any) => !studiosWithSettings.has(s.id)).length

    // A vertical de dança absorve os studios sem niche definido
    const danceNicheKey = verticals?.find(v => v.slug === 'estudio-de-danca')?.niche || 'dance'

    return (verticals || []).map(v => ({
      ...v,
      tags: Array.isArray(v.tags) ? v.tags : [],
      modules: (v.modules && typeof v.modules === 'object') ? v.modules : {},
      stats: {
        tenants: (countsByNiche[v.niche] || 0) + (v.niche === danceNicheKey ? studiosWithoutSettings : 0),
        users: 0,
        mrr: 0,
      }
    }))
  } catch (err) {
    logger.error('❌ Exceção ao buscar verticalizações:', err)
    return []
  }
}

export async function getVerticalizationBySlug(slug: string): Promise<VerticalRecord | null> {
  try {
    const adminClient = await getAdminClient()
    const authClient = await getAuthenticatedClient()
    const dbClient = adminClient || authClient

    if (!dbClient) return null

    const { data: vertical, error } = await dbClient
      .from('verticalizations')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error || !vertical) return null

    const { data: nicheCounts } = await dbClient
      .from('organization_settings')
      .select('studio_id')
      .eq('niche', vertical.niche)

    return {
      ...vertical,
      tags: Array.isArray(vertical.tags) ? vertical.tags : [],
      modules: (vertical.modules && typeof vertical.modules === 'object') ? vertical.modules : {},
      stats: {
        tenants: nicheCounts?.length || 0,
        users: 0,
        mrr: 0,
      }
    }
  } catch (err) {
    logger.error('❌ Erro ao buscar verticalização por slug:', err)
    return null
  }
}

export async function updateVerticalization(
  id: string,
  data: Partial<Omit<VerticalData, 'accessToken'>> & { accessToken?: string }
): Promise<VerticalRecord> {
  logger.info('✏️ Atualizando verticalização:', id)

  const { accessToken, ...updateData } = data
  const { dbClient } = await assertSuperAdmin(accessToken)

  const { data: vertical, error } = await dbClient
    .from('verticalizations')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('❌ Erro ao atualizar verticalização:', error)
    throw new Error(`Erro ao atualizar: ${error.message}`)
  }

  logger.info('✅ Verticalização atualizada com sucesso')
  await logAdmin('info', 'super-admin/verticalization', `Verticalização ${id} atualizada: ${Object.keys(updateData).join(', ')}`, { metadata: { verticalId: id, changes: Object.keys(updateData) } })
  return {
    ...vertical,
    tags: Array.isArray(vertical.tags) ? vertical.tags : [],
    modules: (vertical.modules && typeof vertical.modules === 'object') ? vertical.modules : {},
  }
}

export async function updateVerticalizationModules(
  id: string,
  modules: Record<string, boolean>,
  accessToken?: string
): Promise<void> {
  logger.info('🧩 Atualizando módulos da verticalização:', id)

  const { dbClient } = await assertSuperAdmin(accessToken)

  const { error } = await dbClient
    .from('verticalizations')
    .update({ modules, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    logger.error('❌ Erro ao atualizar módulos:', error)
    throw new Error(`Erro ao atualizar módulos: ${error.message}`)
  }

  logger.info('✅ Módulos atualizados com sucesso')
  await logAdmin('info', 'super-admin/verticalization', `Módulos da verticalização ${id} atualizados`, { metadata: { verticalId: id, modules } })
}

export async function deleteVerticalization(id: string, accessToken?: string): Promise<void> {
  logger.info('🗑️ Deletando verticalização:', id)

  const { dbClient } = await assertSuperAdmin(accessToken)

  const { error } = await dbClient
    .from('verticalizations')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('❌ Erro ao deletar verticalização:', error)
    throw new Error(`Erro ao deletar: ${error.message}`)
  }

  logger.info('✅ Verticalização deletada')
  await logAdmin('warning', 'super-admin/verticalization', `Verticalização ${id} deletada permanentemente`, { metadata: { verticalId: id } })
}

export interface TenantRow {
  id: string
  name: string
  slug: string
  created_at: string
}

export async function getTenantsForVerticalization(niche: string): Promise<TenantRow[]> {
  try {
    const adminClient = await getAdminClient()
    const authClient = await getAuthenticatedClient()
    const dbClient = adminClient || authClient

    if (!dbClient) return []

    const { data: nicheSettings, error: settingsError } = await dbClient
      .from('organization_settings')
      .select('studio_id')
      .eq('niche', niche)

    if (settingsError) {
      logger.error('❌ Erro ao buscar organization_settings por niche:', settingsError)
      return []
    }

    const studioIds = (nicheSettings || []).map((s: any) => s.studio_id).filter(Boolean)

    if (studioIds.length === 0) return []

    const { data: studios, error: studiosError } = await dbClient
      .from('studios')
      .select('id, name, slug, created_at')
      .in('id', studioIds)
      .order('created_at', { ascending: false })
      .limit(10)

    if (studiosError) {
      logger.error('❌ Erro ao buscar studios por IDs:', studiosError)
      return []
    }

    return studios || []
  } catch (err) {
    logger.error('❌ Exceção ao buscar tenants da verticalização:', err)
    return []
  }
}
