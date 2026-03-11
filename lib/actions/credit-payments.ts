'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Cria cobrança de uso de crédito para exibição no financeiro.
 * Chamado quando aluno gasta crédito em aula, produto ou marketplace.
 */
export async function createCreditUsagePayment(params: {
  studioId: string
  studentId: string
  description: string
  creditsUsed: number
  paymentSource: 'class' | 'product' | 'marketplace'
  referenceId?: string
}) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const refMonth = new Date().toISOString().slice(0, 7)

  const { error } = await supabase.from('payments').insert({
    studio_id: params.studioId,
    student_id: params.studentId,
    amount: 0,
    due_date: today,
    payment_date: today,
    status: 'paid',
    payment_method: 'credit',
    reference_month: refMonth,
    description: params.description,
    payment_source: 'credit_usage',
    reference_id: params.referenceId || null,
    credits_used: params.creditsUsed,
  })

  if (error) {
    console.error('[createCreditUsagePayment] Erro:', error)
  }
}
