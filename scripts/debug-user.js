import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(email) {
  console.log(`Checking user: ${email}`);

  // Check professionals
  const { data: prof, error: profError } = await supabase
    .from('professionals')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (profError) {
    console.error('Error checking professionals:', profError);
  } else {
    console.log('Professional record:', prof);
  }

  // Check users_internal
  const { data: internal, error: internalError } = await supabase
    .from('users_internal')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (internalError) {
    console.error('Error checking users_internal:', internalError);
  } else {
    console.log('Internal record:', internal);
  }

  // Check studios if we have a studio_id
  if (prof?.studio_id || internal?.studio_id) {
    const studioId = prof?.studio_id || internal?.studio_id;
    const { data: studio, error: studioError } = await supabase
      .from('studios')
      .select('*')
      .eq('id', studioId)
      .maybeSingle();
    
    if (studioError) {
      console.error('Error checking studio:', studioError);
    } else {
      console.log('Studio record:', studio);
    }
  } else {
    console.log('No studio_id found for this user in professional/internal tables.');
  }

  // Check if they are a student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  if (studentError) {
    console.error('Error checking students:', studentError);
  } else if (student) {
    console.log('Student record found:', student);
  }
}

const email = 'teste@eng.com';
checkUser(email);
