import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

// Conexão via IP para evitar problemas de DNS
const connectionString = 'postgresql://postgres.drgibkczwshwjjsdauoj:Wanrltwaezakmi171@35.160.209.8:6543/postgres?pgbouncer=true'

const sql = postgres(connectionString, {
  ssl: 'require',
  connect_timeout: 20
})

async function runMigration() {
  const migration = '26_add_business_models.sql'
  console.log(`🚀 Executando migração: ${migration}...`)
  
  try {
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', migration)
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')
    await sql.unsafe(migrationSql)
    console.log(`✅ Migração ${migration} executada com sucesso!`)
  } catch (error) {
    console.error(`❌ Erro ao executar migração ${migration}:`, error.message)
  }
  
  await sql.end()
  process.exit(0)
}

runMigration()
