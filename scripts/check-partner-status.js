import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkPartner() {
  console.log('🔍 Verificando usuário e parceiro...');

  // 1. Buscar usuário por email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError);
    return;
  }

  const user = users.find(u => u.email === 'teste@afiliado.com.br');

  if (!user) {
    console.log('❌ Usuário teste@afiliado.com.br NÃO encontrado em auth.users.');
  } else {
    console.log(`✅ Usuário encontrado: ${user.id} (${user.email})`);
    
    // 2. Buscar parceiro pelo user_id
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (partnerError) {
      console.error('❌ Erro ao buscar parceiro:', partnerError);
    } else if (!partner) {
      console.log('❌ Registro na tabela PARTNERS não encontrado para este usuário.');
    } else {
      console.log('✅ Registro encontrado em partners:');
      console.log(partner);
    }
  }

  // 3. Listar todos os parceiros para debug
  console.log('\n📋 Listando todos os parceiros (limit 10):');
  const { data: allPartners } = await supabase.from('partners').select('*').limit(10);
  console.table(allPartners);
}

checkPartner();
