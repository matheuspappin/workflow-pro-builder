import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
// NOTE: We need an email sending utility. For now, we will just log the email content.
// import { sendEmail } from '@/lib/email' 

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const studioId = params.id
  const { clientEmail } = await request.json()

  if (!clientEmail) {
    return NextResponse.json({ error: 'Client email is required' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const token = randomBytes(32).toString('hex')

  const { error: inviteError } = await supabaseAdmin
    .from('studio_invites')
    .insert({
      studio_id: studioId,
      email: clientEmail,
      token: token,
      created_by: user.id
    })

  if (inviteError) {
    console.error('Error creating invite:', inviteError)
    return NextResponse.json({ error: `Error creating invite: ${inviteError.message}` }, { status: 500 })
  }
  
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup/invite/${token}`

  // TODO: Replace with actual email sending logic
  console.log(`
    ---- EMAIL SIMULATION ----
    TO: ${clientEmail}
    SUBJECT: Seu link de setup está pronto!
    BODY: Olá, aqui está o seu link para configurar o sistema: ${inviteUrl}
    --------------------------
  `);

  // await sendEmail({
  //   to: clientEmail,
  //   subject: 'Seu link de setup está pronto!',
  //   html: `<p>Olá, aqui está o seu link para configurar o sistema: <a href="${inviteUrl}">${inviteUrl}</a></p>`
  // });

  return NextResponse.json({ success: true, inviteUrl })
}
