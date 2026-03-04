import { NextRequest, NextResponse } from 'next/server'
import { aiLearning } from '@/lib/actions/ai-learning'
import { requireStudioAccess } from '@/lib/auth/require-studio-access'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // 1. Validar acesso ao estúdio
    const { studioId, type, data } = await request.json()
    
    if (!studioId || !type || !data) {
      return NextResponse.json({ 
        error: 'Parâmetros studioId, type e data são obrigatórios' 
      }, { status: 400 })
    }

    await requireStudioAccess(request, studioId)

    // 2. Processar baseado no tipo de aprendizado
    switch (type) {
      case 'interaction':
        await aiLearning.learnFromInteraction({
          studioId,
          question: data.question,
          answer: data.answer,
          context: data.context,
          intent: data.intent,
          confidence: data.confidence
        })
        break

      case 'feedback':
        await aiLearning.processFeedback({
          studioId,
          interactionId: data.interactionId,
          originalQuestion: data.originalQuestion,
          originalAnswer: data.originalAnswer,
          feedback: data.feedback,
          correctedAnswer: data.correctedAnswer,
          reason: data.reason,
          rating: data.rating
        })
        break

      case 'pattern':
        // Implementar se necessário
        break

      default:
        return NextResponse.json({ 
          error: 'Tipo de aprendizado inválido' 
        }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Aprendizado processado com sucesso'
    })

  } catch (error) {
    logger.error('Erro no endpoint de aprendizado:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const type = searchParams.get('type') // 'knowledge' | 'patterns' | 'context'

    if (!studioId) {
      return NextResponse.json({ 
        error: 'Studio ID é obrigatório' 
      }, { status: 400 })
    }

    await requireStudioAccess(request, studioId)

    let result

    switch (type) {
      case 'knowledge':
        result = await aiLearning.getLearnedKnowledge(studioId, query || '', category || undefined)
        break

      case 'patterns':
        result = await aiLearning.getResponsePatterns(studioId, query || '')
        break

      case 'context':
        result = await aiLearning.getEnrichedContext(studioId)
        break

      case 'report':
        const days = parseInt(searchParams.get('days') || '30')
        result = await aiLearning.getLearningReport(studioId, days)
        break

      default:
        return NextResponse.json({ 
          error: 'Tipo de consulta inválido' 
        }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    logger.error('Erro no endpoint GET de aprendizado:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
