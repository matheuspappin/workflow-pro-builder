import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'

export async function requireSuperAdmin() {
  const supabase = await createClient()

  // getUser() valida o JWT contra o servidor Supabase — getSession() NÃO valida
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    logger.warn('[SUPER ADMIN] Requisição sem sessão válida')
    throw new Error('Não autorizado: sessão requerida')
  }

  // Usar supabaseAdmin (service role) para contornar RLS e garantir resultado confiável
  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from('users_internal')
    .select('id, email, role')
    .eq('id', user.id)
    .eq('role', 'super_admin')
    .single()

  if (adminError || !adminUser) {
    logger.warn('[SUPER ADMIN] Acesso negado', { userId: user.id })
    throw new Error('Não autorizado: apenas Super Admin pode acessar')
  }

  logger.info('[SUPER ADMIN] Acesso autorizado', { userId: user.id })

  return {
    user: adminUser,
    authUser: user
  }
}
