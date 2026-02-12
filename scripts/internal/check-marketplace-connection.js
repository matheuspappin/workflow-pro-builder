import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function check() {
  console.log('🔍 Verificando tabela marketplace_settings...')
  const { data, error } = await supabase
    .from('marketplace_settings')
    .select('*')
    .limit(1)

  if (error) {
    if (error.code === '42P01') {
      console.error('❌ ERRO: A tabela "marketplace_settings" NÃO EXISTE.')
      console.log('👉 Por favor, copie o conteúdo de "database/migrations/05_create_marketplace_table.sql" e execute no SQL Editor do seu painel Supabase.')
    } else {
      console.error('❌ Erro inesperado:', error.message)
    }
  } else {
    console.log('✅ Tabela encontrada e acessível!')
  }
}

check()
