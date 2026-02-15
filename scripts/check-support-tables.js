import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

async function checkTables() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('support_tickets', 'support_messages')
    `
    console.log('Tables found:', tables)
    
    if (tables.length > 0) {
      for (const table of tables) {
        const columns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${table.table_name}
        `
        console.log(`Columns for ${table.table_name}:`, columns)
      }
    }
  } catch (error) {
    console.error('Error checking tables:', error)
  } finally {
    await sql.end()
  }
}

checkTables()
