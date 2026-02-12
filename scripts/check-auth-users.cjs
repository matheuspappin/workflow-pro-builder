
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthUsers() {
  console.log('--- Checking Auth Users ---');
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('❌ Error listing users:', error.message);
    } else {
      console.log(`✅ Total auth users: ${users.length}`);
      users.forEach(u => {
        console.log(`- ${u.email} (${u.id}) - Created at: ${u.created_at}`);
        console.log(`  Metadata: ${JSON.stringify(u.user_metadata)}`);
      });
    }
  } catch (err) {
    console.error('💥 Exception:', err.message);
  }
}

checkAuthUsers();
