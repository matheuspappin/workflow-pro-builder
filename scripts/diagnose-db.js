
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('../lib/logger').default;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Erro: Variáveis de ambiente não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseDatabase() {
  logger.info('--- Diagnóstico do Banco de Dados ---');
  logger.debug('URL:', supabaseUrl);

  // 1. Listar tabelas (tentativa indireta via queries simples)
  const tablesToCheck = ['studios', 'users_internal', 'teachers', 'professionals', 'students'];

  for (const table of tablesToCheck) {
    logger.info(`\nVerificando tabela: ${table}`);
    try {
      // Tenta contar registros
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error(`❌ Erro ao acessar ${table}: ${error.message}`);
        if (error.code === '42P01') {
            logger.warn(`   (Tabela '${table}' provavalmente NÃO EXISTE)`);
        }
      } else {
        logger.info(`✅ Tabela '${table}' existe.`);
        logger.info(`   Registros encontrados: ${count}`);
        
        // Se tiver registros, mostra o primeiro para ver estrutura
        if (count > 0) {
            const { data } = await supabase.from(table).select('*').limit(1);
            logger.debug('   Exemplo de registro:', data[0]);
        }
      }
    } catch (err) {
      logger.error(`💥 Exceção ao verificar ${table}:`, err.message);
    }
  }
}

diagnoseDatabase();
