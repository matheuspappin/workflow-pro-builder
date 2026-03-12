import { NextRequest, NextResponse } from 'next/server'
import { getStudioKnowledge, getAvailableProfessionals } from '@/lib/actions/knowledge-base'
import { getAvailableSlots, createAppointment } from '@/lib/actions/appointments'
import { detectIntent } from '@/lib/intent-detection'
import { supabase } from '@/lib/supabase'
import { aiMessageSchema, availabilityCheckSchema, aiAppointmentSchema } from '@/lib/validation/ai-chat-schema'
import { requireStudioAccess } from '@/lib/auth/require-studio-access'
import { checkAiRateLimit } from '@/lib/rate-limit'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // 1. Validar entrada
    const body = await request.json()
    const validated = aiMessageSchema.parse(body)
    const { message, context, channel } = validated
    
    // 2. Verificar acesso ao estúdio
    const studioId = context?.studio_id
    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID não fornecido' }, { status: 400 })
    }

    // 3. Verificar permissões (multi-tenancy)
    try {
      await requireStudioAccess(request, studioId)
    } catch (error) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })
    }

    // 4. Rate limiting por studio (Upstash Redis em produção)
    const rateLimit = await checkAiRateLimit(studioId)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Muitas solicitações. Tente novamente em alguns minutos.',
        retryAfter: rateLimit.retryAfter
      }, { status: 429 })
    }

    // 5. Detectar intenção
    const intent = await detectIntent(message, context)
    
    switch (intent.type) {
      case 'schedule_request':
        return await handleScheduleRequest(intent.data, studioId, context)
      
      case 'availability_check':
        return await handleAvailabilityCheck(intent.data, studioId)
      
      case 'booking_confirmation':
        return await handleBookingConfirmation(intent.data, studioId, context)
      
      default:
        return NextResponse.json({ 
          message: 'Não entendi sua solicitação de agendamento. Tente perguntar sobre horários disponíveis ou querer marcar uma consulta.',
          intent: intent.type,
          suggestions: [
            'Quais horários estão disponíveis hoje?',
            'Quero agendar uma aula',
            'Tem vaga para amanhã?'
          ]
        })
    }
  } catch (error) {
    logger.error('Erro no endpoint de agendamentos:', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: error.message 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor. Tente novamente em alguns minutos.' 
    }, { status: 500 })
  }
}

async function handleScheduleRequest(data: any, studioId: string, context: any) {
  const { preferred_date, service_type, preferred_time } = data
  
  // Buscar profissionais disponíveis
  const professionals = await getAvailableProfessionals(studioId, service_type)
  
  if (professionals.length === 0) {
    return NextResponse.json({
      message: 'Não encontramos profissionais disponíveis para este serviço no momento.',
      suggestions: ['Tente outro tipo de serviço', 'Verifique os profissionais disponíveis']
    })
  }

  // Buscar horários disponíveis para o primeiro profissional
  const availableSlots = await getAvailableSlots(studioId, professionals[0].id, preferred_date || new Date().toISOString().split('T')[0])
  
  return NextResponse.json({
    message: `Encontrei ${professionals.length} profissional(ais) disponíveis para ${service_type || 'consulta'}.`,
    professionals: professionals.map(p => ({
      id: p.id,
      name: p.name,
      specialties: p.specialties
    })),
    availableSlots: availableSlots.slice(0, 10), // Limitar a 10 horários
    nextAction: {
      type: 'booking_confirmation',
      data: {
        professional_id: professionals[0].id,
        preferred_date,
        service_type
      }
    }
  })
}

async function handleAvailabilityCheck(data: any, studioId: string) {
  const { preferred_date, service_type } = data
  
  // Buscar todos os profissionais para o serviço
  const professionals = await getAvailableProfessionals(studioId, service_type)
  
  const availability = []
  
  for (const professional of professionals.slice(0, 5)) { // Limitar a 5 profissionais
    const slots = await getAvailableSlots(studioId, professional.id, preferred_date || new Date().toISOString().split('T')[0])
    
    if (slots.length > 0) {
      availability.push({
        professional: professional.name,
        availableSlots: slots.slice(0, 5) // Limitar a 5 horários por profissional
      })
    }
  }
  
  if (availability.length === 0) {
    return NextResponse.json({
      message: 'Não há horários disponíveis para esta data. Que tal tentar outro dia?',
      suggestions: ['Tente amanhã', 'Verifique outros dias da semana']
    })
  }
  
  return NextResponse.json({
    message: `Encontrei horários disponíveis com ${availability.length} profissional(ais):`,
    availability,
    nextAction: {
      type: 'booking_confirmation',
      data: {
        preferred_date,
        service_type
      }
    }
  })
}

async function handleBookingConfirmation(data: any, studioId: string, context: any) {
  const { professional_id, preferred_date, preferred_time, service_type } = data
  
  // Se não tiver todas as informações necessárias, pedir mais detalhes
  if (!professional_id || !preferred_date || !preferred_time) {
    return NextResponse.json({
      message: 'Para confirmar o agendamento, preciso de algumas informações:',
      missingFields: [
        !professional_id && 'Profissional',
        !preferred_date && 'Data',
        !preferred_time && 'Horário'
      ].filter(Boolean),
      nextAction: {
        type: 'booking_confirmation',
        data
      }
    })
  }
  
  // Criar o agendamento
  try {
    // Buscar ID do cliente (contexto ou criar novo lead)
    let clientId = context?.client_id
    
    if (!clientId && context?.user_id) {
      // Buscar ou criar student
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', context.user_id)
        .eq('studio_id', studioId)
        .single()
      
      clientId = student?.id
    }
    
    if (!clientId) {
      return NextResponse.json({
        message: 'Preciso identificar você para fazer o agendamento. Por favor, forneça seu nome e contato.',
        nextAction: {
          type: 'booking_confirmation',
          data
        }
      })
    }
    
    // Buscar serviço
    const { data: service } = await supabase
      .from('services')
      .select('id, duration')
      .eq('studio_id', studioId)
      .eq('category', service_type || 'general')
      .single()
    
    if (!service) {
      return NextResponse.json({
        message: 'Serviço não encontrado. Por favor, verifique o tipo de serviço desejado.'
      })
    }
    
    // Criar agendamento
    const startTime = new Date(`${preferred_date}T${preferred_time}:00Z`).toISOString()
    const endTime = new Date(new Date(startTime).getTime() + (service.duration || 60) * 60000).toISOString()
    
    await createAppointment({
      studioId,
      clientId,
      professionalId: professional_id,
      serviceId: service.id,
      startTime,
      endTime,
      notes: 'Agendamento criado via assistente virtual'
    })
    
    return NextResponse.json({
      message: '✅ Agendamento confirmado com sucesso! Você receberá uma confirmação em breve.',
      appointment: {
        date: preferred_date,
        time: preferred_time,
        professional: professional_id,
        service: service_type
      },
      actionExecuted: true
    })
    
  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    return NextResponse.json({
      message: 'Ocorreu um erro ao confirmar seu agendamento. Por favor, tente novamente ou entre em contato diretamente.',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
