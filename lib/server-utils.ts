import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import logger from "@/lib/logger"

/**
 * Cria um cliente do Supabase autenticado usando cookies (para Server Actions)
 * Tenta usar @supabase/ssr primeiro, com fallback para tokens manuais
 */
export async function getAuthenticatedClient() {
  try {
    const cookieStore = await cookies()
    
    // 1. Tentar usando @supabase/ssr (Padrão recomendado)
    const ssrClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Ignorar erro de setar cookie em Server Action/Component
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
            }
          },
        },
      }
    )

    // Verificar se o usuário é detectado pelo SSR com try-catch
    try {
      const { data: { user } } = await ssrClient.auth.getUser()
      if (user) return ssrClient
    } catch (e) {
      logger.debug('SSR getUser error fallback to manual')
    }

    // 2. Fallback: Tentar encontrar tokens legados ou manuais
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )
      
      try {
        const { data: { user: manualUser } } = await manualClient.auth.getUser(token)
        if (manualUser) return manualClient
      } catch (e) {
        logger.debug('Manual getUser error')
      }
    }

    return ssrClient
  } catch (error) {
    logger.error('Erro ao criar cliente autenticado:', error)
    // Fallback absoluto: cliente anônimo sem cookies se tudo falhar
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
}

/**
 * Cria um cliente do Supabase com privilégios de admin (Service Role)
 * USE COM CAUTELA - IGNORA RLS
 */
let cachedAdminClient: ReturnType<typeof createClient> | null = null;

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
    cachedAdminClient = adminClient;
    return adminClient;
  } catch (error) {
    logger.error('Erro ao criar cliente admin:', error)
    return null
  }
}
