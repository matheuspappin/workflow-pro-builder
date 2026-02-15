import { PaymentStrategy, PaymentContext, PaymentResult } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

export class MonetaryPaymentStrategy implements PaymentStrategy {
  constructor(private supabase: SupabaseClient) {}

  getCurrencySymbol(): string {
    return 'R$';
  }

  async validate(context: PaymentContext): Promise<boolean> {
    // For monetary, validation depends on the payment method.
    // If it's cash/POS, we assume the operator validated the cash/card.
    // If it's Stripe online, we create a session.
    // Here we focus on the "POS" validation (e.g., amount > 0).
    const totalAmount = context.items.reduce((acc, item) => acc + (item.priceInCurrency * item.quantity), 0);
    return totalAmount >= 0;
  }

  async process(context: PaymentContext): Promise<PaymentResult> {
    const totalAmount = context.items.reduce((acc, item) => acc + (item.priceInCurrency * item.quantity), 0);

    // Create a payment record in `payments` table
    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        studio_id: context.studioId,
        student_id: context.studentId,
        amount: totalAmount,
        payment_method: context.paymentMethod || 'cash',
        status: 'paid', // Assuming POS is immediate payment
        due_date: new Date().toISOString(), // Today
        payment_date: new Date().toISOString(),
        reference_month: new Date().toISOString().slice(0, 7), // YYYY-MM
        description: `POS Purchase: ${context.items.map(i => i.name).join(', ')}`
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, transactionId: data.id, message: 'Payment recorded successfully' };
  }
}
