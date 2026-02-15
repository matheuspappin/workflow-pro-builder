import { NextRequest, NextResponse } from 'next/server'
import { nicheDictionary } from '@/config/niche-dictionary'
import { getAdminClient } from '@/lib/server-utils'
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')

  if (!studioId) {
    return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
  }

  try {
    const adminClient = await getAdminClient()

    if (!adminClient) {
      return NextResponse.json({ error: 'Serviço de Admin indisponível' }, { status: 500 })
    }

    const { data: settings, error } = await adminClient
      .from('organization_settings')
      .select('niche, enabled_modules, vocabulary')
      .eq('studio_id', studioId)
      .single()

    if (error) {
      logger.error('Erro ao buscar configurações do nicho:', error)
      return NextResponse.json({ error: 'Configurações do nicho não encontradas' }, { status: 404 })
    }

    // Retorna o nicho, o vocabulário correspondente do dicionário ou o do banco de dados, e os módulos habilitados.
    const currentNiche = settings.niche as keyof typeof nicheDictionary.pt || 'dance'
    const vocabulary = settings.vocabulary || nicheDictionary.pt[currentNiche]

    return NextResponse.json({
      niche: currentNiche,
      vocabulary: vocabulary,
      enabledModules: settings.enabled_modules,
      schemas: {} // Placeholder por enquanto
    })
  } catch (error) {
    logger.error('Erro inesperado na API de nicho:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
