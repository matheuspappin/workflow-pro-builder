import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info('🔄 Iniciando teste de conexão Supabase...')

    const { url, anonKey } = await request.json()
    logger.info('📝 Credenciais recebidas:', {
      url: url ? `${url.substring(0, 30)}...` : 'ausente',
      anonKey: anonKey ? `${anonKey.substring(0, 20)}...` : 'ausente'
    })

    if (!url || !anonKey) {
      logger.warn('❌ Credenciais obrigatórias ausentes')
      return NextResponse.json({
        success: false,
        error: 'URL e chave anônima são obrigatórios'
      }, { status: 400 })
    }

    logger.info('🔗 Criando cliente Supabase...')
    const supabase = createClient(url, anonKey)

    logger.info('🧪 Testando conexão básica...')
    // Teste básico - verificar se conseguimos fazer qualquer requisição
    const { error: basicError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    if (basicError) {
      logger.error('❌ Erro na conexão:', basicError.message)
      return NextResponse.json({
        success: false,
        error: `Erro de conexão: ${basicError.message}`
      }, { status: 500 })
    }

    logger.info('✅ Conexão estabelecida com sucesso!')
    return NextResponse.json({
      success: true,
      message: 'Conexão estabelecida com sucesso!'
    })

  } catch (error: any) {
    logger.error('💥 Erro interno:', error.message)
    return NextResponse.json({
      success: false,
      error: `Erro interno: ${error.message}`
    }, { status: 500 })
  }
}