import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

async function applyMigrations() {
  console.log('🚀 Iniciando migração do Marketplace...')
  
  try {
    const migrations = [
        '05_create_marketplace_table.sql',
        '06_add_marketplace_style.sql'
    ]

    for (const migration of migrations) {
        const migrationPath = path.join(process.cwd(), 'database', 'migrations', migration)
        const migrationSql = fs.readFileSync(migrationPath, 'utf8')
        console.log(`📝 Executando ${migration}...`)
        await sql.unsafe(migrationSql)
    }

    console.log('✅ Migrações aplicadas com sucesso!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message)
    process.exit(1)
  }
}

applyMigrations()
