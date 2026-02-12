"use server"

import { getAuthenticatedClient, getAdminClient } from "@/lib/server-utils"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

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

    // 1. Obter o studio_id do usuário (lógica simplificada, idealmente via contexto ou metadados seguros)
    // Tenta obter via users_internal primeiro
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
    console.error("Erro ao ativar módulo:", error)
    return { success: false, error: error.message }
  }
}
