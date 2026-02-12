import sql from './db.js'

async function testConnection() {
  let connected = false
  try {
    console.log('🔄 Testando conexão com PostgreSQL...')
    console.log('📍 URL configurada:', process.env.DATABASE_URL ? '✅ Presente' : '❌ Ausente')

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não configurada no .env')
    }

    // Teste básico - verificar versão
    console.log('🔍 Fazendo query de teste...')
    const version = await sql`SELECT version()`
    console.log('✅ Conectado! Versão:', version[0].version.substring(0, 50) + '...')
    connected = true

    // Teste - contar alunos
    console.log('👥 Verificando tabela students...')
    const students = await sql`SELECT COUNT(*) as total FROM students`
    console.log('👥 Total de alunos:', students[0].total)

    // Teste - listar professores
    console.log('👨‍🏫 Verificando tabela teachers...')
    const teachers = await sql`SELECT name, specialty FROM teachers LIMIT 3`
    console.log('👨‍🏫 Professores encontrados:', teachers.length)
    if (teachers.length > 0) {
      teachers.forEach((t, i) => console.log(`  ${i+1}. ${t.name} - ${t.specialty || 'Sem especialidade'}`))
    }

    // Teste - verificar classes
    console.log('📚 Verificando tabela classes...')
    const classes = await sql`SELECT COUNT(*) as total FROM classes`
    console.log('📚 Total de turmas:', classes[0].total)

    console.log('🎉 Todos os testes passaram! PostgreSQL funcionando perfeitamente!')

  } catch (error) {
    console.error('❌ Erro na conexão:', error.message)
    console.error('🔍 Detalhes do erro:', error)

    if (error.message.includes('connect')) {
      console.log('💡 Dica: Verifique se a senha está correta e o projeto Supabase está ativo')
    } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('💡 Dica: As tabelas podem não ter sido criadas. Execute o schema.sql no Supabase')
    }
  } finally {
    // Sempre fechar a conexão
    try {
      await sql.end()
      console.log('🔌 Conexão fechada')
    } catch (e) {
      console.log('⚠️  Erro ao fechar conexão:', e.message)
    }
  }

  return connected
}

// Executar teste automaticamente quando o script for chamado
testConnection().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('💥 Erro fatal:', error)
  process.exit(1)
})

export { testConnection }