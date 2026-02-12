import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

// Configurações para conexão via IP (Pooler)
const DB_IP = '35.160.209.8'
const DB_PORT = '6543'
const DB_USER = 'postgres.drgibkczwshwjjsdauoj'
const DB_PASS = 'Wanrltwaezakmi171'
const DB_NAME = 'postgres'

const connectionString = `postgresql://${DB_USER}:${DB_PASS}@${DB_IP}:${DB_PORT}/${DB_NAME}?pgbouncer=true`

console.log('🔗 Usando conexão via IP do Pooler:', DB_IP)

const sql = postgres(connectionString, {
  ssl: 'require',
  connect_timeout: 20
})

async function runMigrations() {
  const migrations = [
    '14_create_email_verifications.sql',
    '15_add_cpf_cnpj_columns.sql',
    '16_add_missing_user_fields.sql',
    '17_fix_foreign_keys.sql',
    '20_fix_system_plans_rls.sql',
    '21_add_modules_to_system_plans.sql'
  ]

  for (const migration of migrations) {
    console.log(`🚀 Executando migração: ${migration}...`)
    try {
      const migrationPath = path.join(process.cwd(), 'database', 'migrations', migration)
      if (!fs.existsSync(migrationPath)) {
        console.warn(`⚠️ Arquivo não encontrado: ${migrationPath}`)
        continue
      }
      const migrationSql = fs.readFileSync(migrationPath, 'utf8')
      await sql.unsafe(migrationSql)
      console.log(`✅ Migração ${migration} executada com sucesso!`)
    } catch (error) {
      console.error(`❌ Erro ao executar migração ${migration}:`, error.message)
    }
  }
  
  await sql.end()
  process.exit(0)
}

runMigrations()
