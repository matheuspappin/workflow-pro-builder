import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '@/lib/logger';

dotenv.config();

async function fixUserRole() {
  logger.info('--- CORRIGINDO ROLE DO SUPER ADMIN ---');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error('❌ Credenciais ausentes.');
    return;
  }

  const client = createClient(supabaseUrl, serviceRoleKey);
  
  // 1. Buscar usuário
  const { data: { users }, error: listError } = await client.auth.admin.listUsers();
  if (listError) {
      logger.error('❌ Erro ao listar usuários:', listError);
      return;
  }

  const targetEmail = process.env.SUPER_ADMIN_EMAIL;
  const user = users.find(u => u.email === targetEmail);

  if (!user) {
      logger.error(`❌ Usuário ${targetEmail} não encontrado.`);
      return;
  }

  logger.info(`✅ Usuário encontrado: ${user.id}`);
  logger.debug(`   Metadata atual:`, user.user_metadata);

  // 2. Atualizar metadata
  const { data: updatedUser, error: updateError } = await client.auth.admin.updateUserById(
    user.id,
    { user_metadata: { ...user.user_metadata, role: 'super_admin' } }
  );

  if (updateError) {
      logger.error('❌ Erro ao atualizar metadata:', updateError);
  } else {
      logger.info('✅ Metadata atualizado com sucesso!');
      logger.debug('   Novo Metadata:', updatedUser.user.user_metadata);
  }

  logger.info('--- FIM ---');
}

fixUserRole();
