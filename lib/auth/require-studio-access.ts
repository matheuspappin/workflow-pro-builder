import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
 * Retorna o userId se autorizado, ou lança StudioAccessError.
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

  const role = user.user_metadata?.role || user.app_metadata?.role || ''

  // Super admin sempre tem acesso global
  if (role === 'super_admin') {
    return { userId: user.id, role }
  }

  // Verifica se é dono do studio
  const { data: owned } = await supabaseAdmin
    .from('studios')
    .select('id')
    .eq('id', studioId)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (owned) return { userId: user.id, role }

  // Verifica se tem acesso via users_internal (admin, receptionist, finance, seller)
  const { data: ui } = await supabaseAdmin
    .from('users_internal')
    .select('studio_id, role')
    .eq('id', user.id)
    .eq('studio_id', studioId)
    .maybeSingle()
  if (ui) return { userId: user.id, role: ui.role || role }

  // Verifica se é profissional vinculado ao studio (teacher, engineer, architect, technician)
  const { data: prof } = await supabaseAdmin
    .from('professionals')
    .select('studio_id, professional_type')
    .eq('user_id', user.id)
    .eq('studio_id', studioId)
    .eq('status', 'active')
    .maybeSingle()
  if (prof) return { userId: user.id, role }

  // Verifica se é aluno/cliente vinculado ao studio
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('studio_id')
    .eq('id', user.id)
    .eq('studio_id', studioId)
    .maybeSingle()
  if (student) return { userId: user.id, role }

  throw new StudioAccessError('Acesso negado a este studio', 403)
}

/**
 * Permite chamadas internas (ex: webhook WhatsApp) sem auth de usuário.
 * Usar header X-Internal-AI-Key igual a INTERNAL_AI_SECRET ou WEBHOOK_WHATSAPP_SECRET.
 */
export function allowInternalAiCall(request: NextRequest): boolean {
  const key = request.headers.get('x-internal-ai-key')
  const secret = process.env.INTERNAL_AI_SECRET || process.env.WEBHOOK_WHATSAPP_SECRET || process.env.EVOLUTION_WEBHOOK_SECRET
  return !!secret && !!key && key === secret
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
