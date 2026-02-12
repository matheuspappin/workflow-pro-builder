
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseDatabase() {
  console.log('--- Diagnóstico do Banco de Dados ---');
  console.log('URL:', supabaseUrl);

  // 1. Listar tabelas (tentativa indireta via queries simples)
  const tablesToCheck = ['studios', 'users_internal', 'teachers', 'professionals', 'students'];

  for (const table of tablesToCheck) {
    console.log(`\nVerificando tabela: ${table}`);
    try {
      // Tenta contar registros
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Erro ao acessar ${table}: ${error.message}`);
        if (error.code === '42P01') {
            console.log(`   (Tabela '${table}' provavalmente NÃO EXISTE)`);
        }
      } else {
        console.log(`✅ Tabela '${table}' existe.`);
        console.log(`   Registros encontrados: ${count}`);
        
        // Se tiver registros, mostra o primeiro para ver estrutura
        if (count > 0) {
            const { data } = await supabase.from(table).select('*').limit(1);
            console.log('   Exemplo de registro:', JSON.stringify(data[0], null, 2));
        }
      }
    } catch (err) {
      console.log(`💥 Exceção ao verificar ${table}:`, err.message);
    }
  }
}

diagnoseDatabase();
