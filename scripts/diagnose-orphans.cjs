
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseOrphans() {
  console.log('--- Diagnóstico de Usuários Órfãos ---');
  
  // 1. Listar usuários do Auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Erro ao listar usuários Auth:', authError.message);
    return;
  }

  console.log(`\nUsuários no Auth (Total: ${users.length}):`);
  
  for (const user of users) {
    const userId = user.id;
    const email = user.email;
    
    // Tentar encontrar perfil em todas as tabelas possíveis
    const checks = await Promise.all([
      supabase.from('users_internal').select('id').eq('id', userId).maybeSingle(),
      supabase.from('teachers').select('user_id').eq('user_id', userId).maybeSingle(), // Legacy/Refactor check
      supabase.from('professionals').select('user_id').eq('user_id', userId).maybeSingle(),
      supabase.from('students').select('id').eq('id', userId).maybeSingle()
    ]);
    
    const [internal, teacher, professional, student] = checks;
    
    const profilesFound = [];
    if (internal.data) profilesFound.push('users_internal');
    if (teacher.data) profilesFound.push('teachers');
    if (professional.data) profilesFound.push('professionals');
    if (student.data) profilesFound.push('students');
    
    const status = profilesFound.length > 0 ? '✅' : '❌ ÓRFÃO';
    console.log(`${status} ${email} (${userId}) - Perfis: ${profilesFound.join(', ') || 'Nenhum'}`);
  }
}

diagnoseOrphans();
