import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

async function runMigration() {
  console.log('🚀 Executing migration: Merge Duplicate Products...')
  
  try {
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', '03_merge_duplicate_products.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    await sql.unsafe(migrationSql)

    console.log('✅ Duplicates merged and constraint added successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error executing migration:', error.message)
    process.exit(1)
  }
}

runMigration()
