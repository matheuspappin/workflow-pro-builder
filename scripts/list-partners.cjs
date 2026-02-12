
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listPartners() {
  const { data, error } = await supabase.from('partners').select('*');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
listPartners();
