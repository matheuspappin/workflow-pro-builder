import { NextRequest, NextResponse } from 'next/server';
import { createStripeConnectAccountLink } from '@/lib/actions/affiliate';
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

    const { returnUrl } = await req.json();
    logger.info("Recebida requisição para Stripe Connect com returnUrl:", returnUrl);

    if (!returnUrl) {
      logger.error("Erro: URL de retorno é obrigatória.");
      return NextResponse.json({ error: 'URL de retorno é obrigatória' }, { status: 400 });
    }

    const accountLinkUrl = await createStripeConnectAccountLink(user.id, returnUrl);
    logger.info("Link da conta Stripe Connect criado:", accountLinkUrl);

    return NextResponse.json({ url: accountLinkUrl });
  } catch (error: any) {
    logger.error('Erro ao criar link da conta Stripe Connect:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
