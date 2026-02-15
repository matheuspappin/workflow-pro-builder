
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('../lib/logger').default;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkForeignKeys() {
  const { data, error } = await supabase.rpc('get_foreign_keys', { table_name: 'teachers' });
  // If RPC doesn't exist, we can try querying information_schema if we have permissions, 
  // but Supabase usually restricts information_schema.
  // Instead, let's try a simple query to see if we can reach the tables.
  
  logger.info('Checking teachers relationship...');
  const { data: t, error: te } = await supabase.from('teachers').select('id, studio_id').limit(1);
  logger.debug('Teachers:', { data: t, error: te });

  logger.info('Checking studios relationship...');
  const { data: s, error: se } = await supabase.from('studios').select('id').limit(1);
  logger.debug('Studios:', { data: s, error: se });

  logger.info('Checking join teachers -> studios...');
  const { data: j, error: je } = await supabase.from('teachers').select('*, studios(id)').limit(1);
  logger.debug('Join Teachers -> Studios:', { data: j, error: je });

  logger.info('Checking join users_internal -> studios...');
  const { data: ui, error: uie } = await supabase.from('users_internal').select(`
        *,
        studio:studios (
          name,
          slug,
          plan
        )
      `).eq('id', 'f6fbff4f-fae5-4409-be92-7b686b1ec35d').maybeSingle();
  logger.debug('Join Users Internal -> Studios:', { data: ui, error: uie });
}

checkForeignKeys();
