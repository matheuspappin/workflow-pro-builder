import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findStudio(slug) {
  console.log(`Finding studio with slug: ${slug}`);
  const { data, error } = await supabase
    .from('studios')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Studio found:', data);
  }
}

findStudio('lalapro');
