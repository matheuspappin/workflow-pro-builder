/**
 * Define um usuário como super_admin pelo email.
 * Atualiza users_internal (fonte da verdade) e auth user_metadata.
 * 
 * Uso: SUPER_ADMIN_EMAIL=vendaslachef@gmail.com node scripts/set-super-admin-by-email.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const email = process.env.SUPER_ADMIN_EMAIL || process.argv[2];

if (!email) {
  console.error('❌ Informe o email: SUPER_ADMIN_EMAIL=x@y.com node scripts/set-super-admin-by-email.js');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setSuperAdmin() {
  console.log(`\n🚀 Definindo ${email} como Super Admin...\n`);

  // 1. Buscar usuário no Auth
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('❌ Erro ao listar usuários:', listErr.message);
    process.exit(1);
  }

  const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!authUser) {
    console.error(`❌ Usuário ${email} não encontrado no Auth.`);
    process.exit(1);
  }

  console.log(`✅ Auth user encontrado: ${authUser.id}`);

  // 2. Atualizar ou criar em users_internal (fonte da verdade para o login)
  const { data: existing } = await supabase
    .from('users_internal')
    .select('id, role, studio_id')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existing) {
    const { error: updateErr } = await supabase
      .from('users_internal')
      .update({ 
        role: 'super_admin',
        studio_id: null  // super_admin não pertence a um estúdio específico
      })
      .eq('id', authUser.id);

    if (updateErr) {
      console.error('❌ Erro ao atualizar users_internal:', updateErr.message);
      process.exit(1);
    }
    console.log(`✅ users_internal atualizado: role=super_admin, studio_id=null`);
  } else {
    const { error: insertErr } = await supabase
      .from('users_internal')
      .insert({
        id: authUser.id,
        email,
        name: authUser.user_metadata?.name || email.split('@')[0],
        role: 'super_admin',
        studio_id: null,
        status: 'active'
      });

    if (insertErr) {
      console.error('❌ Erro ao criar users_internal:', insertErr.message);
      process.exit(1);
    }
    console.log(`✅ users_internal criado: role=super_admin`);
  }

  // 3. Atualizar metadata do Auth
  const { error: metaErr } = await supabase.auth.admin.updateUserById(authUser.id, {
    user_metadata: { ...authUser.user_metadata, role: 'super_admin', studio_id: null }
  });

  if (metaErr) {
    console.error('⚠️ Erro ao atualizar Auth metadata:', metaErr.message);
  } else {
    console.log(`✅ Auth user_metadata atualizado`);
  }

  console.log('\n✅ Concluído! Faça logout e login novamente em /login (Workflow).\n');
}

setSuperAdmin();
