import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

/**
 * Cria um cliente do Supabase autenticado usando cookies (para Server Actions)
 * Tenta usar @supabase/ssr primeiro, com fallback para tokens manuais
 */
export async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  console.log('🍪 Cookies detectados:', allCookies.map(c => c.name))

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
            // Ignorar erro de setar cookie em Server Action
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

  // Verificar se o usuário é detectado pelo SSR
  const { data: { user } } = await ssrClient.auth.getUser()
  if (user) return ssrClient

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
    
    // Validar token
    const { data: { user: manualUser } } = await manualClient.auth.getUser(token)
    
    if (manualUser) {
      return manualClient
    }
  }

  // Se nada funcionar, retorna o cliente SSR (que vai responder null no getUser)
  return ssrClient
}

/**
 * Cria um cliente do Supabase com privilégios de admin (Service Role)
 * USE COM CAUTELA - IGNORA RLS
 */
export async function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente')
    return null
  }

  return createClient(
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
}
