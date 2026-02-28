import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateStripeBalance } from '@/lib/actions/affiliate';
import { getAuthenticatedClient } from "@/lib/server-utils";
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getAuthenticatedClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const balance = await getAffiliateStripeBalance(user.id);

    return NextResponse.json({ balance });
  } catch (error: any) {
    logger.error('Erro ao buscar saldo do Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
