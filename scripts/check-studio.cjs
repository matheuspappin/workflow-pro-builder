
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStudio() {
  const { data, error } = await supabase.from('studios').select('*').eq('id', 'c31b8732-e859-48a3-bef9-f89eedc01e21').maybeSingle();
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
checkStudio();
