
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('../lib/logger').default;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOrphanedStudios() {
  const { data, error } = await supabase.from('studios').select('*');
  if (error) logger.error(error);
  else {
    logger.info(`Total studios: ${data.length}`);
    data.forEach(s => {
      logger.debug(`- ${s.name} (${s.id}) | Slug: ${s.slug} | Owner: ${s.owner_id}`);
    });
  }
}
checkOrphanedStudios();
