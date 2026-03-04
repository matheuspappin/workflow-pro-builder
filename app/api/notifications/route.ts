import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkStudioAccess } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const studioId = searchParams.get('studioId');

    if (!userId || !studioId) {
      return NextResponse.json({ error: 'userId e studioId são obrigatórios' }, { status: 400 });
    }

    const access = await checkStudioAccess(req, studioId)
    if (!access.authorized) return access.response

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    logger.error('💥 Erro ao buscar notificações:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { notificationId, read } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', notificationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('💥 Erro ao atualizar notificação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
