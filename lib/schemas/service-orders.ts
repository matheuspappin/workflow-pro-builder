import { z } from 'zod'

export const ServiceOrderItemSchema = z.object({
  id: z.string().optional(),
  item_type: z.enum(['product', 'service']),
  product_id: z.string().nullable().optional(),
  service_id: z.string().nullable().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  quantity: z.number().min(0.01, "Quantidade mínima é 0.01"),
  unit_price: z.number().min(0, "Preço unitário não pode ser negativo"),
})

export const ServiceOrderSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string().min(1, "Cliente é obrigatório"),
  professional_id: z.string().optional().nullable(),
  status: z.enum(['draft', 'open', 'in_progress', 'waiting_parts', 'finished', 'cancelled']).default('draft'),
  project_type: z.enum(['common', 'ppci', 'maintenance']).default('common'),
  description: z.string().min(1, "Descrição do problema é obrigatória"),
  observations: z.string().optional(),
  private_notes: z.string().optional(),
  items: z.array(ServiceOrderItemSchema).default([]),
  discount: z.number().default(0),
  scheduled_at: z.string().optional().nullable(),
  customer_signature_url: z.string().optional().nullable(),
  professional_commission_value: z.union([z.number(), z.string()])
    .transform((val) => {
      if (val === '' || val === undefined || val === null) return 0
      const n = Number(val)
      return isNaN(n) ? 0 : n
    })
    .optional()
    .default(0),
  professional_commission_status: z.enum(['pending', 'approved', 'paid', 'cancelled']).default('pending'),
})

export const ServiceOrderMilestoneSchema = z.object({
  id: z.string().optional(),
  service_order_id: z.string(),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  order_index: z.number().default(0),
})

export type ServiceOrderFormValues = z.infer<typeof ServiceOrderSchema>
export type ServiceOrderMilestoneValues = z.infer<typeof ServiceOrderMilestoneSchema>
