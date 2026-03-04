import { createClient } from '@/lib/supabase/server'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'

export interface LearningData {
  studioId: string
  question: string
  answer: string
  context?: any
  intent?: string
  confidence?: number
}

export interface FeedbackData {
  studioId: string
  interactionId?: string
  originalQuestion: string
  originalAnswer: string
  feedback: 'positive' | 'negative' | 'neutral' | 'correction'
  correctedAnswer?: string
  reason?: string
  rating?: number
}

export interface PatternData {
  studioId: string
  patternName: string
  patternType: 'greeting' | 'farewell' | 'confirmation' | 'apology' | 'information'
  template: string
  variables: string[]
  keywords: string[]
}

export class AISelfLearning {
  private client: any

  constructor() {
    this.client = null
  }

  private async getClient() {
    if (!this.client) {
      this.client = await createClient()
    }
    return this.client
  }

  /**
   * Processa uma interação e aprende com ela
   */
  async learnFromInteraction(data: LearningData): Promise<void> {
    try {
      const client = await this.getClient()
      
      // 1. Detectar se esta é uma nova informação que vale a pena aprender
      const shouldLearn = await this.shouldLearnFromInteraction(data)
      
      if (!shouldLearn) {
        return
      }

      // 2. Extrair padrões e conhecimento
      const knowledge = await this.extractKnowledge(data)
      
      // 3. Salvar conhecimento aprendido
      await this.saveLearnedKnowledge(knowledge)
      
      // 4. Atualizar métricas de aprendizado
      await this.updateLearningMetrics(data.studioId)
      
      logger.info('IA aprendeu nova informação', {
        studioId: data.studioId,
        category: knowledge.category,
        confidence: knowledge.confidence
      })
      
    } catch (error) {
      logger.error('Erro no aprendizado da IA:', error)
    }
  }

  /**
   * Processa feedback do usuário para melhorar respostas
   */
  async processFeedback(data: FeedbackData): Promise<void> {
    try {
      const client = await this.getClient()
      
      // 1. Salvar feedback
      await client.from('ai_response_feedback').insert({
        studio_id: data.studioId,
        interaction_id: data.interactionId,
        original_question: data.originalQuestion,
        original_answer: data.originalAnswer,
        user_feedback: data.feedback,
        corrected_answer: data.correctedAnswer,
        feedback_reason: data.reason,
        rating: data.rating
      })

      // 2. Se for correção, aprender com a resposta corrigida
      if (data.feedback === 'correction' && data.correctedAnswer) {
        await this.learnFromCorrection(data)
      }

      // 3. Atualizar confidence do conhecimento existente
      await this.updateKnowledgeConfidence(data)

      // 4. Identificar padrões de feedback
      await this.analyzeFeedbackPatterns(data.studioId)
      
      logger.info('Feedback processado', {
        studioId: data.studioId,
        feedback: data.feedback,
        rating: data.rating
      })
      
    } catch (error) {
      logger.error('Erro ao processar feedback:', error)
    }
  }

  /**
   * Busca conhecimento aprendido para enriquecer respostas
   */
  async getLearnedKnowledge(studioId: string, query: string, category?: string): Promise<any[]> {
    try {
      const client = await this.getClient()
      
      let queryBuilder = client
        .from('ai_learned_knowledge')
        .select('*')
        .eq('studio_id', studioId)
        .eq('is_active', true)
        .gte('confidence_score', 0.3) // Apenas conhecimento com confidence razoável
        .order('confidence_score', { ascending: false })
        .limit(10)

      if (category) {
        queryBuilder = queryBuilder.eq('category', category)
      }

      // Busca por similaridade de texto
      const { data } = await queryBuilder.textSearch('question', query)
      
      return data || []
      
    } catch (error) {
      logger.error('Erro ao buscar conhecimento aprendido:', error)
      return []
    }
  }

  /**
   * Busca padrões de resposta aprendidos
   */
  async getResponsePatterns(studioId: string, intent?: string): Promise<any[]> {
    try {
      const client = await this.getClient()
      
      let queryBuilder = client
        .from('ai_response_patterns')
        .select('*')
        .eq('studio_id', studioId)
        .eq('is_active', true)
        .order('success_rate', { ascending: false })
        .limit(5)

      if (intent) {
        queryBuilder = queryBuilder.contains('context_keywords', [intent])
      }

      const { data } = await queryBuilder
      
      return data || []
      
    } catch (error) {
      logger.error('Erro ao buscar padrões de resposta:', error)
      return []
    }
  }

  /**
   * Atualiza contexto dinâmico do estúdio
   */
  async updateDynamicContext(studioId: string, contextType: string, content: any, priority: number = 2): Promise<void> {
    try {
      const client = await this.getClient()
      
      await client.from('ai_dynamic_context').upsert({
        studio_id: studioId,
        context_type: contextType,
        content,
        priority,
        source: 'auto_generated',
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'studio_id,context_type'
      })
      
    } catch (error) {
      logger.error('Erro ao atualizar contexto dinâmico:', error)
    }
  }

  /**
   * Obtém contexto enriquecido para a IA
   */
  async getEnrichedContext(studioId: string): Promise<any> {
    try {
      const client = await this.getClient()
      
      // 1. Buscar contexto dinâmico
      const { data: dynamicContext } = await client
        .from('ai_dynamic_context')
        .select('*')
        .eq('studio_id', studioId)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(10)

      // 2. Buscar conhecimento mais relevante
      const { data: topKnowledge } = await client
        .from('ai_learned_knowledge')
        .select('category, question, answer, confidence_score')
        .eq('studio_id', studioId)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(20)

      // 3. Buscar padrões de sucesso
      const { data: successfulPatterns } = await client
        .from('ai_response_patterns')
        .select('pattern_name, template, success_rate')
        .eq('studio_id', studioId)
        .eq('is_active', true)
        .gte('success_rate', 0.8)
        .limit(15)

      return {
        dynamicContext: dynamicContext || [],
        learnedKnowledge: topKnowledge || [],
        successfulPatterns: successfulPatterns || [],
        lastUpdated: new Date().toISOString()
      }
      
    } catch (error) {
      logger.error('Erro ao obter contexto enriquecido:', error)
      return {
        dynamicContext: [],
        learnedKnowledge: [],
        successfulPatterns: [],
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Gera relatório de aprendizado
   */
  async getLearningReport(studioId: string, days: number = 30): Promise<any> {
    try {
      const client = await this.getClient()
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      // 1. Métricas gerais
      const { data: metrics } = await client
        .from('ai_learning_metrics')
        .select('*')
        .eq('studio_id', studioId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      // 2. Top conhecimento aprendido
      const { data: topKnowledge } = await client
        .from('ai_learned_knowledge')
        .select('category, question, usage_count, success_rate')
        .eq('studio_id', studioId)
        .order('usage_count', { ascending: false })
        .limit(10)

      // 3. Feedback recebido
      const { data: feedback } = await client
        .from('ai_response_feedback')
        .select('user_feedback, rating, created_at')
        .eq('studio_id', studioId)
        .gte('created_at', startDate.toISOString())

      // 4. Padrões mais usados
      const { data: patterns } = await client
        .from('ai_response_patterns')
        .select('pattern_name, pattern_type, usage_count, success_rate')
        .eq('studio_id', studioId)
        .order('usage_count', { ascending: false })
        .limit(10)

      // 5. Evolução do learning score
      const learningEvolution = (metrics || []).map((m: any) => ({
        date: m.date,
        score: m.learning_score,
        interactions: m.total_interactions,
        successRate: m.total_interactions > 0 ? (m.successful_responses / m.total_interactions) * 100 : 0
      }))

      return {
        period: `${days} dias`,
        evolution: learningEvolution,
        topKnowledge: topKnowledge || [],
        feedbackSummary: this.summarizeFeedback(feedback || []),
        topPatterns: patterns || [],
        totalInteractions: (metrics || []).reduce((sum: number, m: any) => sum + m.total_interactions, 0),
        averageLearningScore: (metrics || []).reduce((sum: number, m: any) => sum + m.learning_score, 0) / (metrics.length || 1)
      }
      
    } catch (error) {
      logger.error('Erro ao gerar relatório de aprendizado:', error)
      return {
        period: `${days} dias`,
        evolution: [],
        topKnowledge: [],
        feedbackSummary: {},
        topPatterns: [],
        totalInteractions: 0,
        averageLearningScore: 0
      }
    }
  }

  // Métodos privados

  private async shouldLearnFromInteraction(data: LearningData): Promise<boolean> {
    // Regras para decidir se deve aprender:
    // 1. Resposta com alta confidence
    // 2. Intenção clara e específica
    // 3. Conteúdo não genérico
    // 4. Não é conhecimento já existente
    
    const confidence = data.confidence || 0.5
    const isGeneric = this.isGenericResponse(data.answer)
    
    return confidence > 0.7 && !isGeneric
  }

  private isGenericResponse(answer: string): boolean {
    const genericPhrases = [
      'Como posso ajudar',
      'Entendi sua mensagem',
      'Vou verificar',
      'Por favor',
      'Obrigado',
      'Desculpe'
    ]
    
    return genericPhrases.some(phrase => 
      answer.toLowerCase().includes(phrase.toLowerCase())
    )
  }

  private async extractKnowledge(data: LearningData): Promise<any> {
    // Categorizar o conhecimento
    let category = 'general'
    
    if (data.question.includes('preço') || data.question.includes('valor')) {
      category = 'pricing'
    } else if (data.question.includes('horário') || data.question.includes('agenda')) {
      category = 'schedule'
    } else if (data.question.includes('serviço') || data.question.includes('aula')) {
      category = 'service_info'
    } else if (data.question.includes('contato') || data.question.includes('endereço')) {
      category = 'contact'
    }

    return {
      studioId: data.studioId,
      category,
      question: data.question,
      answer: data.answer,
      confidenceScore: data.confidence || 0.8,
      sourceType: 'conversation',
      sourceData: {
        intent: data.intent,
        context: data.context
      }
    }
  }

  private async saveLearnedKnowledge(knowledge: any): Promise<void> {
    const client = await this.getClient()
    
    // Verificar se conhecimento similar já existe
    const { data: existing } = await client
      .from('ai_learned_knowledge')
      .select('id, usage_count')
      .eq('studio_id', knowledge.studioId)
      .eq('category', knowledge.category)
      .textSearch('question', knowledge.question)
      .limit(1)

    if (existing && existing.length > 0) {
      // Atualizar conhecimento existente
      await client
        .from('ai_learned_knowledge')
        .update({
          usage_count: existing[0].usage_count + 1,
          confidence_score: Math.min(1.0, existing[0].confidence_score + 0.1),
          last_used: new Date().toISOString()
        })
        .eq('id', existing[0].id)
    } else {
      // Criar novo conhecimento
      await client
        .from('ai_learned_knowledge')
        .insert({
          studio_id: knowledge.studioId,
          category: knowledge.category,
          question: knowledge.question,
          answer: knowledge.answer,
          confidence_score: knowledge.confidenceScore,
          source_type: knowledge.sourceType,
          source_data: knowledge.sourceData,
          usage_count: 1
        })
    }
  }

  private async updateLearningMetrics(studioId: string): Promise<void> {
    const client = await this.getClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Atualizar ou criar métricas do dia
    await client.from('ai_learning_metrics').upsert({
      studio_id: studioId,
      date: today,
      total_interactions: 1, // Será incrementado
      successful_responses: 1,
      new_knowledge_items: 1,
      learning_score: 0.1
    }, {
      onConflict: 'studio_id,date'
    })
  }

  private async learnFromCorrection(data: FeedbackData): Promise<void> {
    const client = await this.getClient()
    
    // Salvar a correção como novo conhecimento com alta confidence
    await client.from('ai_learned_knowledge').insert({
      studio_id: data.studioId,
      category: 'correction',
      question: data.originalQuestion,
      answer: data.correctedAnswer,
      confidence_score: 0.95, // Alta confidence para correções manuais
      source_type: 'correction',
      source_data: {
        originalAnswer: data.originalAnswer,
        feedbackReason: data.reason
      }
    })
  }

  private async updateKnowledgeConfidence(data: FeedbackData): Promise<void> {
    const client = await this.getClient()
    
    const adjustment = data.feedback === 'positive' ? 0.1 : 
                      data.feedback === 'negative' ? -0.1 : 0
    
    if (adjustment !== 0) {
      // Buscar conhecimento relacionado e ajustar confidence
      await client.rpc('adjust_knowledge_confidence', {
        p_studio_id: data.studioId,
        p_question: data.originalQuestion,
        p_adjustment: adjustment
      })
    }
  }

  private async analyzeFeedbackPatterns(studioId: string): Promise<void> {
    const client = await this.getClient()
    
    // Analisar padrões de feedback para identificar áreas de melhoria
    const { data: recentFeedback } = await client
      .from('ai_response_feedback')
      .select('*')
      .eq('studio_id', studioId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (!recentFeedback || recentFeedback.length === 0) {
      return
    }

    // Identificar padrões e gerar insights
    const negativeFeedback = recentFeedback.filter((f: any) => f.user_feedback === 'negative')
    const corrections = recentFeedback.filter((f: any) => f.user_feedback === 'correction')
    
    if (negativeFeedback.length > 3) {
      // Muitos feedbacks negativos - sinal para ajustar estratégia
      await this.updateDynamicContext(studioId, 'learning_alerts', {
        type: 'high_negative_feedback',
        count: negativeFeedback.length,
        suggestions: this.generateImprovementSuggestions(negativeFeedback)
      }, 1)
    }
  }

  private generateImprovementSuggestions(negativeFeedback: any[]): string[] {
    // Analisar feedbacks negativos e gerar sugestões
    const suggestions = [
      'Revisar templates de resposta para esta categoria',
      'Adicionar mais contexto do estúdio',
      'Melhorar detecção de intenção',
      'Personalizar tom de comunicação'
    ]
    
    return suggestions.slice(0, 3)
  }

  private summarizeFeedback(feedback: any[]): any {
    const total = feedback.length
    if (total === 0) return {}

    const positive = feedback.filter(f => f.user_feedback === 'positive').length
    const negative = feedback.filter(f => f.user_feedback === 'negative').length
    const neutral = feedback.filter(f => f.user_feedback === 'neutral').length
    const corrections = feedback.filter(f => f.user_feedback === 'correction').length

    const avgRating = feedback
      .filter(f => f.rating)
      .reduce((sum, f) => sum + f.rating, 0) / feedback.filter(f => f.rating).length

    return {
      total,
      positive,
      negative,
      neutral,
      corrections,
      averageRating: avgRating || 0,
      satisfactionRate: (positive / total) * 100
    }
  }
}

// Singleton para uso em toda aplicação
export const aiLearning = new AISelfLearning()
