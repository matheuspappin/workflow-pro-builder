import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  logger.info('Checking for user in Supabase Auth...');
  const email = process.argv[2] || process.env.DEBUG_EMAIL || 'debug@example.com';
  
  // List users to find the specific one
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    logger.error('Error listing users:', error);
    return;
  }

  const user = users.find(u => u.email === email);

  if (user) {
    logger.info(`User found in Auth: ${user.email} (ID: ${user.id})`);
    logger.debug('Status:', user.aud);
    
    // Now check public tables again with this ID
    logger.info('\nChecking public tables for this ID...');
    
    const tables = ['users_internal', 'teachers', 'students'];
    
    for (const table of tables) {
      const { data, error: tableError } = await supabase
        .from(table)
        .select('*')
        .eq(table === 'teachers' ? 'user_id' : 'id', user.id);
        
      if (tableError) {
        logger.error(`Error checking ${table}:`, tableError.message);
      } else if (data && data.length > 0) {
        logger.info(`Found profile in ${table}:`, data[0]);
      } else {
        logger.info(`No profile in ${table}`);
      }
    }

  } else {
    logger.warn(`User ${email} NOT found in Supabase Auth.`);
    logger.info('Total users found:', users.length);
    users.forEach(u => logger.debug(' - ' + u.email));
    
    // Check if tables contain any data at all
    logger.info('\nChecking if tables have any data...');
    const tables = ['users_internal', 'teachers', 'students'];
    for (const table of tables) {
        const { count, error: countError } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (countError) logger.error(`Error checking ${table}:`, countError.message);
        else logger.info(`${table} count:`, count);
    }
  }
}

checkUser();
