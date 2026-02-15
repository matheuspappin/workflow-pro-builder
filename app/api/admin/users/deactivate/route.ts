import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId, userRole } = await req.json();

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'ID do usuário e função são obrigatórios' }, { status: 400 });
    }

    // 1. Desativar o usuário no Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { status: 'inactive' } } // Marcar como inativo no auth
    );

    if (authError) {
      logger.error('Erro ao desativar usuário no Supabase Auth:', authError);
      return NextResponse.json({ error: 'Falha ao desativar usuário no sistema de autenticação.' }, { status: 500 });
    }

    // 2. Atualizar o status do perfil na tabela correspondente
    let profileError = null;
    if (userRole === 'student') {
      ({ error: profileError } = await supabase.from('students').update({ status: 'inactive' }).eq('user_id', userId));
    } else if (userRole === 'teacher') {
      ({ error: profileError } = await supabase.from('teachers').update({ status: 'inactive' }).eq('user_id', userId));
    } else if (userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin' || userRole === 'manager' || userRole === 'receptionist') {
      ({ error: profileError } = await supabase.from('users_internal').update({ status: 'inactive' }).eq('user_id', userId));
    }

    if (profileError) {
      logger.error('Erro ao atualizar status do perfil no DB:', profileError);
      // Considere reativar no Supabase Auth se esta parte falhar?
      return NextResponse.json({ error: 'Falha ao desativar perfil do usuário no banco de dados.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Usuário desativado com sucesso.' });

  } catch (error: any) {
    logger.error('Erro fatal ao desativar usuário:', error);
    return NextResponse.json({ error: 'Erro interno ao processar a desativação do usuário.' }, { status: 500 });
  }
}
