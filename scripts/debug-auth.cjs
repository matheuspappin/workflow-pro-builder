require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  console.log('Checking for user in Supabase Auth...');
  const email = 'vendaslachef@gmail.com';
  
  // List users to find the specific one
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const user = users.find(u => u.email === email);

  if (user) {
    console.log(`User found in Auth: ${user.email} (ID: ${user.id})`);
    console.log('Status:', user.aud);
    
    // Now check public tables again with this ID
    console.log('\nChecking public tables for this ID...');
    
    const tables = ['users_internal', 'teachers', 'students'];
    
    for (const table of tables) {
      const { data, error: tableError } = await supabase
        .from(table)
        .select('*')
        .eq(table === 'teachers' ? 'user_id' : 'id', user.id);
        
      if (tableError) {
        console.log(`Error checking ${table}:`, tableError.message);
      } else if (data && data.length > 0) {
        console.log(`Found profile in ${table}:`, data[0]);
      } else {
        console.log(`No profile in ${table}`);
      }
    }

  } else {
    console.log(`User ${email} NOT found in Supabase Auth.`);
    console.log('Total users found:', users.length);
    users.forEach(u => console.log(' - ' + u.email));
    
    // Check if tables contain any data at all
    console.log('\nChecking if tables have any data...');
    const tables = ['users_internal', 'teachers', 'students'];
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) console.log(`Error checking ${table}:`, error.message);
        else console.log(`${table} count:`, count);
    }
  }
}

checkUser();
