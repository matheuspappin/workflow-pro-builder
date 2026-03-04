import { z } from 'zod'

// Schema para validação de mensagens da IA
export const aiMessageSchema = z.object({
  message: z.string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(2000, 'Mensagem muito longa (máximo 2000 caracteres)')
    .transform(str => str.trim()),
  
  context: z.object({
    studio_id: z.string().uuid('Studio ID inválido'),
    is_admin: z.boolean().default(false),
    user_id: z.string().uuid().optional(),
    client_id: z.string().uuid().optional(),
    pendingAction: z.any().optional()
  }).optional(),
  
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  
  channel: z.enum(['whatsapp', 'chat', 'sms']).default('chat')
})

// Schema para agendamento via IA
export const aiAppointmentSchema = z.object({
  professional_id: z.string().uuid('ID do profissional inválido'),
  service_id: z.string().uuid('ID do serviço inválido'),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  preferred_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
  client_name: z.string().min(2, 'Nome do cliente é obrigatório').max(100),
  client_phone: z.string().regex(/^\d{10,15}$/, 'Telefone inválido'),
  notes: z.string().max(500).optional()
})

// Schema para verificação de disponibilidade
export const availabilityCheckSchema = z.object({
  professional_id: z.string().uuid().optional(),
  service_type: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  studio_id: z.string().uuid('Studio ID é obrigatório')
})

// Schema para conhecimento do estúdio
export const studioKnowledgeSchema = z.object({
  services: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string(),
    price: z.number().min(0),
    duration: z.number().min(15),
    category: z.string().min(1)
  })),
  
  schedules: z.array(z.object({
    professional_id: z.string().uuid(),
    professional_name: z.string().min(1),
    day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    start_time: z.string(),
    end_time: z.string()
  })),
  
  contact: z.object({
    phone: z.string().min(10),
    whatsapp: z.string().min(10),
    email: z.string().email(),
    address: z.string().min(5),
    social_media: z.object({
      instagram: z.string().optional(),
      facebook: z.string().optional()
    }).optional()
  }),
  
  policies: z.object({
    cancellation_policy: z.string(),
    payment_methods: z.array(z.string()),
    requirements: z.array(z.string())
  }),
  
  pricing: z.object({
    plans: z.array(z.object({
      name: z.string().min(1),
      price: z.number().min(0),
      duration: z.string(),
      features: z.array(z.string())
    })),
    services: z.array(z.object({
      name: z.string().min(1),
      price: z.number().min(0),
      session_type: z.string()
    }))
  })
})

// Types inferidos
export type AIMessageInput = z.infer<typeof aiMessageSchema>
export type AIAppointmentInput = z.infer<typeof aiAppointmentSchema>
export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>
export type StudioKnowledge = z.infer<typeof studioKnowledgeSchema>
