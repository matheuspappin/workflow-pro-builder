
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('../lib/logger').default;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAffiliate() {
  const userId = process.argv[2] || process.env.CHECK_AFFILIATE_USER_ID || '48a69f2b-a0a1-4e58-adc2-ea7e55a9f349';
  logger.info(`Checking partners table for user_id: ${userId}`);
  
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error) {
    logger.error('❌ Error:', error);
  } else if (data) {
    logger.info('✅ Found partner:', data);
  } else {
    logger.warn('❌ Partner not found in table.');
  }
}

checkAffiliate();
