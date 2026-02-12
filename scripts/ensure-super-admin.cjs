
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensureSuperAdmin() {
  const email = 'vendaslachef@gmail.com';
  const password = 'password123'; // Senha padrão caso precise criar o usuário Auth

  console.log(`🚀 Verificando Super Admin: ${email}`);

  // 1. Verificar se o usuário existe no Supabase Auth
  let authUserId;
  const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();
  
  if (listUsersError) {
    console.error('❌ Erro ao listar usuários:', listUsersError);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log(`✅ Usuário Auth encontrado: ${existingUser.id}`);
    authUserId = existingUser.id;
  } else {
    console.log('⚠️ Usuário Auth não encontrado. Criando...');
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (createUserError) {
      console.error('❌ Erro ao criar usuário Auth:', createUserError);
      process.exit(1);
    }

    console.log(`✅ Usuário Auth criado: ${newUser.user.id}`);
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
    console.log(`✅ Studio existente encontrado: ${studioId}`);
  } else {
    console.log('⚠️ Nenhum studio encontrado. Criando Studio Padrão...');
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
        console.error('❌ Erro ao criar studio:', createStudioError);
        // Tenta continuar se o erro for apenas de owner_id (FK circular)
    } else {
        studioId = newStudio.id;
        console.log(`✅ Studio criado: ${studioId}`);
    }
  }

  // 3. Verificar/Criar Perfil em users_internal
  const { data: existingProfile, error: profileError } = await supabase
    .from('users_internal')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();

  if (existingProfile) {
    console.log(`✅ Perfil users_internal encontrado. Atualizando role para super_admin...`);
    const { error: updateError } = await supabase
      .from('users_internal')
      .update({ 
        role: 'super_admin',
        studio_id: studioId || existingProfile.studio_id // Mantém o atual se studioId for undefined
      })
      .eq('id', authUserId);

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
    } else {
      console.log('✅ Perfil atualizado com sucesso.');
    }
  } else {
    console.log('⚠️ Perfil users_internal não encontrado. Criando...');
    if (!studioId) {
        console.error('❌ Impossível criar perfil sem um studio_id válido.');
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
      console.error('❌ Erro ao criar perfil:', insertError);
    } else {
      console.log('✅ Perfil criado com sucesso.');
    }
  }
}

ensureSuperAdmin();
