
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixUserRole() {
  console.log('--- CORRIGINDO ROLE DO SUPER ADMIN ---');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Credenciais ausentes.');
    return;
  }

  const client = createClient(supabaseUrl, serviceRoleKey);
  
  // 1. Buscar usuário
  const { data: { users }, error: listError } = await client.auth.admin.listUsers();
  if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
  }

  const targetEmail = 'vendaslachef@gmail.com';
  const user = users.find(u => u.email === targetEmail);

  if (!user) {
      console.error(`❌ Usuário ${targetEmail} não encontrado.`);
      return;
  }

  console.log(`✅ Usuário encontrado: ${user.id}`);
  console.log(`   Metadata atual:`, user.user_metadata);

  // 2. Atualizar metadata
  const { data: updatedUser, error: updateError } = await client.auth.admin.updateUserById(
    user.id,
    { user_metadata: { ...user.user_metadata, role: 'super_admin' } }
  );

  if (updateError) {
      console.error('❌ Erro ao atualizar metadata:', updateError);
  } else {
      console.log('✅ Metadata atualizado com sucesso!');
      console.log('   Novo Metadata:', updatedUser.user.user_metadata);
  }

  console.log('--- FIM ---');
}

fixUserRole();
