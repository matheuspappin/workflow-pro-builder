'use server'

import { aiLearning } from './ai-learning'
import { getStudioKnowledge } from './knowledge-base'
import { detectIntent } from '../intent-detection'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'

export interface EnhancedAIResponse {
  response: string
  confidence: number
  sources: string[]
  learned: boolean
  context: any
}

export class EnhancedAIChat {
  /**
   * Processa mensagem com aprendizado contínuo
   */
  async processMessageWithLearning(
    message: string,
    studioId: string,
    context?: any,
    provider: 'chatgpt' | 'gemini' = 'gemini'
  ): Promise<EnhancedAIResponse> {
    try {
      // 1. Obter contexto enriquecido com aprendizado
      const enrichedContext = await aiLearning.getEnrichedContext(studioId)
      
      // 2. Buscar conhecimento aprendido relevante
      const learnedKnowledge = await aiLearning.getLearnedKnowledge(studioId, message)
      
      // 3. Buscar padrões de resposta
      const patterns = await aiLearning.getResponsePatterns(studioId)
      
      // 4. Detectar intenção
      const intent = await detectIntent(message, {
        ...context,
        learned_knowledge: learnedKnowledge,
        response_patterns: patterns
      })
      
      // 5. Gerar resposta enriquecida
      const response = await this.generateEnhancedResponse(
        message,
        intent,
        enrichedContext,
        learnedKnowledge,
        patterns,
        provider
      )
      
      // 6. Salvar interação para aprendizado futuro
      await this.saveInteractionForLearning(studioId, message, response.response, intent)
      
      // 7. Atualizar contexto dinâmico
      await this.updateDynamicContextFromInteraction(studioId, message, intent)
      
      return response
      
    } catch (error) {
      logger.error('Erro no processamento enriquecido:', error)
      return {
        response: 'Desculpe, tive um problema ao processar sua mensagem.',
        confidence: 0.1,
        sources: [],
        learned: false,
        context: {}
      }
    }
  }

  /**
   * Processa feedback do usuário para aprendizado
   */
  async processUserFeedback(
    studioId: string,
    interactionId: string,
    originalQuestion: string,
    originalAnswer: string,
    feedback: 'positive' | 'negative' | 'neutral' | 'correction',
    correctedAnswer?: string,
    reason?: string,
    rating?: number
  ): Promise<void> {
    await aiLearning.processFeedback({
      studioId,
      interactionId,
      originalQuestion,
      originalAnswer,
      feedback,
      correctedAnswer,
      reason,
      rating
    })
  }

  /**
   * Obtém relatório de aprendizado do estúdio
   */
  async getLearningReport(studioId: string, days: number = 30) {
    return await aiLearning.getLearningReport(studioId, days)
  }

  // Métodos privados

  private async generateEnhancedResponse(
    message: string,
    intent: any,
    enrichedContext: any,
    learnedKnowledge: any[],
    patterns: any[],
    provider: string
  ): Promise<EnhancedAIResponse> {
    // 1. Verificar se há padrão correspondente
    const matchingPattern = this.findMatchingPattern(intent.type, patterns)
    
    if (matchingPattern) {
      const response = this.applyPattern(matchingPattern, message, enrichedContext)
      
      return {
        response,
        confidence: matchingPattern.success_rate,
        sources: ['pattern'],
        learned: true,
        context: enrichedContext
      }
    }

    // 2. Verificar se há conhecimento aprendido relevante
    const relevantKnowledge = this.findRelevantKnowledge(message, learnedKnowledge)
    
    if (relevantKnowledge.length > 0) {
      const bestMatch = relevantKnowledge[0] // Já ordenado por confidence
      
      return {
        response: bestMatch.answer,
        confidence: bestMatch.confidence_score,
        sources: ['learned_knowledge'],
        learned: true,
        context: enrichedContext
      }
    }

    // 3. Gerar resposta via API (fallback)
    const apiResponse = await this.generateAPIResponse(message, intent, enrichedContext, provider)
    
    return {
      response: apiResponse.content,
      confidence: 0.7, // Confidence padrão para API
      sources: ['api'],
      learned: false,
      context: enrichedContext
    }
  }

  private findMatchingPattern(intentType: string, patterns: any[]): any {
    return patterns.find(pattern => 
      pattern.pattern_type === intentType || 
      pattern.context_keywords.includes(intentType)
    )
  }

  private findRelevantKnowledge(message: string, knowledge: any[]): any[] {
    return knowledge.filter(k => 
      message.toLowerCase().includes(k.question.toLowerCase()) ||
      k.question.toLowerCase().includes(message.toLowerCase())
    )
  }

  private applyPattern(pattern: any, message: string, context: any): string {
    let response = pattern.template
    
    // Substituir variáveis no template
    const variables = pattern.variables || []
    
    variables.forEach((variable: string) => {
      switch (variable) {
        case '{studio_name}':
          response = response.replace('{studio_name}', context.studioName || 'nosso estúdio')
          break
        case '{service}':
          response = response.replace('{service}', this.extractServiceFromMessage(message))
          break
        case '{time}':
          response = response.replace('{time}', new Date().toLocaleTimeString('pt-BR'))
          break
        // Adicionar mais variáveis conforme necessário
      }
    })
    
    return response
  }

  private extractServiceFromMessage(message: string): string {
    const services = ['aula', 'consulta', 'serviço', 'atendimento']
    for (const service of services) {
      if (message.toLowerCase().includes(service)) {
        return service
      }
    }
    return 'serviço'
  }

  private async generateAPIResponse(
    message: string,
    intent: any,
    context: any,
    provider: string
  ): Promise<{ content: string }> {
    // Construir prompt enriquecido com contexto aprendido
    const enrichedPrompt = this.buildEnrichedPrompt(message, intent, context)
    
    // Chamar API apropriada
    const endpoint = provider === 'chatgpt' ? '/api/chat' : '/api/gemini'
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || ''}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: enrichedPrompt,
        context: context,
        history: []
      })
    })
    
    if (!response.ok) {
      throw new Error(`API ${provider} error: ${response.status}`)
    }
    
    const data = await response.json()
    return { content: data.response || data.content }
  }

  private buildEnrichedPrompt(message: string, intent: any, context: any): string {
    let prompt = message
    
    // Adicionar contexto aprendido
    if (context.learnedKnowledge && context.learnedKnowledge.length > 0) {
      const relevantKnowledge = context.learnedKnowledge
        .slice(0, 3) // Top 3 conhecimentos
        .map((k: any) => `- ${k.question}: ${k.answer}`)
        .join('\n')
      
      prompt += `\n\nContexto aprendido relevante:\n${relevantKnowledge}`
    }
    
    // Adicionar padrões de sucesso
    if (context.successfulPatterns && context.successfulPatterns.length > 0) {
      const patterns = context.successfulPatterns
        .slice(0, 2)
        .map((p: any) => `- ${p.pattern_name}: ${p.template}`)
        .join('\n')
      
      prompt += `\n\nPadrões de resposta bem-sucedidos:\n${patterns}`
    }
    
    return prompt
  }

  private async saveInteractionForLearning(
    studioId: string,
    question: string,
    answer: string,
    intent: any
  ): Promise<void> {
    try {
      await aiLearning.learnFromInteraction({
        studioId,
        question,
        answer,
        intent: intent.type,
        confidence: intent.confidence,
        context: intent.data
      })
    } catch (error) {
      logger.error('Erro ao salvar interação para aprendizado:', error)
    }
  }

  private async updateDynamicContextFromInteraction(
    studioId: string,
    message: string,
    intent: any
  ): Promise<void> {
    try {
      // Atualizar contexto baseado na interação
      const contextData = {
        lastInteraction: {
          message,
          intent: intent.type,
          timestamp: new Date().toISOString()
        },
        frequentIntents: intent.type
      }
      
      await aiLearning.updateDynamicContext(
        studioId,
        'interaction_history',
        contextData,
        2
      )
    } catch (error) {
      logger.error('Erro ao atualizar contexto dinâmico:', error)
    }
  }
}

// Singleton para uso em toda aplicação
export const enhancedAIChat = new EnhancedAIChat()
