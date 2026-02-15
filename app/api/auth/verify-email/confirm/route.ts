import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'E-mail e código são obrigatórios' }, { status: 400 })
    }

    // Buscar código no banco
    const { data: verification, error } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .maybeSingle()

    if (error || !verification) {
      return NextResponse.json({ error: 'Código incorreto ou expirado' }, { status: 400 })
    }

    // Verificar expiração
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Código expirado. Peça um novo.' }, { status: 400 })
    }

    // Marcar como verificado
    const { error: updateError } = await supabaseAdmin
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', verification.id)

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao validar e-mail' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'E-mail verificado com sucesso!',
      email
    })

  } catch (error) {
    logger.error('💥 Erro fatal na verificação de código:', error)
    return NextResponse.json({ error: 'Erro interno ao processar verificação' }, { status: 500 })
  }
}
