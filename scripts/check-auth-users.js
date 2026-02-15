
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('../lib/logger').default;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthUsers() {
  logger.info('--- Checking Auth Users ---');
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      logger.error('❌ Error listing users:', error.message);
    } else {
      logger.info(`✅ Total auth users: ${users.length}`);
      users.forEach(u => {
        logger.debug(`- ${u.email} (${u.id}) - Created at: ${u.created_at}`);
        logger.debug('  Metadata:', u.user_metadata);
      });
    }
  } catch (err) {
    logger.error('💥 Exception:', err.message);
  }
}

checkAuthUsers();
