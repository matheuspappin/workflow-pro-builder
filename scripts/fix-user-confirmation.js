const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmUser(email) {
  console.log(`🔍 Buscando usuário: ${email}`);
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Erro ao listar usuários:', error);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log(`❌ Usuário ${email} não encontrado.`);
    return;
  }
  
  console.log(`✅ Usuário encontrado: ${user.id}`);
  console.log(`📊 Status: ${user.email_confirmed_at ? 'Confirmado' : 'NÃO confirmado'}`);
  
  if (!user.email_confirmed_at) {
    console.log(`⏳ Confirmando e-mail...`);
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error('❌ Erro ao confirmar usuário:', updateError);
    } else {
      console.log('✅ Usuário confirmado com sucesso!');
    }
  } else {
    console.log('✨ Usuário já está confirmado.');
  }

  // Verificar se tem perfil
  const { data: partner } = await supabase.from('partners').select('*').eq('user_id', user.id).maybeSingle();
  console.log(`👤 Perfil Partner:`, partner ? 'Presente' : 'AUSENTE');
}

confirmUser('teste@afiliado.com.br');
