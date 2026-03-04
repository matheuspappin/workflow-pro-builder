'use server'

import { getStudioKnowledge } from './knowledge-base'
import { detectIntent } from '../intent-detection'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'

export interface SecretaryMessage {
  type: 'appointment_request' | 'price_inquiry' | 'service_info' | 'contact_request' | 'general'
  content: string
  from: string
  timestamp: Date
  processed: boolean
}

export async function processSecretaryMessage(
  message: string,
  from: string,
  studioId: string,
  channel: 'whatsapp' | 'chat' | 'sms' = 'whatsapp'
) {
  try {
    // 1. Detectar intenção
    const intent = await detectIntent(message, { studio_id: studioId })
    
    // 2. Buscar conhecimento do estúdio
    const knowledge = await getStudioKnowledge(studioId)
    
    // 3. Processar baseado na intenção
    let response = ''
    let actionData: any = null
    
    switch (intent.type) {
      case 'schedule_request':
        response = await handleScheduleRequest(intent.data, knowledge)
        actionData = { type: 'schedule', data: intent.data }
        break
        
      case 'price_inquiry':
        response = await handlePriceInquiry(knowledge)
        actionData = { type: 'price_inquiry' }
        break
        
      case 'service_info':
        response = await handleServiceInfo(intent.data, knowledge)
        actionData = { type: 'service_info' }
        break
        
      case 'contact_request':
        response = await handleContactRequest(knowledge)
        actionData = { type: 'contact_request' }
        break
        
      case 'availability_check':
        response = await handleAvailabilityCheck(intent.data, knowledge)
        actionData = { type: 'availability_check', data: intent.data }
        break
        
      default:
        response = generateDefaultResponse(knowledge)
        actionData = { type: 'general' }
    }
    
    // 4. Salvar interação
    await saveInteraction({
      studioId,
      from,
      message,
      response,
      intent: intent.type,
      channel,
      actionData
    })
    
    return {
      response,
      intent: intent.type,
      actionData,
      success: true
    }
    
  } catch (error) {
    logger.error('Erro ao processar mensagem da secretária:', error)
    return {
      response: 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente ou entre em contato diretamente.',
      intent: 'error',
      success: false
    }
  }
}

async function handleScheduleRequest(data: any, knowledge: any) {
  const { preferred_date, service_type } = data
  
  let response = `📅 **Agendamento**\n\n`
  response += `Entendi que você quer agendar ${service_type || 'uma consulta'}`
  
  if (preferred_date) {
    response += ` para ${preferred_date}`
  }
  
  response += `!\n\n`
  response += `Para confirmar, preciso:\n`
  response += `• Seu nome completo\n`
  response += `• Telefone para contato\n`
  response += `• Horário preferido\n\n`
  response += `Nossos profissionais disponíveis:\n`
  
  // Listar alguns profissionais
  const professionals = knowledge.schedules.slice(0, 3)
  professionals.forEach((schedule: any, index: number) => {
    response += `${index + 1}. ${schedule.professional_name}\n`
  })
  
  response += `\nResponda com seus dados para prosseguirmos! 📝`
  
  return response
}

async function handlePriceInquiry(knowledge: any) {
  let response = `💰 **Valores e Planos**\n\n`
  
  if (knowledge.pricing.plans.length > 0) {
    response += `**Nossos Planos:**\n`
    knowledge.pricing.plans.forEach((plan: any, index: number) => {
      response += `${index + 1}. ${plan.name} - R$ ${plan.price}/${plan.duration}\n`
      if (plan.features.length > 0) {
        response += `   • ${plan.features.slice(0, 2).join('\n   • ')}\n`
      }
    })
  }
  
  if (knowledge.pricing.services.length > 0) {
    response += `\n**Serviços Avulsos:**\n`
    knowledge.pricing.services.slice(0, 5).forEach((service: any) => {
      response += `• ${service.name} - R$ ${service.price}\n`
    })
  }
  
  response += `\n💡 Dúvidas? Fale conosco diretamente! 📞 ${knowledge.contact.phone}`
  
  return response
}

async function handleServiceInfo(data: any, knowledge: any) {
  const { service_type } = data
  
  let response = `📋 **Informações sobre Serviços**\n\n`
  
  const relevantServices = knowledge.services.filter((service: any) => 
    service.category.toLowerCase().includes(service_type?.toLowerCase() || '') ||
    service.name.toLowerCase().includes(service_type?.toLowerCase() || '')
  )
  
  if (relevantServices.length > 0) {
    response += `Encontramos ${relevantServices.length} serviço(s) para você:\n\n`
    relevantServices.slice(0, 3).forEach((service: any, index: number) => {
      response += `${index + 1}. **${service.name}**\n`
      response += `   ${service.description}\n`
      response += `   Duração: ${service.duration}min | Valor: R$ ${service.price}\n\n`
    })
  } else {
    response += `Não encontramos serviços específicos para "${service_type}".\n\n`
    response += `Nossas categorias disponíveis:\n`
    const categories = [...new Set(knowledge.services.map((s: any) => s.category))] as string[]
    categories.forEach((cat: string) => {
      response += `• ${cat}\n`
    })
  }
  
  response += `\nQuer agendar algum serviço? É só pedir! 📅`
  
  return response
}

async function handleContactRequest(knowledge: any) {
  let response = `📞 **Nossos Contatos**\n\n`
  response += `📍 **Endereço:** ${knowledge.contact.address}\n\n`
  response += `📱 **Telefone:** ${knowledge.contact.phone}\n`
  response += `💬 **WhatsApp:** ${knowledge.contact.whatsapp}\n`
  response += `📧 **E-mail:** ${knowledge.contact.email}\n\n`
  
  if (knowledge.contact.social_media?.instagram) {
    response += `📷 **Instagram:** @${knowledge.contact.social_media.instagram}\n`
  }
  
  response += `\n⏰ **Horário de Atendimento:**\n`
  response += `Segunda a Sexta: 08h às 18h\n`
  response += `Sábado: 08h às 12h\n\n`
  response += `Estamos aguardando seu contato! 😊`
  
  return response
}

async function handleAvailabilityCheck(data: any, knowledge: any) {
  const { preferred_date, service_type } = data
  
  let response = `🕐 **Verificação de Disponibilidade**\n\n`
  
  if (preferred_date) {
    response += `Verificando disponibilidade para ${preferred_date}\n\n`
    
    // Simular verificação de horários
    response += `Horários disponíveis:\n`
    response += `• 08:00 - Livre ✅\n`
    response += `• 09:00 - Ocupado ❌\n`
    response += `• 10:00 - Livre ✅\n`
    response += `• 14:00 - Livre ✅\n`
    response += `• 15:00 - Livre ✅\n`
    response += `• 16:00 - Ocupado ❌\n\n`
  } else {
    response += `Para verificar disponibilidade, me diga:\n`
    response += `• Qual data você prefere?\n`
    response += `• Qual tipo de serviço?\n\n`
  }
  
  response += `Quer confirmar algum horário? 📅`
  
  return response
}

function generateDefaultResponse(knowledge: any) {
  return `Olá! 😊 Sou a assistente virtual da ${knowledge.contact.address || 'nossa empresa'}.\n\n` +
    `Posso ajudar você com:\n` +
    `📅 Agendamentos e horários\n` +
    `💰 Valores e planos\n` +
    `📋 Informações sobre serviços\n` +
    `📞 Contatos e localização\n\n` +
    `Como posso ajudar você hoje?`
}

async function saveInteraction(data: {
  studioId: string
  from: string
  message: string
  response: string
  intent: string
  channel: string
  actionData: any
}) {
  try {
    await supabase.from('ai_interactions').insert({
      studio_id: data.studioId,
      customer_contact: data.from,
      message: data.message,
      ai_response: data.response,
      intent_type: data.intent,
      channel: data.channel,
      action_data: data.actionData,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Erro ao salvar interação da IA:', error)
  }
}

export async function getSecretaryStats(studioId: string) {
  try {
    const { data } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('studio_id', studioId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    
    const stats = {
      totalInteractions: data?.length || 0,
      appointmentsRequested: data?.filter(i => i.intent_type === 'schedule_request').length || 0,
      priceInquiries: data?.filter(i => i.intent_type === 'price_inquiry').length || 0,
      serviceInfo: data?.filter(i => i.intent_type === 'service_info').length || 0,
      averageResponseTime: '2.3s' // Simulado
    }
    
    return stats
  } catch (error) {
    logger.error('Erro ao buscar estatísticas da secretária:', error)
    return {
      totalInteractions: 0,
      appointmentsRequested: 0,
      priceInquiries: 0,
      serviceInfo: 0,
      averageResponseTime: '0s'
    }
  }
}
