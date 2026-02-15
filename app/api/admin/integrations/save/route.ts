import { NextRequest, NextResponse } from 'next/server';
import { saveStudioApiKey } from '@/lib/database-utils';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { studioId, service, apiKey, publicKey } = await req.json();

    if (!studioId || !service) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Salvar Secret Key (ex: stripe)
    await saveStudioApiKey(service, apiKey, studioId);
    
    // Salvar Public Key (ex: stripe_public)
    if (publicKey) {
        await saveStudioApiKey(`${service}_public`, publicKey, studioId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao salvar integração:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}