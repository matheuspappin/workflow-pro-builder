import * as z from "zod"

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  // Outros campos de cliente que podem ser relevantes
})

export type ClientFormValues = z.infer<typeof clientSchema>
