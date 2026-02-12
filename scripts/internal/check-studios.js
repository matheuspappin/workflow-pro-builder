import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkStudios() {
  const { data, error } = await supabase
    .from('studios')
    .select('id, name, plan, status')
  
  if (error) {
    console.error('Error fetching studios:', error)
    return
  }
  
  console.log('--- Studios Table ---')
  console.table(data)
}

checkStudios()
