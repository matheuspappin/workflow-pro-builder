import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '@/lib/logger';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensureSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'default_password_CHANGE_ME';

  logger.info(`🚀 Verificando Super Admin: ${email}`);

  // 1. Verificar se o usuário existe no Supabase Auth
  let authUserId;
  const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();
  
  if (listUsersError) {
    logger.error('❌ Erro ao listar usuários:', listUsersError);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    logger.info(`✅ Usuário Auth encontrado: ${existingUser.id}`);
    authUserId = existingUser.id;
  } else {
    logger.info('⚠️ Usuário Auth não encontrado. Criando...');
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (createUserError) {
      logger.error('❌ Erro ao criar usuário Auth:', createUserError);
      process.exit(1);
    }

    logger.info(`✅ Usuário Auth criado: ${newUser.user.id}`);
    authUserId = newUser.user.id;
  }

  // 2. Verificar/Criar Studio Padrão (necessário para FK)
  const { data: existingStudio, error: studioError } = await supabase
    .from('studios')
    .select('id')
    .limit(1)
    .maybeSingle();

  let studioId;
  if (existingStudio) {
    studioId = existingStudio.id;
    logger.info(`✅ Studio existente encontrado: ${studioId}`);
  } else {
    logger.info('⚠️ Nenhum studio encontrado. Criando Studio Padrão...');
    const { data: newStudio, error: createStudioError } = await supabase
      .from('studios')
      .insert({
        name: 'Super Admin Studio',
        slug: 'super-admin-studio',
        owner_id: authUserId // Temporário, será atualizado se necessário
      })
      .select()
      .single();

    if (createStudioError) {
        logger.error('❌ Erro ao criar studio:', createStudioError);
        // Tenta continuar se o erro for apenas de owner_id (FK circular)
    } else {
        studioId = newStudio.id;
        logger.info(`✅ Studio criado: ${studioId}`);
    }
  }

  // 3. Verificar/Criar Perfil em users_internal
  const { data: existingProfile, error: profileError } = await supabase
    .from('users_internal')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();

  if (existingProfile) {
    logger.info(`✅ Perfil users_internal encontrado. Atualizando role para super_admin...`);
    const { error: updateError } = await supabase
      .from('users_internal')
      .update({ 
        role: 'super_admin',
        studio_id: studioId || existingProfile.studio_id // Mantém o atual se studioId for undefined
      })
      .eq('id', authUserId);

    if (updateError) {
      logger.error('❌ Erro ao atualizar perfil:', updateError);
    } else {
      logger.info('✅ Perfil atualizado com sucesso.');
    }
  } else {
    logger.info('⚠️ Perfil users_internal não encontrado. Criando...');
    if (!studioId) {
        logger.error('❌ Impossível criar perfil sem um studio_id válido.');
        process.exit(1);
    }

    const { error: insertError } = await supabase
      .from('users_internal')
      .insert({
        id: authUserId,
        email: email,
        name: 'Super Admin',
        role: 'super_admin',
        studio_id: studioId,
        status: 'active'
      });

    if (insertError) {
      logger.error('❌ Erro ao criar perfil:', insertError);
    } else {
      logger.info('✅ Perfil criado com sucesso.');
    }
  }
}

ensureSuperAdmin();
