import { NextResponse } from 'next/server'
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'
import { randomBytes } from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studioId } = await params

  const { isAdmin, user } = await checkSuperAdminDetailed()

  if (!isAdmin || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { clientEmail } = await request.json()

  if (!clientEmail) {
    return NextResponse.json({ error: 'E-mail do cliente é obrigatório' }, { status: 400 })
  }

  const token = randomBytes(32).toString('hex')

  const { error: inviteError } = await supabaseAdmin
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

  if (inviteError) {
    logger.error('Error creating invite:', inviteError)
    return NextResponse.json({ error: `Erro ao criar convite: ${inviteError.message}` }, { status: 500 })
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup/invite/${token}`

  logger.info(`
    ---- EMAIL SIMULATION ----
    TO: ${clientEmail}
    SUBJECT: Seu link de setup está pronto!
    BODY: Olá, aqui está o seu link para configurar o sistema: ${inviteUrl}
    --------------------------
  `)

  return NextResponse.json({ success: true, inviteUrl })
}
