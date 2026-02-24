"use server"

import { supabase } from "@/lib/supabase"
import { checkSuperAdminDetailed } from "@/lib/actions/super-admin"
import logger from "@/lib/logger"

/**
 * Busca todos os módulos do sistema com seus preços e status
 */
export async function getSystemModules() {
  const { data, error } = await supabase
    .from('system_modules')
    .select('*')
    .order('price', { ascending: true })

  if (error) {
    logger.error('❌ Erro ao buscar módulos do sistema:', error)
    return []
  }

  return data
}

/**
 * Atualiza um módulo do sistema (apenas Super Admin)
 */
export async function updateSystemModule(moduleId: string, data: any, accessToken?: string) {
  const { isAdmin, adminClient } = await checkSuperAdminDetailed(accessToken)
  
  if (!isAdmin) {
    logger.error('❌ updateSystemModule: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  if (!adminClient) {
    throw new Error("Could not create admin client.")
  }

  const { error } = await adminClient
    .from('system_modules')
    .update(data)
    .eq('id', moduleId)

  if (error) {
    logger.error('❌ updateSystemModule: Erro ao atualizar módulo', error)
    throw error
  }

  return { success: true }
}
