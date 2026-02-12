import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

async function runSchema() {
  console.log('🚀 Iniciando atualização automática do Banco de Dados...')
  
  try {
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')

    console.log('📝 Executando script SQL completo (Multi-Tenancy + Realtime)...')
    
    // O postgres-js permite executar múltiplas queries se separadas por ;
    // Mas para garantir o RLS e as permissões, vamos rodar o bloco completo
    await sql.unsafe(schemaSql)

    console.log('✅ Banco de dados atualizado com sucesso!')
    console.log('✨ O Realtime está habilitado e as políticas de segurança foram simplificadas para desenvolvimento.')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message)
    process.exit(1)
  }
}

runSchema()
