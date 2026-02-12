import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL não encontrada no .env')
  process.exit(1)
}

const sql = postgres(connectionString, {
  ssl: 'require',
  connect_timeout: 10
})

async function runMigration() {
  const args = process.argv.slice(2)
  const migrationFile = args[0]

  if (!migrationFile) {
    console.error('❌ Por favor forneça o caminho do arquivo de migração (ex: database/migrations/01_file.sql)')
    process.exit(1)
  }

  console.log(`🚀 Iniciando migração: ${migrationFile}`)
  
  try {
    const migrationPath = path.resolve(process.cwd(), migrationFile)
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Arquivo não encontrado: ${migrationPath}`)
      process.exit(1)
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Executando SQL...')
    await sql.unsafe(migrationSql)

    console.log('✅ Migração executada com sucesso!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error)
    process.exit(1)
  }
}

runMigration()
