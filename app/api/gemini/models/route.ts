import { NextResponse } from 'next/server'
import logger from '@/lib/logger';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key do Gemini não configurada no servidor' },
        { status: 500 }
      )
    }

    // Buscar modelos disponíveis do Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      logger.error('Erro ao buscar modelos do Gemini:', errorData)
      return NextResponse.json(
        { error: 'Erro ao buscar modelos disponíveis' },
        { status: 500 }
      )
    }

    const data = await response.json()
    logger.info('📋 Modelos disponíveis:', data.models?.map((m: any) => m.name) || 'Nenhum modelo encontrado')

    // Filtrar apenas modelos do Gemini que suportam generateContent
    const geminiModels = data.models
      .filter((model: any) =>
        model.name.includes('gemini') &&
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .map((model: any) => ({
        id: model.name.split('/').pop(), // Extrair apenas o nome do modelo
        name: model.displayName || model.name.split('/').pop(),
        description: model.description || `Modelo ${model.name.split('/').pop()}`,
        version: model.version || '1.0'
      }))
      .sort((a: any, b: any) => b.version.localeCompare(a.version)) // Ordenar por versão mais recente

    logger.info('🎯 Modelos Gemini filtrados:', geminiModels.map((m: { id: string }) => m.id))

    return NextResponse.json({
      models: geminiModels,
      total: geminiModels.length,
      rawModels: data.models?.map((m: any) => ({ name: m.name, methods: m.supportedGenerationMethods })) || []
    })

  } catch (error) {
    logger.error('Erro no servidor ao buscar modelos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}