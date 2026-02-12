import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser(email) {
  console.log(`Checking email: ${email}`);
  
  // Check users_internal
  const { data: internal, error: internalError } = await supabase
    .from('users_internal')
    .select('*')
    .eq('email', email)
    .maybeSingle();
    
  if (internalError) console.error('Error users_internal:', internalError);
  console.log('users_internal:', internal);

  // Check students
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .maybeSingle();
    
  if (studentError) console.error('Error students:', studentError);
  console.log('students:', student);

  // Check teachers
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('email', email)
    .maybeSingle();
    
  if (teacherError) console.error('Error teachers:', teacherError);
  console.log('teachers:', teacher);
}

const email = process.argv[2] || 'vendaslachef@gmail.com';
checkUser(email);
