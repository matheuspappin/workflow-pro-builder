import { cache } from "react"
import { getAuthenticatedClient } from "@/lib/server-utils"
import { normalizeModules, ModuleKey } from "@/config/modules"
import logger from '@/lib/logger';

/**
 * Retorna as configurações completas do ecossistema no lado do servidor.
 * Memoizado por requisição para evitar múltiplas consultas ao banco.
 */
export const getServerOrganizationConfig = cache(async () => {
  const supabase = await getAuthenticatedClient()
  if (!supabase) return null

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    // Only log if it's an error, otherwise silent (user not logged in)
    if (userError) logger.error('getServerOrganizationConfig: Auth error', userError)
    return null
  }

  // 1. Tentar obter studio_id via metadata (mais rápido e robusto para usuários manuais)
  let studioId = user.user_metadata?.studio_id

  if (!studioId) {
    // 2. Se não tiver metadata, tenta users_internal
    const { data: profile } = await supabase
      .from('users_internal')
      .select('studio_id')
      .eq('id', user.id)
      .maybeSingle()
    
    if (profile?.studio_id) {
      studioId = profile.studio_id
    } else {
       // 3. Fallback para teachers e students
       const { data: teacher } = await supabase.from('teachers').select('studio_id').eq('user_id', user.id).maybeSingle()
       if (teacher?.studio_id) {
         studioId = teacher.studio_id
       } else {
         const { data: student } = await supabase.from('students').select('studio_id').eq('id', user.id).maybeSingle()
         if (student?.studio_id) studioId = student.studio_id
       }
    }
  }

  if (!studioId) {
    logger.warn(`getServerOrganizationConfig: User ${user.id} has no studio_id linked`)
    return null
  }

  const { data: settings } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('studio_id', studioId)
    .maybeSingle()

  return {
    studioId: studioId,
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
    // Tenta obter o usuário para log mais detalhado
    const supabase = await getAuthenticatedClient()
    const { data: { user } } = await supabase?.auth.getUser() || { data: {} }
    
    if (user) {
      logger.error(`guardModule: Falha ao carregar config para usuário ${user.id} tentando acessar ${moduleKey}`)
    } else {
      logger.warn(`guardModule: Tentativa de acesso não autenticado ao módulo ${moduleKey}`)
    }
    
    throw new Error("Não foi possível carregar as configurações da organização. Verifique se você está logado e vinculado a um estúdio.")
  }

  // Check if it's super_admin to bypass module check
  // Removido bypass para respeitar as configurações do builder
  // const isSuperAdmin = config.user.user_metadata?.role === 'super_admin'

  if (!config.enabledModules[moduleKey]) {
    logger.error(`❌ Acesso bloqueado: Módulo [${moduleKey}] está desativado para o estúdio ${config.studioId}`)
    throw new Error(`O módulo ${moduleKey} não está ativo para sua conta.`)
  }

  return { studioId: config.studioId, user: config.user }
}
