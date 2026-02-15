
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('../lib/logger').default;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllTables() {
  logger.info('Listando todas as tabelas públicas...');
  
  // Consulta SQL direta via RPC ou pg_catalog se possível, mas com client JS é limitado.
  // Vamos tentar listar coisas comuns ou usar uma função RPC se existir.
  // Como fallback, vamos tentar acessar várias tabelas potenciais.
  
  const potentialTables = [
      'studios', 'users_internal', 'users', 'profiles', 'teachers', 'professionals', 
      'students', 'classes', 'lessons', 'sessions', 'enrollments', 'subscriptions',
      'plans', 'saas_plans', 'system_plans', 'leads', 'crm', 'financial'
  ];

  for (const table of potentialTables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (!error) {
          logger.info(`✅ ${table}: ${count} registros`);
      }
  }
}

listAllTables();
