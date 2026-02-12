import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email, password) {
  console.log(`Testing login for: ${email}`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Login error:', error.message);
    console.error('Error details:', error);
  } else {
    console.log('✅ Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Session expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/test-login.js <email> <password>');
  process.exit(1);
}

testLogin(email, password);
