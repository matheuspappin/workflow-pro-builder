import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseOrphans() {
  console.log('--- Diagnóstico de Usuários e Vínculos ---');

  // 1. Listar todos os usuários do Auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Erro ao listar usuários do Auth:', authError);
    return;
  }

  console.log(`Total de usuários no Auth: ${users.length}`);

  for (const user of users) {
    console.log(`\nVerificando usuário: ${user.email} (${user.id})`);
    
    // 2. Verificar users_internal
    const { data: internal, error: internalError } = await supabase
      .from('users_internal')
      .select('id, studio_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (internalError) {
      console.error(`  ❌ Erro ao buscar em users_internal: ${internalError.message}`);
    } else if (internal) {
      console.log(`  ✅ Encontrado em users_internal (Role: ${internal.role})`);
      if (!internal.studio_id) {
        console.warn(`  ⚠️  ATENÇÃO: Usuário interno SEM studio_id!`);
      } else {
        // Verificar se o estúdio existe e tem config
        const { data: studio, error: studioError } = await supabase.from('studios').select('name').eq('id', internal.studio_id).single();
        if (studioError) {
           console.error(`  ❌ Erro ao buscar estúdio ${internal.studio_id}: ${studioError.message}`);
        } else {
           const { data: settings } = await supabase.from('organization_settings').select('id').eq('studio_id', internal.studio_id).single();
           console.log(`     Estúdio: ${studio?.name} (${internal.studio_id})`);
           if (!settings) console.warn(`  ⚠️  Estúdio SEM organization_settings!`);
           else console.log(`     Configurações: OK`);
        }
      }
    } else {
      console.log(`  ℹ️  Não encontrado em users_internal.`);
      
      // Se não é interno, pode ser aluno ou professor
      const { data: student } = await supabase.from('students').select('id, studio_id').eq('id', user.id).maybeSingle();
      const { data: pro } = await supabase.from('professionals').select('id, studio_id').eq('user_id', user.id).maybeSingle();

      if (student) console.log(`  ✅ É um ALUNO (Estúdio: ${student.studio_id})`);
      if (pro) console.log(`  ✅ É um PROFISSIONAL (Estúdio: ${pro.studio_id})`);

      if (!student && !pro) {
        console.warn(`  ⚠️  USUÁRIO ÓRFÃO: Não está em users_internal, students, ou professionals.`);
      }
    }
  }
}

diagnoseOrphans();
