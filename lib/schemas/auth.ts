import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'E-mail ou telefone é obrigatório').trim(),
  password: z.string().min(1, 'Senha é obrigatória'),
  portal: z.string().optional(),
  language: z.string().optional(),
  studioSlug: z.string().optional(),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').trim(),
  email: z.string().email('E-mail inválido').trim(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  studioName: z.string().optional(),
  role: z.string().optional().default('admin'),
  taxId: z.string().min(11, 'CPF/CNPJ é obrigatório'),
  taxIdType: z.enum(['cpf', 'cnpj']).optional().default('cpf'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  niche: z.string().optional(),
  businessModel: z.string().optional(),
  plan: z.string().optional(),
  studioId: z.string().optional(),
  modules: z.array(z.string()).optional(),
  multiUnitQuantity: z.number().optional().default(1),
  professionalsTier: z.string().optional(),
  language: z.string().optional(),
  professionalRegistration: z.string().optional(),
  verticalizationSlug: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
