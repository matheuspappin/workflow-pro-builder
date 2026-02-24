import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudentsTable() {
  console.log('Checking students table structure...');
  
  // Try to get one record to see columns
  const { data, error } = await supabase.from('students').select('*').limit(1);
  
  if (error) {
    console.error('Error fetching from students:', error);
  } else {
    console.log('Columns in students table:', Object.keys(data[0] || {}));
    if (data.length === 0) {
      console.log('No data in students table, cannot determine columns this way.');
    }
  }

  // Try to insert a dummy record with only name and email to see what fails
  console.log('\nTrying to insert a dummy student...');
  const { error: insertError } = await supabase.from('students').insert({
    name: 'Test Student',
    email: 'test@example.com',
    studio_id: '00000000-0000-0000-0000-000000000000',
    monthly_fee: 100
  });

  if (insertError) {
    console.log('Insert error (DETAILED):', JSON.stringify(insertError, null, 2));
  } else {
    console.log('Insert succeeded (unexpectedly)');
  }
}

checkStudentsTable();
