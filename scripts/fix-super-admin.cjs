
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixSuperAdminMetadata() {
  console.log('--- CORREÇÃO DE METADATA SUPER ADMIN ---');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Credenciais insuficientes (URL ou Service Key faltando).');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Buscar usuário
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError);
    return;
  }

  const user = users.find(u => u.email === 'vendaslachef@gmail.com');
  
  if (!user) {
    console.error('❌ Usuário vendaslachef@gmail.com não encontrado.');
    return;
  }

  console.log(`✅ Usuário encontrado: ${user.id}`);
  console.log(`   Metadata atual:`, user.user_metadata);

  // 2. Atualizar metadata
  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { user_metadata: { ...user.user_metadata, role: 'super_admin' } }
  );

  if (updateError) {
    console.error('❌ Erro ao atualizar metadata:', updateError);
  } else {
    console.log('✅ Metadata atualizado com sucesso!');
    console.log('   Novo metadata:', updatedUser.user.user_metadata);
    console.log('--- AÇÃO NECESSÁRIA: PEÇA PARA O USUÁRIO FAZER LOGOUT E LOGIN NOVAMENTE ---');
  }
}

fixSuperAdminMetadata();
