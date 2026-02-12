/**
 * Teste rápido de conexão Supabase
 * Execute: node test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testando conexão Supabase...')
console.log('📍 URL:', supabaseUrl ? 'Configurada' : '❌ AUSENTE')
console.log('🔑 Key:', supabaseKey ? 'Configurada' : '❌ AUSENTE')

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ ERRO: Credenciais não configuradas no .env')
  console.log('💡 Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔗 Testando conexão...')

    // Teste 1: Verificar se conseguimos conectar
    const { data: tables, error: tableError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    if (tableError) {
      console.log('❌ ERRO: Não conseguiu conectar ao banco')
      console.log('Detalhes:', tableError.message)

      if (tableError.message.includes('relation') || tableError.message.includes('does not exist')) {
        console.log('💡 SOLUÇÃO: Execute o schema.sql no SQL Editor do Supabase')
      } else if (tableError.message.includes('JWT') || tableError.message.includes('auth')) {
        console.log('💡 SOLUÇÃO: Verifique se as credenciais estão corretas')
      }
      return
    }

    console.log('✅ Conexão estabelecida!')

    // Teste 2: Contar registros
    const tableConfigs = [
      { name: 'students', label: 'Alunos' },
      { name: 'teachers', label: 'Professores' },
      { name: 'classes', label: 'Turmas' },
      { name: 'studio_settings', label: 'Configurações' }
    ]

    for (const table of tableConfigs) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ ${table.label}: Erro - ${error.message}`)
        } else {
          console.log(`✅ ${table.label}: ${count} registros`)
        }
      } catch (err) {
        console.log(`❌ ${table.label}: Erro inesperado`)
      }
    }

    console.log('\n🎉 Teste concluído! Supabase está funcionando.')

  } catch (error) {
    console.log('💥 ERRO FATAL:', error.message)
  }
}

testConnection()