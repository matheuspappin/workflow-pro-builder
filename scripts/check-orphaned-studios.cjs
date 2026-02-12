
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOrphanedStudios() {
  const { data, error } = await supabase.from('studios').select('*');
  if (error) console.error(error);
  else {
    console.log(`Total studios: ${data.length}`);
    data.forEach(s => {
      console.log(`- ${s.name} (${s.id}) | Slug: ${s.slug} | Owner: ${s.owner_id}`);
    });
  }
}
checkOrphanedStudios();
