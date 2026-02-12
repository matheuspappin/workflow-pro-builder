#!/usr/bin/env node

/**
 * Script de Inicialização do Banco de Dados DanceFlow AI
 *
 * Este script:
 * 1. Testa a conexão com o Supabase
 * 2. Verifica se as tabelas existem
 * 3. Inicializa dados padrão se necessário
 *
 * Uso: node scripts/init-database.js
 */

const { testConnection, checkTables, initializeDefaultData, DB_CONFIG } = require('../config/supabase')

async function main() {
  console.log('🚀 DanceFlow AI - Inicialização do Banco de Dados')
  console.log('=' .repeat(50))

  // 1. Testar conexão
  console.log('\n1️⃣  Testando conexão com Supabase...')
  const isConnected = await testConnection()

  if (!isConnected) {
    console.error('\n❌ Falha na conexão. Verifique suas credenciais no arquivo .env')
    process.exit(1)
  }

  // 2. Verificar tabelas
  console.log('\n2️⃣  Verificando tabelas do banco...')
  const tableStatus = await checkTables()

  console.log('\n📋 Status das tabelas:')
  Object.entries(tableStatus).forEach(([table, exists]) => {
    const status = exists ? '✅' : '❌'
    console.log(`${status} ${table}`)
  })

  const allTablesExist = Object.values(tableStatus).every(exists => exists)

  if (!allTablesExist) {
    console.log('\n⚠️  Algumas tabelas não existem!')
    console.log('📝 Execute o arquivo database/schema.sql no SQL Editor do Supabase')
    console.log('🔗 Acesse: https://supabase.com/dashboard -> SQL Editor')
    process.exit(1)
  }

  // 3. Inicializar dados
  console.log('\n3️⃣  Inicializando dados padrão...')
  await initializeDefaultData()

  // 4. Verificação final
  console.log('\n4️⃣  Verificação final...')
  const { data: studentsCount } = await require('../config/supabase').supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  const { data: teachersCount } = await require('../config/supabase').supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })

  console.log(`\n📊 Dados encontrados:`)
  console.log(`   👥 Alunos: ${studentsCount || 0}`)
  console.log(`   👨‍🏫 Professores: ${teachersCount || 0}`)

  console.log('\n' + '='.repeat(50))
  console.log('🎉 Banco de dados inicializado com sucesso!')
  console.log('🚀 DanceFlow AI está pronto para uso!')
}

main().catch(error => {
  console.error('❌ Erro durante a inicialização:', error)
  process.exit(1)
})