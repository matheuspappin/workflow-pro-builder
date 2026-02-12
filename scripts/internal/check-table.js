import { supabase } from './config/supabase.js';

async function checkTable() {
  const { data, error } = await supabase.from('studio_settings').select('*').limit(1);
  if (error) {
    console.error('❌ Table error:', error);
  } else {
    console.log('✅ Table exists, data:', data);
  }
}

checkTable();
