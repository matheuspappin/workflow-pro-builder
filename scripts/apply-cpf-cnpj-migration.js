import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from '../lib/logger.js'

// Necessary for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

if (!process.env.DATABASE_URL) {
  logger.error('❌ DATABASE_URL não definida no .env')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL)

async function runMigration() {
  logger.info('🚀 Executando migração de colunas cpf_cnpj...')
  
  try {
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', '15_add_cpf_cnpj_columns.sql')
    logger.info(`📂 Lendo arquivo: ${migrationPath}`)
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    logger.info('📝 Executando SQL...')
    await sql.unsafe(migrationSql)

    logger.info('✅ Migração executada com sucesso!')
    process.exit(0)
  } catch (error) {
    logger.error('❌ Erro ao executar SQL:', error)
    process.exit(1)
  }
}

runMigration()
