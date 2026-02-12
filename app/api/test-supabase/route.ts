import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando teste de conexão Supabase...')

    const { url, anonKey } = await request.json()
    console.log('📝 Credenciais recebidas:', {
      url: url ? `${url.substring(0, 30)}...` : 'ausente',
      anonKey: anonKey ? `${anonKey.substring(0, 20)}...` : 'ausente'
    })

    if (!url || !anonKey) {
      console.log('❌ Credenciais obrigatórias ausentes')
      return NextResponse.json({
        success: false,
        error: 'URL e chave anônima são obrigatórios'
      }, { status: 400 })
    }

    console.log('🔗 Criando cliente Supabase...')
    const supabase = createClient(url, anonKey)

    console.log('🧪 Testando conexão básica...')
    // Teste básico - verificar se conseguimos fazer qualquer requisição
    const { error: basicError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    if (basicError) {
      console.log('❌ Erro na conexão:', basicError.message)
      return NextResponse.json({
        success: false,
        error: `Erro de conexão: ${basicError.message}`
      }, { status: 500 })
    }

    console.log('✅ Conexão estabelecida com sucesso!')
    return NextResponse.json({
      success: true,
      message: 'Conexão estabelecida com sucesso!'
    })

  } catch (error: any) {
    console.error('💥 Erro interno:', error.message)
    return NextResponse.json({
      success: false,
      error: `Erro interno: ${error.message}`
    }, { status: 500 })
  }
}