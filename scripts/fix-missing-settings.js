import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingSettings() {
  console.log('--- Corrigindo Organization Settings Faltantes ---');

  // 1. Listar todos os estúdios
  const { data: studios, error: studiosError } = await supabase
    .from('studios')
    .select('id, name');

  if (studiosError) {
    console.error('Erro ao listar estúdios:', studiosError);
    return;
  }

  console.log(`Total de estúdios: ${studios.length}`);

  for (const studio of studios) {
    // 2. Verificar se existe organization_settings
    const { data: settings } = await supabase
      .from('organization_settings')
      .select('id')
      .eq('studio_id', studio.id)
      .maybeSingle();

    if (!settings) {
      console.log(`🛠️  Criando settings para estúdio: ${studio.name} (${studio.id})`);
      
      const { error: insertError } = await supabase
        .from('organization_settings')
        .insert({
          studio_id: studio.id,
          niche: 'dance', // Default
          enabled_modules: { 
            dashboard: true, 
            students: true, 
            classes: true, 
            financial: true, 
            ai_chat: true 
          }
        });

      if (insertError) {
        console.error(`  ❌ Erro ao criar settings: ${insertError.message}`);
      } else {
        console.log(`  ✅ Settings criados com sucesso.`);
      }
    } else {
      console.log(`✅ ${studio.name}: Settings já existem.`);
    }
  }
}

fixMissingSettings();
