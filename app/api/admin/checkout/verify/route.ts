import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/logger';

/**
 * Verifica uma sessão de checkout do Stripe e atualiza o estúdio
 * Usado como fallback quando o webhook demora ou não chega (ex: localhost)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID ausente' }, { status: 400 });
    }

    // 1. Buscar sessão no Stripe
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        status: session.payment_status, 
        message: 'Pagamento ainda não confirmado no Stripe.' 
      });
    }

    const { invoice_id, studio_id, plan_id, type } = session.metadata || {};

    if (type !== 'system_plan' || !invoice_id || !studio_id || !plan_id) {
      return NextResponse.json({ error: 'Metadados inválidos na sessão' }, { status: 400 });
    }

    // 2. Verificar se já foi processado (evitar duplicidade)
    const { data: invoice } = await supabase
      .from('studio_invoices')
      .select('status')
      .eq('id', invoice_id)
      .single();

    if (invoice?.status === 'paid') {
      return NextResponse.json({ 
        success: true, 
        message: 'Plano já estava atualizado.' 
      });
    }

    // 3. Processar atualização usando RPC (mesma lógica do webhook)
    logger.info(`🔄 Sincronização manual: Processando pagamento para estúdio ${studio_id}`);
    
    const { error: rpcError } = await supabase.rpc('mark_studio_invoice_as_paid', {
      p_invoice_id: invoice_id,
      p_plan_id: plan_id,
      p_studio_id: studio_id
    });

    if (rpcError) {
      logger.error('❌ Erro ao sincronizar pagamento via RPC:', rpcError);
      return NextResponse.json({ error: 'Erro ao atualizar dados no banco' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plano atualizado com sucesso via verificação direta!' 
    });

  } catch (error: any) {
    logger.error('💥 Erro ao verificar checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
