import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import logger from '@/lib/logger';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyQuery(email) {
  logger.info(`Verifying query for email: ${email}`);

  // First get the user ID from Auth (optional, but good to know)
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    logger.error('Error listing users:', authError);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    logger.warn('User not found in Auth');
    return;
  }
  
  const authUserId = user.id;
  logger.info(`User ID: ${authUserId}`);

  // 1. Check users_internal
  logger.info('--- Testing query on users_internal table ---');
  const { data: adminProfile, error: adminError } = await supabase
    .from('users_internal')
    .select(`
      *,
      studio:studios (
        name,
        slug,
        plan
      )
    `)
    .eq('id', authUserId)
    .maybeSingle();

  if (adminError) {
    logger.error('❌ Error querying users_internal:', adminError.message);
  } else {
    logger.info('✅ Query users_internal successful!');
    logger.info('Admin Profile:', adminProfile ? 'Found' : 'Not Found');
    if (adminProfile) logger.debug('Studio:', adminProfile.studio);
  }

  // 2. Check teachers
  logger.info('--- Testing query on teachers table ---');
  const { data: professionalProfile, error: professionalError } = await supabase
    .from('teachers')
    .select(`
      *,
      studio:studios (
        name,
        slug,
        plan
      )
    `)
    .eq('user_id', authUserId)
    .maybeSingle();

  if (professionalError) {
    logger.error('❌ Error querying teachers:', professionalError.message);
  } else {
    logger.info('✅ Query teachers successful!');
    logger.info('Professional Profile:', professionalProfile ? 'Found' : 'Not Found');
    if (professionalProfile) logger.debug('Studio:', professionalProfile.studio);
  }

  // 3. Check students
  logger.info('--- Testing query on students table ---');
  const { data: studentProfile, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      studio:studios (
        name,
        slug,
        plan
      )
    `)
    .eq('id', authUserId)
    .maybeSingle();

  if (studentError) {
    logger.error('❌ Error querying students:', studentError.message);
  } else {
    logger.info('✅ Query students successful!');
    logger.info('Student Profile:', studentProfile ? 'Found' : 'Not Found');
    if (studentProfile) logger.debug('Studio:', studentProfile.studio);
  }
}

const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || 'fallback@example.com';
verifyQuery(email);
