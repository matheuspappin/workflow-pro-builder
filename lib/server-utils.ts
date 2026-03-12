import { cookies } from "next/headers"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import logger from "@/lib/logger"

/**
 * Cria um cliente do Supabase autenticado usando cookies (para Server Actions e Route Handlers)
 * Usa createClient de @/lib/supabase/server para consistência com o resto do app.
 */
export async function getAuthenticatedClient() {
  try {
    const { createClient: createServerSupabase } = await import('@/lib/supabase/server')
    const ssrClient = await createServerSupabase()

    const { data: { user }, error } = await ssrClient.auth.getUser()
    if (error) {
      logger.debug('getAuthenticatedClient: auth error', error.message)
      return null
    }
    if (user) return ssrClient

    // Fallback: tokens em cookies legados (sb-access-token, sb-auth-token)
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-access-token')?.value ||
      cookieStore.get('sb-auth-token')?.value ||
      cookieStore.getAll().find(c => c.name.includes('auth-token') && c.value.length > 20)?.value

    if (token) {
      const manualClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      )
      try {
        const { data: { user: manualUser } } = await manualClient.auth.getUser(token)
        if (manualUser) return manualClient
      } catch {
        logger.debug('Manual token getUser failed')
      }
    }

    return null
  } catch (error) {
    logger.error('Erro ao criar cliente autenticado:', error)
  }
  return null
}

/**
 * Cria um cliente do Supabase com privilégios de admin (Service Role)
 * USE COM CAUTELA - IGNORA RLS
 */
let cachedAdminClient: SupabaseClient | null = null;

export async function getAdminClient() {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceKey) {
    logger.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente')
    return null
  }

  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }
      }
    )
    cachedAdminClient = adminClient as SupabaseClient;
    return adminClient;
  } catch (error) {
    logger.error('Erro ao criar cliente admin:', error)
    return null
  }
}
