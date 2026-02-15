
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('../lib/logger').default;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStudio() {
  const studioId = process.argv[2] || process.env.CHECK_STUDIO_ID || 'c31b8732-e859-48a3-bef9-f89eedc01e21';
  const { data, error } = await supabase.from('studios').select('*').eq('id', studioId).maybeSingle();
  if (error) logger.error(error);
  else logger.info('Studio:', data);
}
checkStudio();
