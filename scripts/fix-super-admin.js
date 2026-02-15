import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '@/lib/logger';

dotenv.config();

async function fixSuperAdminMetadata() {
  logger.info('--- CORREÇÃO DE METADATA SUPER ADMIN ---');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error('❌ Credenciais insuficientes (URL ou Service Key faltando).');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Buscar usuário
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    logger.error('❌ Erro ao listar usuários:', listError);
    return;
  }

  const targetEmail = process.env.SUPER_ADMIN_EMAIL;
  const user = users.find(u => u.email === targetEmail);
  
  if (!user) {
    logger.warn(`❌ Usuário ${targetEmail} não encontrado.`);
    return;
  }

  logger.info(`✅ Usuário encontrado: ${user.id}`);
  logger.debug(`   Metadata atual:`, user.user_metadata);

  // 2. Atualizar metadata
  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { user_metadata: { ...user.user_metadata, role: 'super_admin' } }
  );

  if (updateError) {
    logger.error('❌ Erro ao atualizar metadata:', updateError);
  } else {
    logger.info('✅ Metadata atualizado com sucesso!');
    logger.debug('   Novo metadata:', updatedUser.user.user_metadata);
    logger.warn('--- AÇÃO NECESSÁRIA: PEÇA PARA O USUÁRIO FAZER LOGOUT E LOGIN NOVAMENTE ---');
  }
}

fixSuperAdminMetadata();
