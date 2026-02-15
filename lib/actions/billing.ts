"use server"

import { getAuthenticatedClient, getAdminClient } from "@/lib/server-utils"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import logger from "@/lib/logger"

/**
 * Ativa um módulo para um estúdio (Upsell simplificado)
 * Em produção, isso integraria com Stripe/Gateway de Pagamento
 */
export async function activateModule(moduleId: string) {
  try {
    const client = await getAuthenticatedClient()
    if (!client) throw new Error("Não autenticado")

    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error("Usuário não encontrado")

    // 1. Obter o studio_id do usuário
    // A lógica abaixo tenta determinar o 'studio_id' associado ao usuário autenticado.
    // Primeiro, verifica na tabela 'users_internal'. Se não encontrar, tenta na tabela 'teachers'.
    // Esta abordagem simplifica a obtenção do ID do estúdio para fins de demonstração/upsell simplificado.
    // Em um ambiente de produção real, o studio_id provavelmente seria gerenciado de forma mais robusta,
    // talvez via JWT, metadados de sessão seguros ou um serviço de identidade.
    let studioId = null;
    
    // Tenta users_internal
    const { data: internalUser } = await client
      .from('users_internal')
      .select('studio_id')
      .eq('id', user.id)
      .maybeSingle()
    
    if (internalUser?.studio_id) {
      studioId = internalUser.studio_id
    } else {
       // Tenta teachers
       const { data: teacher } = await client
         .from('teachers')
         .select('studio_id')
         .eq('user_id', user.id)
         .maybeSingle()
        
       if (teacher?.studio_id) studioId = teacher.studio_id
    }

    if (!studioId) throw new Error("Estúdio não identificado para o usuário")

    // 2. Buscar configurações atuais
    const { data: settings } = await client
      .from('organization_settings')
      .select('enabled_modules')
      .eq('studio_id', studioId)
      .single()

    if (!settings) throw new Error("Configurações não encontradas")

    // 3. Atualizar configurações
    const currentModules = settings.enabled_modules || {}
    const newModules = { ...currentModules, [moduleId]: true }

    const { error } = await client
      .from('organization_settings')
      .update({ enabled_modules: newModules })
      .eq('studio_id', studioId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    logger.error("Erro ao ativar módulo:", error)
    return { success: false, error: error.message }
  }
}
