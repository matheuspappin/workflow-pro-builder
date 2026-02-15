import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

if (!process.env.DATABASE_URL) {
  logger.error('❌ DATABASE_URL não definida no .env')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL)

async function runMigrations() {
  const migrations = [
    '14_create_email_verifications.sql',
    '15_add_cpf_cnpj_columns.sql',
    '16_add_missing_user_fields.sql',
    '17_fix_foreign_keys.sql',
    '20_fix_system_plans_rls.sql',
    '24_create_support_system.sql'
  ]

  for (const migration of migrations) {
    logger.info(`🚀 Executando migração: ${migration}...`)
    try {
      const migrationPath = path.join(process.cwd(), 'database', 'migrations', migration)
      if (!fs.existsSync(migrationPath)) {
        logger.warn(`⚠️ Arquivo não encontrado: ${migrationPath}`)
        continue
      }
      const migrationSql = fs.readFileSync(migrationPath, 'utf8')
      await sql.unsafe(migrationSql)
      logger.info(`✅ Migração ${migration} executada com sucesso!`)
    } catch (error) {
      logger.error(`❌ Erro ao executar migração ${migration}:`, error)
    }
  }
  
  await sql.end()
  process.exit(0)
}

runMigrations()
