import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/affiliate/commission
 * Retorna a taxa de comissão do afiliado (definida pelo super admin).
 * Usado no criador de ecossistema para exibir quanto o afiliado ganhará.
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data: partner, error } = await supabase
    .from('partners')
    .select('id, commission_rate')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar comissão' }, { status: 500 });
  }

  if (!partner) {
    return NextResponse.json({ error: 'Usuário não é afiliado' }, { status: 403 });
  }

  const rate = Number(partner.commission_rate ?? 0);
  return NextResponse.json({
    partnerId: partner.id,
    commissionRate: rate,
    commissionRateFormatted: `${rate.toFixed(1)}%`,
  });
}
