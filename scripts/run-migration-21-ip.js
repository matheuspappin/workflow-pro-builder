import postgres from 'postgres'
import fs from 'fs'
import logger from '../lib/logger'

// Configurações para conexão via IP (Pooler)
const DB_IP = '35.160.209.8'
const DB_PORT = '6543'
const DB_USER = 'postgres.drgibkczwshwjjsdauoj'
const DB_PASS = 'Wanrltwaezakmi171'
const DB_NAME = 'postgres'

const connectionString = `postgresql://${DB_USER}:${DB_PASS}@${DB_IP}:${DB_PORT}/${DB_NAME}?pgbouncer=true`

const sql = postgres(connectionString, { ssl: 'require' })

async function run() {
  try {
    const migration = fs.readFileSync('database/migrations/21_add_modules_to_system_plans.sql', 'utf8')
    logger.info('🚀 Executando migração 21 via IP...')
    await sql.unsafe(migration)
    logger.info('✅ Sucesso!')
  } catch (err) {
    logger.error('❌ Erro:', err.message)
  } finally {
    await sql.end()
  }
}

run()
