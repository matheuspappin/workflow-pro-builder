
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('../lib/logger').default;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listUsersInternal() {
  const { data, error } = await supabase.from('users_internal').select('*');
  if (error) logger.error(error);
  else logger.info('Users Internal:', data);
}
listUsersInternal();
