import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkStudioAccess } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId, studioId } = await req.json();

    if (!userId || !studioId) {
      return NextResponse.json({ error: 'userId e studioId são obrigatórios' }, { status: 400 });
    }

    const access = await checkStudioAccess(req, studioId)
    if (!access.authorized) return access.response

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('studio_id', studioId)
      .eq('read', false);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('💥 Erro ao marcar todas as notificações como lidas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
