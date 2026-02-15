import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../lib/logger.js';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email, password) {
  logger.info(`Testing login for: ${email}`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logger.error('❌ Login error:', error.message);
    logger.debug('Error details:', error);
  } else {
    logger.info('✅ Login successful!');
    logger.info('User ID:', data.user.id);
    logger.info('Session expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  logger.error('Usage: node scripts/test-login.js <email> <password>');
  process.exit(1);
}

testLogin(email, password);
