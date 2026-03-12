import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logAdmin } from '@/lib/admin-logs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export class StudioAccessError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'StudioAccessError'
  }
}

/**
 * Verifica se o usuário autenticado tem acesso ao studioId fornecido.
 * Usa RPC get_user_studio_access() (1 query) quando disponível,
 * com fallback para as N+1 queries originais.
 * Retorna o userId e role se autorizado, ou lança StudioAccessError.
 */
export async function requireStudioAccess(
  request: NextRequest,
  studioId: string
): Promise<{ userId: string; role: string }> {
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => request.cookies.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new StudioAccessError('Não autenticado', 401)
  }

  // Otimização: RPC de 1 query (migration 118)
  const { data: rpcRows, error: rpcErr } = await supabaseAdmin
    .rpc('get_user_studio_access', { p_user_id: user.id, p_studio_id: studioId })
    .single()

  if (!rpcErr && rpcRows) {
    const row = rpcRows as { authorized: boolean; role: string; reason: string }
    if (!row.authorized) {
      if (row.reason === 'studio_not_found') throw new StudioAccessError('Studio não encontrado', 404)
      if (row.reason === 'studio_inactive') {
        await logAdmin('warning', 'auth/studio-access', `Acesso bloqueado: studio ${studioId} inativo. User: ${user.id}`, { studio: studioId, metadata: { userId: user.id, reason: 'studio_inactive' } })
        throw new StudioAccessError('Sua assinatura expirou ou o estúdio foi desativado.', 402)
      }
      if (row.reason === 'trial_expired') {
        await logAdmin('warning', 'auth/studio-access', `Acesso bloqueado: trial expirado para studio ${studioId}. User: ${user.id}`, { studio: studioId, metadata: { userId: user.id, reason: 'trial_expired' } })
        throw new StudioAccessError('Seu período de teste expirou. Assine um plano para continuar.', 402)
      }
      // no_access: verifica metadata mas NÃO escreve aqui (sem side-effects no hot path de auth)
      // Para novos alunos com vínculo pendente, use repairStudentLink() explicitamente no fluxo de registro.
      if (hasStudentMetadata(user, studioId)) {
        return { userId: user.id, role: 'student' }
      }
      throw new StudioAccessError('Acesso negado a este studio', 403)
    }
    return { userId: user.id, role: row.role }
  }

  // Fallback: RPC não existe (migration 118 não aplicada) — fluxo N+1 original
  return requireStudioAccessFallback(user, studioId)
}

/**
 * Verifica (read-only) se o usuário tem metadata de student para o studio.
 * Não escreve no banco — sem side-effects no hot path de autenticação.
 */
function hasStudentMetadata(
  user: { user_metadata?: Record<string, any>; app_metadata?: Record<string, any> },
  studioId: string
): boolean {
  const metaStudioId = user.user_metadata?.studio_id
  const metaRole = user.user_metadata?.role || user.app_metadata?.role
  return metaStudioId === studioId && (!metaRole || metaRole === 'student')
}

/**
 * Repara vínculo de student quando a row está desatualizada (ex: registro via convite).
 * DEVE ser chamado explicitamente no fluxo de registro/login do student, NUNCA dentro de auth guards.
 *
 * @example
 * // Em app/api/auth/register/route.ts, após criar o usuário:
 * await repairStudentLink(user, studioId)
 */
export async function repairStudentLink(
  user: { id: string; email?: string; user_metadata?: Record<string, any>; app_metadata?: Record<string, any> },
  studioId: string
): Promise<boolean> {
  if (!hasStudentMetadata(user, studioId)) return false
  const { error } = await supabaseAdmin
    .from('students')
    .upsert({
      id: user.id,
      studio_id: studioId,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Aluno',
      email: user.email || '',
      phone: user.user_metadata?.phone || null,
      status: 'active',
    }, { onConflict: 'id' })
  return !error
}

/** Fluxo N+1 original — usado como fallback quando migration 118 não foi aplicada. */
async function requireStudioAccessFallback(
  user: { id: string; email?: string; user_metadata?: Record<string, any>; app_metadata?: Record<string, any> },
  studioId: string
): Promise<{ userId: string; role: string }> {
  const role = user.user_metadata?.role || user.app_metadata?.role || ''

  if (role === 'super_admin') return { userId: user.id, role }

  const { data: studioRecord } = await supabaseAdmin
    .from('studios')
    .select('id, owner_id, status, subscription_status, trial_ends_at')
    .eq('id', studioId)
    .maybeSingle()

  if (!studioRecord) throw new StudioAccessError('Studio não encontrado', 404)

  if (studioRecord.status === 'inactive') {
    await logAdmin('warning', 'auth/studio-access', `Acesso bloqueado: studio ${studioId} inativo. User: ${user.id}`, { studio: studioId, metadata: { userId: user.id, reason: 'studio_inactive' } })
    throw new StudioAccessError('Sua assinatura expirou ou o estúdio foi desativado.', 402)
  }

  if (studioRecord.subscription_status === 'trialing' && studioRecord.trial_ends_at) {
    const trialEnd = new Date(studioRecord.trial_ends_at)
    if (trialEnd < new Date()) {
      await logAdmin('warning', 'auth/studio-access', `Acesso bloqueado: trial expirado para studio ${studioId}. User: ${user.id}`, { studio: studioId, metadata: { userId: user.id, reason: 'trial_expired', trialEnd: studioRecord.trial_ends_at } })
      throw new StudioAccessError('Seu período de teste expirou. Assine um plano para continuar.', 402)
    }
  }

  if (studioRecord.owner_id === user.id) return { userId: user.id, role }

  const { data: ui } = await supabaseAdmin
    .from('users_internal')
    .select('studio_id, role')
    .eq('id', user.id)
    .eq('studio_id', studioId)
    .maybeSingle()
  if (ui) return { userId: user.id, role: ui.role || role }

  const { data: prof } = await supabaseAdmin
    .from('professionals')
    .select('studio_id, professional_type')
    .eq('user_id', user.id)
    .eq('studio_id', studioId)
    .eq('status', 'active')
    .maybeSingle()
  if (prof) return { userId: user.id, role }

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('studio_id')
    .eq('id', user.id)
    .eq('studio_id', studioId)
    .maybeSingle()
  if (student) return { userId: user.id, role }

  if (hasStudentMetadata(user, studioId)) {
    return { userId: user.id, role: 'student' }
  }

  throw new StudioAccessError('Acesso negado a este studio', 403)
}

/**
 * Permite chamadas internas (ex: webhook WhatsApp → AI) sem auth de usuário.
 * Requer INTERNAL_AI_SECRET exclusivo. Não reutiliza secrets de webhooks externos.
 * Header: X-Internal-AI-Key: <INTERNAL_AI_SECRET>
 */
export function allowInternalAiCall(request: NextRequest): boolean {
  const key = request.headers.get('x-internal-ai-key')
  const secret = process.env.INTERNAL_AI_SECRET
  if (!secret) {
    console.warn('[allowInternalAiCall] INTERNAL_AI_SECRET não configurado — chamadas internas de AI bloqueadas')
    return false
  }
  if (!key) return false
  const a = Buffer.from(key, 'utf8')
  const b = Buffer.from(secret, 'utf8')
  return a.length === b.length && require('crypto').timingSafeEqual(a, b)
}

/**
 * Versão que retorna NextResponse de erro em vez de lançar exceção.
 * Ideal para uso direto em route handlers.
 *
 * @example
 * const access = await checkStudioAccess(request, studioId)
 * if (!access.authorized) return access.response
 * // access.userId está disponível aqui
 */
export async function checkStudioAccess(
  request: NextRequest,
  studioId: string | null | undefined
): Promise<
  | { authorized: true; userId: string; role: string }
  | { authorized: false; response: NextResponse }
> {
  if (!studioId) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 }),
    }
  }

  try {
    const { userId, role } = await requireStudioAccess(request, studioId)
    return { authorized: true, userId, role }
  } catch (err) {
    if (err instanceof StudioAccessError) {
      return {
        authorized: false,
        response: NextResponse.json({ error: err.message }, { status: err.status }),
      }
    }
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Erro interno de autorização' }, { status: 500 }),
    }
  }
}

/**
 * Versão reforçada para operações críticas que requerem confirmação explícita de Super Admin
 * Previne operações acidentais cross-tenant
 */
export async function requireStudioAccessWithValidation(
  request: NextRequest,
  studioId: string,
  options: {
    requireExplicit?: boolean,
    operationType?: 'read' | 'write' | 'delete'
  } = {}
): Promise<{ userId: string; role: string }> {
  const basic = await requireStudioAccess(request, studioId)
  
  // Se for Super Admin e operação for crítica, exigir confirmação explícita
  if (options.requireExplicit && basic.role === 'super_admin') {
    const confirmation = request.headers.get('x-admin-confirmation')
    const operation = options.operationType || 'read'
    
    if (!confirmation) {
      throw new StudioAccessError(
        `Operação ${operation} crítica requer confirmação explícita. Header: x-admin-confirmation`, 
        428
      )
    }
    
    // Log adicional para auditoria de operações críticas
    await logAdmin('warning', 'auth/critical-operation', 
      `Super Admin realizando operação crítica em studio ${studioId}`, 
      { 
        studio: studioId, 
        metadata: { 
          userId: basic.userId, 
          operation, 
          confirmation: confirmation.substring(0, 8) + '***'
        } 
      }
    )
  }
  
  return basic
}
