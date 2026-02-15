
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('../lib/logger').default;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listRecentStudios() {
  const { data, error } = await supabase.from('studios').select('*').order('created_at', { ascending: false }).limit(10);
  if (error) logger.error(error);
  else logger.info('Recent Studios:', data);
}
listRecentStudios();
