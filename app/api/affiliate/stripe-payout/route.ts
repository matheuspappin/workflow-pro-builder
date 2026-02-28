import { NextRequest, NextResponse } from 'next/server';
import { createAffiliateStripePayout } from '@/lib/actions/affiliate';
import { getAuthenticatedClient } from "@/lib/server-utils";
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getAuthenticatedClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { amount } = await req.json();

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Valor do saque inválido.' }, { status: 400 });
    }

    const payout = await createAffiliateStripePayout(user.id, amount);

    return NextResponse.json({ payout });
  } catch (error: any) {
    logger.error('Erro ao criar pagamento Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
