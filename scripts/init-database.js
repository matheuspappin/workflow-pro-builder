#!/usr/bin/env node

/**
 * Script de Inicialização do Banco de Dados Workflow AI
 *
 * Este script:
 * 1. Testa a conexão com o Supabase
 * 2. Verifica se as tabelas existem
 * 3. Inicializa dados padrão se necessário
 *
 * Uso: node scripts/init-database.js
 */

const { testConnection, checkTables, initializeDefaultData, DB_CONFIG } = require('../config/supabase')
const logger = require('../lib/logger').default

async function main() {
  logger.info('🚀 Workflow AI - Inicialização do Banco de Dados')
  logger.info('=' .repeat(50))

  // 1. Testar conexão
  logger.info('\n1️⃣  Testando conexão com Supabase...')
  const isConnected = await testConnection()

  if (!isConnected) {
    logger.error('\n❌ Falha na conexão. Verifique suas credenciais no arquivo .env')
    process.exit(1)
  }

  // 2. Verificar tabelas
  logger.info('\n2️⃣  Verificando tabelas do banco...')
  const tableStatus = await checkTables()

  logger.info('\n📋 Status das tabelas:')
  Object.entries(tableStatus).forEach(([table, exists]) => {
    const status = exists ? '✅' : '❌'
    logger.info(`${status} ${table}`)
  })

  const allTablesExist = Object.values(tableStatus).every(exists => exists)

  if (!allTablesExist) {
    logger.warn('\n⚠️  Algumas tabelas não existem!')
    logger.info('📝 Execute o arquivo database/schema.sql no SQL Editor do Supabase')
    logger.info('🔗 Acesse: https://supabase.com/dashboard -> SQL Editor')
    process.exit(1)
  }

  // 3. Inicializar dados
  logger.info('\n3️⃣  Inicializando dados padrão...')
  await initializeDefaultData()

  // 4. Verificação final
  logger.info('\n4️⃣  Verificação final...')
  const { data: studentsCount } = await require('../config/supabase').supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  const { data: teachersCount } = await require('../config/supabase').supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })

  logger.info(`\n📊 Dados encontrados:`)
  logger.info(`   👥 Alunos: ${studentsCount || 0}`)
  logger.info(`   👨‍🏫 Professores: ${teachersCount || 0}`)

  logger.info('\n' + '='.repeat(50))
  logger.info('🎉 Banco de dados inicializado com sucesso!')
  logger.info('🚀 Workflow AI está pronto para uso!')
}

main().catch(error => {
  logger.error('❌ Erro durante a inicialização:', error)
  process.exit(1)
})