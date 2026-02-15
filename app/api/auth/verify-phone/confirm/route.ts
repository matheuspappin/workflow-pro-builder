import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Telefone e código são obrigatórios' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '')

    // Buscar código no banco
    const { data: verification, error } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone', cleanPhone)
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
    const { error: updateError } = await supabase
      .from('phone_verifications')
      .update({ verified: true })
      .eq('id', verification.id)

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao validar telefone' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Telefone verificado com sucesso!',
      phone: cleanPhone 
    })

  } catch (error) {
    logger.error('💥 Erro fatal na verificação de código:', error)
    return NextResponse.json({ error: 'Erro interno ao processar verificação' }, { status: 500 })
  }
}
