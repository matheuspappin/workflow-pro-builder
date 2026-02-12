import { cache } from "react"
import { getAuthenticatedClient } from "@/lib/server-utils"
import { normalizeModules, ModuleKey } from "@/config/modules"

/**
 * Retorna as configurações completas do ecossistema no lado do servidor.
 * Memoizado por requisição para evitar múltiplas consultas ao banco.
 */
export const getServerOrganizationConfig = cache(async () => {
  const supabase = await getAuthenticatedClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users_internal')
    .select('studio_id')
    .eq('id', user.id)
    .single()

  if (!profile?.studio_id) return null

  const { data: settings } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('studio_id', profile.studio_id)
    .single()

  return {
    studioId: profile.studio_id,
    user,
    niche: settings?.niche || 'dance',
    vocabulary: settings?.vocabulary || null,
    enabledModules: normalizeModules(settings?.enabled_modules)
  }
})

/**
 * Utilitário de Servidor para garantir que um módulo está ativo.
 */
export async function guardModule(moduleKey: ModuleKey) {
  const config = await getServerOrganizationConfig()
  
  if (!config) {
    throw new Error("Não foi possível carregar as configurações da organização.")
  }

  if (!config.enabledModules[moduleKey]) {
    console.error(`❌ Acesso bloqueado: Módulo [${moduleKey}] está desativado para o estúdio ${config.studioId}`)
    throw new Error(`O módulo ${moduleKey} não está ativo para sua conta.`)
  }

  return { studioId: config.studioId, user: config.user }
}
