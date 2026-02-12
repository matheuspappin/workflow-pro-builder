import dotenv from 'dotenv';
dotenv.config();
import { supabase } from './config/supabase.js';

async function checkTable() {
  const { data, error } = await supabase.from('studio_settings').select('*').limit(1);
  if (error) {
    console.error('❌ Table error:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Table exists, data:', data);
  }
}

checkTable();
