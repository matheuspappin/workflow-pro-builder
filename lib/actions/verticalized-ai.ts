'use server'

import { getStudioKnowledge } from './knowledge-base'
import { detectIntent } from '../intent-detection'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'

export interface VerticalizedAIConfig {
  niche: string
  specializedKeywords: Record<string, string[]>
  customResponses: Record<string, string>
  knowledgeFilters: Record<string, any>
  intentPriorities: string[]
}

export async function getVerticalizedAIConfig(studioId: string): Promise<VerticalizedAIConfig> {
  try {
    // 1. Buscar verticalização do estúdio
    const { data: studio } = await supabase
      .from('studios')
      .select(`
        verticalization_id,
        verticalizations!inner(
          slug,
          niche,
          modules
        )
      `)
      .eq('id', studioId)
      .single()

    if (!studio?.verticalization_id) {
      return getDefaultAIConfig()
    }

    const verticalization = studio.verticalizations as any
    const slug = verticalization.slug

    // 2. Retornar configuração especializada baseada na verticalização
    switch (slug) {
      case 'estudio-de-danca':
        return getDanceStudioAIConfig()
      case 'agroflowai':
        return getAgroFlowAIConfig()
      case 'fire-protection':
        return getFireProtectionAIConfig()
      default:
        return getDefaultAIConfig()
    }
  } catch (error) {
    logger.error('Erro ao buscar configuração verticalizada:', error)
    return getDefaultAIConfig()
  }
}

function getDanceStudioAIConfig(): VerticalizedAIConfig {
  return {
    niche: 'dance_studio',
    specializedKeywords: {
      SCHEDULE: ['aula', 'aulas', 'turma', 'turmas', 'matrícula', 'matricular', 'dança', 'balé', 'samba', 'hip hop'],
      PRICE: ['mensalidade', 'plano', 'pacote', 'valor', 'preço', 'cobrar'],
      SERVICE: ['aula experimental', 'aula grátis', 'avaliação', 'professor', 'instrutor'],
      CONTACT: ['telefone', 'endereço', 'localização', 'horário de funcionamento'],
      AVAILABILITY: ['vagas', 'lotado', 'tem vaga', 'aceita alunos', 'disponível']
    },
    customResponses: {
      welcome: 'Olá! Sou a assistente virtual do estúdio. Posso ajudar com matrículas, horários de aulas, valores e informações sobre nossos professores.',
      pricing: 'Nossos planos incluem aulas semanais com valores acessíveis. Que tipo de dança você tem interesse?',
      schedule: 'Posso verificar nossos horários disponíveis. Qual modalidade de dança você prefere e quais dias da semana?',
      contact: 'Estamos localizados em [endereço] e funcionamos de [horários]. Quer agendar uma visita ou aula experimental?'
    },
    knowledgeFilters: {
      services: { category: ['dance', 'fitness', 'art'] },
      professionals: { specialties: ['dance', 'ballet', 'hip-hop', 'samba'] }
    },
    intentPriorities: ['schedule_request', 'price_inquiry', 'enrollment_request', 'service_info']
  }
}

function getAgroFlowAIConfig(): VerticalizedAIConfig {
  return {
    niche: 'environmental_compliance',
    specializedKeywords: {
      SCHEDULE: ['vistoria', 'inspeção', 'visita técnica', 'laudo', 'relatório'],
      PRICE: ['orçamento', 'custo', 'valor', 'honorários', 'taxa'],
      SERVICE: ['CAR', 'licenciamento', 'regularização', 'compliance', 'ambiental', 'desmatamento'],
      CONTACT: ['engenheiro', 'técnico', 'especialista', 'contato'],
      AVAILABILITY: ['agenda', 'disponibilidade', 'prazo', 'tempo', 'atendimento']
    },
    customResponses: {
      welcome: 'Olá! Sou o assistente virtual AgroFlowAI. Posso ajudar com laudos ambientais, regularização CAR, licenciamentos e vistorias técnicas.',
      pricing: 'Nossos honorários variam conforme o serviço. Que tipo de regularização ambiental você precisa?',
      schedule: 'Posso agendar uma vistoria técnica. Qual é a propriedade e qual serviço ambiental você necessita?',
      contact: 'Nossa equipe de engenheiros está à disposição. Quer falar com um especialista em CAR ou licenciamento?'
    },
    knowledgeFilters: {
      services: { category: ['environmental', 'compliance', 'technical'] },
      professionals: { specialties: ['environmental', 'agricultural', 'engineering'] }
    },
    intentPriorities: ['service_info', 'schedule_request', 'contact_request', 'price_inquiry']
  }
}

function getFireProtectionAIConfig(): VerticalizedAIConfig {
  return {
    niche: 'fire_protection',
    specializedKeywords: {
      SCHEDULE: ['vistoria', 'inspeção', 'manutenção', 'recarga', 'teste', 'visita técnica'],
      PRICE: ['orçamento', 'extintor', 'sistema', 'manutenção', 'certificado', 'laudo'],
      SERVICE: ['extintor', 'hidrante', 'alarme', 'iluminação', 'sinalização', 'sistema de combate'],
      CONTACT: ['técnico', 'engenheiro', 'bombeiro', 'especialista', 'contato'],
      AVAILABILITY: ['agenda', 'disponibilidade', 'emergência', 'urgência', 'prazo']
    },
    customResponses: {
      welcome: 'Olá! Sou o assistente virtual de proteção contra incêndios. Posso ajudar com manutenção de extintores, sistemas e certificações.',
      pricing: 'Nossos serviços incluem manutenção e recarga de extintores. Que tipo de sistema você tem?',
      schedule: 'Posso agendar uma vistoria técnica. Qual o endereço e quais equipamentos precisam de manutenção?',
      contact: 'Nossa equipe técnica está disponível. Precisa de atendimento emergencial ou agendamento?'
    },
    knowledgeFilters: {
      services: { category: ['fire_protection', 'safety', 'maintenance'] },
      professionals: { specialties: ['fire_safety', 'engineering', 'technical'] }
    },
    intentPriorities: ['service_info', 'schedule_request', 'contact_request', 'price_inquiry']
  }
}

function getDefaultAIConfig(): VerticalizedAIConfig {
  return {
    niche: 'general',
    specializedKeywords: {
      SCHEDULE: ['agendar', 'marcar', 'horário', 'consulta'],
      PRICE: ['quanto custa', 'preço', 'valor'],
      SERVICE: ['serviço', 'o que é', 'como funciona'],
      CONTACT: ['contato', 'telefone', 'endereço'],
      AVAILABILITY: ['disponível', 'vagas', 'agenda']
    },
    customResponses: {
      welcome: 'Olá! Sou o assistente virtual. Como posso ajudar você hoje?',
      pricing: 'Posso fornecer informações sobre nossos serviços e valores.',
      schedule: 'Posso verificar nossa agenda. Que tipo de atendimento você precisa?',
      contact: 'Posso fornecer nossas informações de contato.'
    },
    knowledgeFilters: {},
    intentPriorities: ['general', 'info_request', 'schedule_request']
  }
}

export async function processVerticalizedAIMessage(
  message: string,
  from: string,
  studioId: string,
  channel: 'whatsapp' | 'chat' | 'sms' = 'whatsapp'
) {
  try {
    // 1. Obter configuração verticalizada
    const config = await getVerticalizedAIConfig(studioId)
    
    // 2. Detectar intenção com keywords especializadas
    const intent = await detectIntent(message, { 
      studio_id: studioId,
      verticalization: config.niche,
      specializedKeywords: config.specializedKeywords
    })
    
    // 3. Buscar conhecimento com filtros
    const knowledge = await getStudioKnowledge(studioId)
    
    // 4. Processar com respostas customizadas
    let response = ''
    
    // Usar respostas customizadas baseadas na intenção
    if (intent.type === 'general' && config.customResponses.welcome) {
      response = config.customResponses.welcome
    } else if (intent.type === 'price_inquiry' && config.customResponses.pricing) {
      response = config.customResponses.pricing
    } else if (intent.type === 'schedule_request' && config.customResponses.schedule) {
      response = config.customResponses.schedule
    } else if (intent.type === 'contact_request' && config.customResponses.contact) {
      response = config.customResponses.contact
    } else {
      // Fallback para processamento padrão
      response = await generateStandardResponse(intent, knowledge, config)
    }
    
    // 5. Salvar interação
    await saveInteraction({
      studioId,
      from,
      message,
      response,
      intent: intent.type,
      channel,
      verticalization: config.niche
    })
    
    return {
      response,
      intent: intent.type,
      verticalization: config.niche,
      success: true
    }
    
  } catch (error) {
    logger.error('Erro ao processar mensagem verticalizada:', error)
    return {
      response: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.',
      intent: 'error',
      success: false
    }
  }
}

async function generateStandardResponse(
  intent: any, 
  knowledge: any, 
  config: VerticalizedAIConfig
): Promise<string> {
  // Implementação baseada na intenção e conhecimento
  switch (intent.type) {
    case 'service_info':
      return `Posso ajudar com informações sobre nossos serviços especializados em ${config.niche}.`
    case 'availability_check':
      return 'Vou verificar nossa agenda e retornar com as opções disponíveis.'
    default:
      return 'Entendi sua solicitação. Vou processar e retornar com as informações necessárias.'
  }
}

async function saveInteraction(data: {
  studioId: string
  from: string
  message: string
  response: string
  intent: string
  channel: string
  verticalization: string
}) {
  try {
    await supabase.from('ai_interactions').insert({
      studio_id: data.studioId,
      customer_contact: data.from,
      message: data.message,
      ai_response: data.response,
      intent_type: data.intent,
      channel: data.channel,
      action_data: { verticalization: data.verticalization },
      created_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Erro ao salvar interação verticalizada:', error)
  }
}
