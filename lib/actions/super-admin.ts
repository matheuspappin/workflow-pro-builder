"use server"

import { supabase as supabaseClient } from "@/lib/supabase"
import { getAuthenticatedClient, getAdminClient } from "@/lib/server-utils"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

/**
 * Verifica se o usuário atual é Super Admin de forma robusta
 */
async function checkSuperAdmin(accessToken?: string) {
  // 1. Tentar obter usuário
  let user = null;
  const authClient = await getAuthenticatedClient()
  const adminClient = await getAdminClient()

  // Tentativa 1: SSR
  if (authClient) {
    const { data: { user: authUser } } = await authClient.auth.getUser()
    if (authUser) user = authUser
  }

  // Tentativa 2: Token explícito
  if (!user && accessToken && adminClient) {
    const { data: { user: tokenUser } } = await adminClient.auth.getUser(accessToken)
    if (tokenUser) user = tokenUser
  }

  // Tentativa 3: Cookie Fallback
  if (!user && adminClient) {
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-auth-token')?.value || cookieStore.get('sb-access-token')?.value
    if (token) {
      const validator = adminClient || createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user: tokenUser } } = await validator.auth.getUser(token)
      if (tokenUser) user = tokenUser
    }
  }

  if (!user) {
    console.error('❌ checkSuperAdmin: Usuário não identificado')
    return false
  }

  // Debug
  console.log(`🔍 checkSuperAdmin: Verificando user ${user.id} (${user.email})`)
  console.log(`   Metadata Role: ${user.user_metadata?.role}`)

  // 2. Verificar Permissões
  // Regra de Ouro: VendasLaChef é Super Admin
  if (user.email?.toLowerCase() === 'vendaslachef@gmail.com') return true

  // Verifica metadata (cache rápido)
  const role = user.user_metadata?.role
  if (role === 'super_admin') return true
  
  // Verifica na tabela users_internal (fonte da verdade segura)
  // Usa adminClient para bypass de RLS se possível, ou authClient como fallback
  const dbReader = adminClient || authClient
  if (!dbReader) return false

  const { data: profile } = await dbReader
    .from('users_internal')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'super_admin') {
    console.log(`✅ checkSuperAdmin: Acesso concedido via DB (users_internal)`)
    return true
  }
  
  console.warn(`⛔ checkSuperAdmin: Acesso NEGADO para ${user.email}. Role DB: ${profile?.role}`)
  return false
}

/**
 * Busca estatísticas globais do sistema para o Dashboard
 */
export async function getGlobalSystemStats(accessToken?: string) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    throw new Error("Unauthorized Access")
  }

  const authClient = await getAuthenticatedClient()
  const adminClient = await getAdminClient()
  const client = adminClient || authClient || supabaseClient

  // 1. Total de Tenants e Status
  const { count: totalTenants } = await client
    .from('studios')
    .select('*', { count: 'exact', head: true })

  // 2. Tenants por Nicho (Agregação)
  const { data: settings } = await client
    .from('organization_settings')
    .select('niche, enabled_modules')

  const nicheDistribution: Record<string, number> = {}
  const moduleAdoption: Record<string, number> = {}

  settings?.forEach((setting) => {
    // Nichos
    const niche = setting.niche || 'dance' // default
    nicheDistribution[niche] = (nicheDistribution[niche] || 0) + 1

    // Módulos
    if (setting.enabled_modules) {
      Object.entries(setting.enabled_modules).forEach(([mod, enabled]) => {
        if (enabled) {
          moduleAdoption[mod] = (moduleAdoption[mod] || 0) + 1
        }
      })
    }
  })

  // Formatando para Recharts
  const nicheChartData = Object.entries(nicheDistribution).map(([name, value]) => ({ name, value }))
  const moduleChartData = Object.entries(moduleAdoption)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value) // Mais usados primeiro


  // 3. Receita Recorrente (Estimativa baseada em planos ativos)
  // Usamos a tabela studios que tem o campo 'plan' vinculado a 'system_plans'
  // Como não existe chave estrangeira explícita no banco, fazemos a junção manualmente ou via código
  // Mas o ideal é tentar via join se o Supabase detectar a relação (fk implícita ou explícita)
  // Verificando o schema: studios.plan (varchar) -> system_plans.id (varchar)
  // Se não houver FK, o join falha. Vamos tentar buscar os studios e depois somar os preços.
  
  const { data: activeStudios, error } = await client
    .from('studios')
    .select('plan')
    .eq('status', 'active');

  if (error) {
    console.error("Erro ao buscar estúdios ativos para MRR:", error);
    throw new Error("Não foi possível buscar os dados de MRR.");
  }

  // Buscar preços dos planos para calcular
  const { data: plans } = await client
    .from('system_plans')
    .select('id, price');

  const plansMap = new Map(plans?.map(p => [p.id, p.price]) || []);
  
  const mrr = activeStudios.reduce((total, studio: any) => {
    const price = plansMap.get(studio.plan) || 0;
    return total + price;
  }, 0);

  return {
    overview: {
      totalTenants: totalTenants || 0,
      activeTenants: totalTenants || 0, // Ajustar lógica de ativo
      mrr: mrr,
      churnRate: 0 // Implementar lógica de churn
    },
    nicheData: nicheChartData,
    moduleData: moduleChartData
  }
}

/**
 * Busca lista detalhada de tenants
 */
export async function getTenantsList(page = 1, limit = 10, accessToken?: string) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    console.error('❌ getTenantsList: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  const authClient = await getAuthenticatedClient()
  const adminClient = await getAdminClient()
  // Prefira adminClient para garantir acesso total
  const client = adminClient || authClient || supabaseClient

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await client
    .from('studios')
    .select(`
      id, 
      name, 
      created_at, 
      slug,
      organization_settings ( niche, vocabulary ),
      studio_settings ( setting_key, setting_value )
    `, { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ getTenantsList: Erro ao buscar dados', error)
    throw error
  }

  return { tenants: data, total: count }
}

/**
 * Deleta um tenant (empresa) e seus dados associados.
 */
export async function deleteTenant(tenantId: string, accessToken?: string) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    console.error('❌ deleteTenant: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  const adminClient = await getAdminClient()
  if (!adminClient) {
    throw new Error("Could not create admin client.")
  }

  // A política de RLS CASCADE deve cuidar de todas as tabelas filhas
  const { error } = await adminClient
    .from('studios')
    .delete()
    .eq('id', tenantId)

  if (error) {
    console.error('❌ deleteTenant: Erro ao deletar tenant', error)
    throw error
  }

  return { success: true }
}

/**
 * Atualiza configurações de um tenant específico (Feature Toggle, Nicho e Vocabulário)
 */
export async function updateTenantSettings(
  tenantId: string, 
  data: { 
    modules?: any; 
    niche?: string;
    vocabulary?: any;
  }, 
  accessToken?: string
) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) throw new Error("Unauthorized")
  
  const authClient = await getAuthenticatedClient()
  const adminClient = await getAdminClient()
  const client = adminClient || authClient || supabaseClient

  const updateData: any = {}
  if (data.modules) updateData.enabled_modules = data.modules
  if (data.niche) updateData.niche = data.niche
  if (data.vocabulary) updateData.vocabulary = data.vocabulary

  const { error } = await client
    .from('organization_settings')
    .update(updateData)
    .eq('studio_id', tenantId)

  if (error) throw error
  return { success: true }
}

export async function updateTenantModules(tenantId: string, modules: any, accessToken?: string) {
  return updateTenantSettings(tenantId, { modules }, accessToken)
}

/**
 * Busca ou cria um token de convite para um estúdio
 */
export async function getOrCreateStudioInvite(studioId: string, accessToken?: string) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    console.error('❌ getOrCreateStudioInvite: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  const adminClient = await getAdminClient()
  if (!adminClient) {
    throw new Error("Could not create admin client.")
  }

  // 1. Verificar se existe um convite ativo e não expirado
  const now = new Date().toISOString()
  let { data: invite, error: fetchError } = await adminClient
    .from('studio_invites')
    .select('token')
    .eq('studio_id', studioId)
    .is('used_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('❌ Erro ao buscar convite existente:', fetchError)
    throw fetchError
  }

  // 2. Se existir, retorna o token
  if (invite) {
    return { token: invite.token }
  }

  // 3. Se não existir, cria um novo
  const { data: authData } = await adminClient.auth.getUser(accessToken)
  const created_by = authData.user?.id

  if (!created_by) {
    throw new Error("Não foi possível identificar o usuário para criar o convite.")
  }

  const newToken = crypto.randomUUID()
  const expires_at = new Date()
  expires_at.setDate(expires_at.getDate() + 365) // Válido por 1 ano

  const { data: newInvite, error: insertError } = await adminClient
    .from('studio_invites')
    .insert({
      studio_id: studioId,
      token: newToken,
      created_by: created_by,
      expires_at: expires_at.toISOString(),
    })
    .select('token')
    .single()

  if (insertError) {
    console.error('❌ Erro ao criar novo convite:', insertError)
    throw insertError
  }

  return { token: newInvite.token }
}

/**
 * Exclui um estúdio permanentemente
 */
export async function deleteStudio(studioId: string, accessToken?: string) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    console.error('❌ deleteStudio: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  const adminClient = await getAdminClient()
  if (!adminClient) {
     throw new Error("Could not create admin client.")
  }

  // Excluir estúdio (Cascade cuidará do resto)
  const { error } = await adminClient
    .from('studios')
    .delete()
    .eq('id', studioId)

  if (error) {
    console.error('❌ Erro ao deletar estúdio:', error)
    throw error
  }

  return { success: true }
}

/**
 * Exclui um parceiro/afiliado permanentemente
 */
export async function deletePartner(partnerId: string, accessToken?: string) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    console.error('❌ deletePartner: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  const adminClient = await getAdminClient()
  if (!adminClient) {
    throw new Error("Could not create admin client.")
  }

  // Busca o user_id do parceiro antes de excluir para poder excluir o usuário do Auth também
  const { data: partner } = await adminClient
    .from('partners')
    .select('user_id')
    .eq('id', partnerId)
    .maybeSingle()

  // Excluir parceiro (Cascade pode não cuidar do Auth User)
  const { error } = await adminClient
    .from('partners')
    .delete()
    .eq('id', partnerId)

  if (error) {
    console.error('❌ deletePartner: Erro ao deletar parceiro', error)
    throw error
  }

  // Se tiver user_id, exclui também do Supabase Auth
  if (partner?.user_id) {
    const { error: authError } = await adminClient.auth.admin.deleteUser(partner.user_id)
    if (authError) {
      console.warn('⚠️ deletePartner: Parceiro excluído do DB, mas falha ao excluir do Auth:', authError.message)
    }
  }

  return { success: true }
}

/**
 * Busca lista de parceiros/afiliados
 */
export async function getPartnersList(page = 1, limit = 10, accessToken?: string) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    console.error('❌ getPartnersList: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  const authClient = await getAuthenticatedClient()
  const adminClient = await getAdminClient()
  const client = adminClient || authClient || supabaseClient

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await client
    .from('partners')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  console.log('🔍 getPartnersList result:', { data_length: data?.length, count, error })

  if (error) {
    console.error('❌ getPartnersList: Erro ao buscar parceiros', error)
    throw error
  }

  return { partners: data, total: count }
}

/**
 * Atualiza um parceiro
 */
export async function updatePartner(
  partnerId: string, 
  data: { 
    name?: string;
    slug?: string;
    commission_rate?: number;
  }, 
  accessToken?: string
) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    console.error('❌ updatePartner: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  const adminClient = await getAdminClient()
  if (!adminClient) {
    throw new Error("Could not create admin client.")
  }

  // Verifica slug se foi alterado
  if (data.slug) {
     const { data: existing } = await adminClient
       .from('partners')
       .select('id')
       .eq('slug', data.slug)
       .neq('id', partnerId)
       .maybeSingle()
     
     if (existing) {
       throw new Error("Este slug já está em uso por outro afiliado.")
     }
  }

  const { error } = await adminClient
    .from('partners')
    .update(data)
    .eq('id', partnerId)

  return { success: true }
}

/**
 * Cria ou atualiza um plano do sistema
 */
export async function saveSystemPlan(planData: any, accessToken?: string) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    console.error('❌ saveSystemPlan: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  const adminClient = await getAdminClient()
  if (!adminClient) {
    throw new Error("Could not create admin client.")
  }

  const { error } = await adminClient
    .from('system_plans')
    .upsert(planData)

  if (error) {
    console.error('❌ saveSystemPlan: Erro ao salvar plano', error)
    throw error
  }

  return { success: true }
}

/**
 * Exclui um plano do sistema
 */
export async function deleteSystemPlan(planId: string, accessToken?: string) {
  const isAdmin = await checkSuperAdmin(accessToken)
  if (!isAdmin) {
    console.error('❌ deleteSystemPlan: Acesso negado (não é Super Admin)')
    throw new Error("Unauthorized")
  }

  const adminClient = await getAdminClient()
  if (!adminClient) {
    throw new Error("Could not create admin client.")
  }

  const { error } = await adminClient
    .from('system_plans')
    .delete()
    .eq('id', planId)

  if (error) {
    console.error('❌ deleteSystemPlan: Erro ao excluir plano', error)
    throw error
  }

  return { success: true }
}

