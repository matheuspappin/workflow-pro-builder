import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Usaremos o service role key para re-enviar e-mail de confirmação

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    // Usar o service_role_key para reenviar o e-mail de confirmação
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await adminSupabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      logger.error('Erro ao reenviar e-mail de confirmação:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('E-mail de confirmação reenviado com sucesso para:', email, data);
    return NextResponse.json({ message: 'E-mail de confirmação reenviado com sucesso.' }, { status: 200 });

  } catch (error: any) {
    logger.error('Erro fatal ao reenviar e-mail de confirmação:', error);
    return NextResponse.json({ error: 'Erro interno ao processar reenvio de e-mail.' }, { status: 500 });
  }
}
