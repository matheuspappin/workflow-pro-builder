'use server'

import { createClient } from '@/lib/supabase/server'

export interface StudioKnowledge {
  services: Array<{
    id: string
    name: string
    description: string
    price: number
    duration: number
    category: string
  }>
  schedules: Array<{
    professional_id: string
    professional_name: string
    day_of_week: string
    start_time: string
    end_time: string
  }>
  contact: {
    phone: string
    whatsapp: string
    email: string
    address: string
    social_media?: {
      instagram?: string
      facebook?: string
    }
  }
  policies: {
    cancellation_policy: string
    payment_methods: string[]
    requirements: string[]
  }
  pricing: {
    plans: Array<{
      name: string
      price: number
      duration: string
      features: string[]
    }>
    services: Array<{
      name: string
      price: number
      session_type: string
    }>
  }
}

export async function getStudioKnowledge(studioId: string): Promise<StudioKnowledge> {
  const supabase = await createClient()
  
  try {
    // 1. Buscar serviços
    const { data: services } = await supabase
      .from('services')
      .select('id, name, description, price, duration, category')
      .eq('studio_id', studioId)
      .eq('status', 'active')

    // 2. Buscar horários dos profissionais
    const { data: schedules } = await supabase
      .from('professional_schedules')
      .select(`
        professional_id,
        day_of_week,
        start_time,
        end_time,
        teachers!inner(name)
      `)
      .eq('studio_id', studioId)

    // 3. Buscar informações de contato
    const { data: studio } = await supabase
      .from('studios')
      .select('phone, email, address, social_media')
      .eq('id', studioId)
      .single()

    // 4. Buscar planos e preços
    const { data: plans } = await supabase
      .from('plans')
      .select('name, price, duration, features')
      .eq('studio_id', studioId)
      .eq('status', 'active')

    // 5. Buscar políticas (da tabela de configurações)
    const { data: settings } = await supabase
      .from('organization_settings')
      .select('cancellation_policy, payment_methods, requirements')
      .eq('studio_id', studioId)
      .single()

    return {
      services: services || [],
      schedules: (schedules || []).map((s: any) => ({
        professional_id: s.professional_id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        professional_name: s.teachers?.name || 'Profissional'
      })),
      contact: {
        phone: studio?.phone || '',
        whatsapp: studio?.phone || '', // WhatsApp usa o mesmo telefone por padrão
        email: studio?.email || '',
        address: studio?.address || '',
        social_media: studio?.social_media || {}
      },
      policies: {
        cancellation_policy: settings?.cancellation_policy || 'Cancelamento com 24h de antecedência',
        payment_methods: settings?.payment_methods || ['cash', 'card', 'pix'],
        requirements: settings?.requirements || []
      },
      pricing: {
        plans: plans || [],
        services: (services || []).map(s => ({
          name: s.name,
          price: s.price,
          session_type: s.category
        }))
      }
    }
  } catch (error) {
    console.error('Erro ao buscar conhecimento do estúdio:', error)
    return {
      services: [],
      schedules: [],
      contact: { phone: '', whatsapp: '', email: '', address: '' },
      policies: { cancellation_policy: '', payment_methods: [], requirements: [] },
      pricing: { plans: [], services: [] }
    }
  }
}

export async function searchStudioServices(studioId: string, query: string) {
  const knowledge = await getStudioKnowledge(studioId)
  
  const normalizedQuery = query.toLowerCase()
  
  return knowledge.services.filter(service => 
    service.name.toLowerCase().includes(normalizedQuery) ||
    service.description.toLowerCase().includes(normalizedQuery) ||
    service.category.toLowerCase().includes(normalizedQuery)
  )
}

export async function getAvailableProfessionals(studioId: string, serviceType?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('teachers')
    .select('id, name, specialties, status')
    .eq('studio_id', studioId)
    .eq('status', 'active')

  if (serviceType) {
    query = query.contains('specialties', [serviceType])
  }

  const { data } = await query
  return data || []
}

export async function getStudioPricing(studioId: string) {
  const knowledge = await getStudioKnowledge(studioId)
  return knowledge.pricing
}
