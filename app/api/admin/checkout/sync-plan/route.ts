import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import logger from '@/lib/logger';
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin';

/**
 * Sincroniza o plano do estúdio a partir da última fatura paga.
 * Útil quando o webhook/verify falharam e o plano exibido não corresponde às faturas.
 * Requer super_admin.
 */
export async function POST(req: NextRequest) {
  try {
    const { isAdmin } = await checkSuperAdminDetailed();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { studioId } = await req.json();

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc('sync_studio_plan_from_latest_invoice', {
      p_studio_id: studioId,
    });

    if (error) {
      logger.error('❌ Erro ao sincronizar plano a partir da fatura:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao sincronizar plano' },
        { status: 500 }
      );
    }

    const result = data as { success?: boolean; message?: string; plan_id?: string };
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Não foi possível sincronizar o plano' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Plano sincronizado com sucesso',
      plan_id: result.plan_id,
    });
  } catch (error: any) {
    logger.error('💥 Erro ao sincronizar plano:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
