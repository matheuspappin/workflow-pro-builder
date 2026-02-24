import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase URL or Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTables() {
  console.log('Checking tables...');
  
  const tablesToCheck = ['service_orders', 'services', 'service_order_items', 'service_order_history', 'payments'];
  
  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ Table '${table}' check failed:`, error.message);
    } else {
      console.log(`✅ Table '${table}' exists.`);
    }
  }
}

checkTables();
