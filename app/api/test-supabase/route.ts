import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Apenas disponível em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Endpoint não disponível em produção' }, { status: 404 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
  }

  const { data: internalUser } = await supabaseAdmin
    .from('users_internal')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!internalUser || internalUser.role !== 'super_admin') {
    return NextResponse.json({ success: false, error: 'Acesso restrito a super administradores' }, { status: 403 })
  }

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