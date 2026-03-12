import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
  const { data: internalUser } = await supabaseAdmin
    .from('users_internal')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = internalUser?.role ?? user.user_metadata?.role
  if (role !== 'super_admin' && role !== 'superadmin') {
    return { ok: false as const, res: NextResponse.json({ error: 'Acesso restrito a super administradores' }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.res

  try {
    const body = await request.json()
    const { originalQuestion, originalAnswer, feedback, correctedAnswer } = body

    if (!originalQuestion || !originalAnswer || !feedback) {
      return NextResponse.json(
        { error: 'originalQuestion, originalAnswer e feedback são obrigatórios' },
        { status: 400 }
      )
    }

    const validFeedback = ['positive', 'negative', 'correction'].includes(feedback)
      ? feedback
      : 'negative'

    const { error } = await supabaseAdmin.from('ai_admin_feedback').insert({
      original_question: String(originalQuestion).trim(),
      original_answer: String(originalAnswer).trim(),
      user_feedback: validFeedback,
      corrected_answer: correctedAnswer ? String(correctedAnswer).trim() : null,
    })

    if (error) {
      logger.error('Erro ao salvar feedback admin Catarina:', error)
      return NextResponse.json({ error: 'Falha ao salvar feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Feedback registrado.' })
  } catch (err: any) {
    logger.error('Erro no endpoint de feedback admin:', err)
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 })
  }
}
