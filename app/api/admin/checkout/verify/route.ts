import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import logger from '@/lib/logger';
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin';
import { checkStudioAccess } from '@/lib/auth';

/**
 * Verifica uma sessão de checkout do Stripe e atualiza o estúdio.
 * Usado como fallback quando o webhook demora ou não chega (ex: localhost).
 * Requer: super_admin OU acesso ao studio da sessão (dono que acabou de pagar).
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID ausente' }, { status: 400 });
    }

    // 1. Buscar sessão no Stripe (precisamos do studio_id para auth)
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        status: session.payment_status, 
        message: 'Pagamento ainda não confirmado no Stripe.' 
      });
    }

    const { invoice_id, studio_id, plan_id, type, verticalization_plan_id } = session.metadata || {};

    const isValidType = type === 'system_plan' || type === 'verticalization_plan';
    if (!isValidType || !invoice_id || !studio_id || !plan_id) {
      return NextResponse.json({ error: 'Metadados inválidos na sessão' }, { status: 400 });
    }

    const { isAdmin } = await checkSuperAdminDetailed();
    if (!isAdmin) {
      const access = await checkStudioAccess(request, studio_id);
      if (!access.authorized) return access.response;
    }

    // 2. Verificar se já foi processado (evitar duplicidade)
    const { data: invoice } = await supabaseAdmin
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
    
    const rpcParams: Record<string, string> = {
      p_invoice_id: invoice_id,
      p_plan_id: plan_id,
      p_studio_id: studio_id,
    };
    if (verticalization_plan_id) {
      rpcParams.p_verticalization_plan_id = verticalization_plan_id;
    }
    
    const { error: rpcError } = await supabaseAdmin.rpc('mark_studio_invoice_as_paid', rpcParams);

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
