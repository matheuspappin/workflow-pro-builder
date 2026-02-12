
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAffiliate() {
  const userId = '48a69f2b-a0a1-4e58-adc2-ea7e55a9f349';
  console.log(`Checking partners table for user_id: ${userId}`);
  
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error) {
    console.error('❌ Error:', error);
  } else if (data) {
    console.log('✅ Found partner:', data);
  } else {
    console.log('❌ Partner not found in table.');
  }
}

checkAffiliate();
