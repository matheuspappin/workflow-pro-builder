import { NextResponse } from 'next/server'
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'
import { randomBytes } from 'crypto'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studioId } = await params

  const { isAdmin, user } = await checkSuperAdminDetailed()

  if (!isAdmin || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const now = new Date().toISOString()

    // Busca convite de ecossistema ativo (não usado e não expirado)
    const { data: existingInvite, error: fetchError } = await supabaseAdmin
      .from('studio_invites')
      .select('token')
      .eq('studio_id', studioId)
      .eq('invite_type', 'ecosystem')
      .is('used_at', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      logger.error('Erro ao buscar convite existente:', fetchError)
      throw fetchError
    }

    let token = existingInvite?.token

    if (!token) {
      // Gera novo convite de ecossistema caso não exista um ativo
      token = randomBytes(32).toString('hex')
      const { error: insertError } = await supabaseAdmin
        .from('studio_invites')
        .insert({
          studio_id: studioId,
          email: null,
          token,
          created_by: user.id,
          invite_type: 'ecosystem',
          metadata: { invite_type: 'ecosystem' },
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })

      if (insertError) {
        logger.error('Erro ao criar novo convite:', insertError)
        return NextResponse.json({ error: `Erro ao criar convite: ${insertError.message}` }, { status: 500 })
      }

      logger.info(`🎫 Novo convite de ecossistema criado para estúdio ${studioId}`)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${appUrl}/setup/invite/${token}`

    return NextResponse.json({ success: true, inviteUrl, token })
  } catch (error: any) {
    logger.error('Erro ao buscar/criar link de convite:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
