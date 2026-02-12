const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  require('dotenv').config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyQuery(email) {
  console.log(`Verifying query for email: ${email}`);

  // First get the user ID from Auth (optional, but good to know)
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found in Auth');
    return;
  }
  
  const authUserId = user.id;
  console.log(`User ID: ${authUserId}`);

  // 1. Check users_internal
  console.log('--- Testing query on users_internal table ---');
  const { data: adminProfile, error: adminError } = await supabase
    .from('users_internal')
    .select(`
      *,
      studio:studios (
        name,
        slug,
        plan
      )
    `)
    .eq('id', authUserId)
    .maybeSingle();

  if (adminError) {
    console.error('❌ Error querying users_internal:', adminError.message);
  } else {
    console.log('✅ Query users_internal successful!');
    console.log('Admin Profile:', adminProfile ? 'Found' : 'Not Found');
    if (adminProfile) console.log('Studio:', adminProfile.studio);
  }

  // 2. Check teachers
  console.log('--- Testing query on teachers table ---');
  const { data: professionalProfile, error: professionalError } = await supabase
    .from('teachers')
    .select(`
      *,
      studio:studios (
        name,
        slug,
        plan
      )
    `)
    .eq('user_id', authUserId)
    .maybeSingle();

  if (professionalError) {
    console.error('❌ Error querying teachers:', professionalError.message);
  } else {
    console.log('✅ Query teachers successful!');
    console.log('Professional Profile:', professionalProfile ? 'Found' : 'Not Found');
    if (professionalProfile) console.log('Studio:', professionalProfile.studio);
  }

  // 3. Check students
  console.log('--- Testing query on students table ---');
  const { data: studentProfile, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      studio:studios (
        name,
        slug,
        plan
      )
    `)
    .eq('id', authUserId)
    .maybeSingle();

  if (studentError) {
    console.error('❌ Error querying students:', studentError.message);
  } else {
    console.log('✅ Query students successful!');
    console.log('Student Profile:', studentProfile ? 'Found' : 'Not Found');
    if (studentProfile) console.log('Studio:', studentProfile.studio);
  }
}

const email = process.argv[2] || 'vendaslachef@gmail.com';
verifyQuery(email);
