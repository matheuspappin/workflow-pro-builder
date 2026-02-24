import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthMetadata(email) {
  console.log(`Checking auth metadata for: ${email}`);
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const user = users.find(u => u.email === email);
  
  if (user) {
    console.log('User found in auth.users:');
    console.log('ID:', user.id);
    console.log('User Metadata:', user.user_metadata);
    console.log('App Metadata:', user.app_metadata);
  } else {
    console.log('User not found in auth.users');
  }
}

checkAuthMetadata('teste@eng.com');
