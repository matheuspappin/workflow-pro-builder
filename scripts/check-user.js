import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '@/lib/logger';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser(email) {
  logger.info(`Checking email: ${email}`);
  
  // Check users_internal
  const { data: internal, error: internalError } = await supabase
    .from('users_internal')
    .select('*')
    .eq('email', email)
    .maybeSingle();
    
  if (internalError) logger.error('Error users_internal:', internalError);
  logger.debug('users_internal:', internal);

  // Check students
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .maybeSingle();
    
  if (studentError) logger.error('Error students:', studentError);
  logger.debug('students:', student);

  // Check teachers
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('email', email)
    .maybeSingle();
    
  if (teacherError) logger.error('Error teachers:', teacherError);
  logger.debug('teachers:', teacher);
}

const email = process.argv[2] || process.env.CHECK_USER_EMAIL || 'user@example.com';
checkUser(email);
