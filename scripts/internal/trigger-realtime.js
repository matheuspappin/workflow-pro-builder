import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function triggerLog() {
  console.log('🚀 Disparando evento de teste para o Realtime...')
  
  const testEmail = `test-${Date.now()}@danceflow.ai`
  const studioId = '00000000-0000-0000-0000-000000000000'

  console.log('📝 1. Inserindo aluno de teste...')
  const { data: insertData, error: insertError } = await supabase
    .from('students')
    .insert([{
      studio_id: studioId,
      name: '⚠️ LOG TESTE REALTIME',
      email: testEmail,
      status: 'active'
    }])
    .select()

  if (insertError) {
    console.error('❌ Erro no insert:', insertError.message)
    return
  }
  console.log('✅ Registro inserido!')

  // Pequena pausa para garantir que o WebSocket receba o evento
  await new Promise(r => setTimeout(r, 2000))

  console.log('🗑️ 2. Deletando registro de teste...')
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .eq('email', testEmail)

  if (deleteError) {
    console.error('❌ Erro no delete:', deleteError.message)
  } else {
    console.log('✅ Registro deletado! Verifique a página /admin/logs no seu navegador.')
  }
}

triggerLog()
