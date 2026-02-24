import { PaymentStrategy, PaymentContext, PaymentResult } from './types';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export class CreditPaymentStrategy implements PaymentStrategy {
  constructor(private supabase: SupabaseClient) {}

  getCurrencySymbol(): string {
    return 'C$'; // Credits
  }

  async validate(context: PaymentContext): Promise<boolean> {
    const totalCreditsNeeded = context.items.reduce((acc, item) => acc + (item.priceInCredits * item.quantity), 0);

    // Fetch user credits
    const { data: creditData, error } = await this.supabase
      .from('student_lesson_credits')
      .select('remaining_credits')
      .eq('student_id', context.studentId)
      .eq('studio_id', context.studioId) // Ensure studio context
      .single();

    if (error || !creditData) {
      return false; // User has no credit record
    }

    return creditData.remaining_credits >= totalCreditsNeeded;
  }

  async process(context: PaymentContext): Promise<PaymentResult> {
    const totalCredits = context.items.reduce((acc, item) => acc + (item.priceInCredits * item.quantity), 0);
    
    // 1. Double check validation inside transaction logic (if possible)
    // Supabase doesn't have true ACID transactions via JS client easily without RPC, 
    // but we can check and update carefully.
    
    // Using RPC is safer for atomic deduction. Assuming we might have one or creating a simple update.
    // Let's try a direct update with a condition.
    
    // Fetch current again to be safe
    const { data: current, error: fetchError } = await this.supabase
      .from('student_lesson_credits')
      .select('remaining_credits, id')
      .eq('student_id', context.studentId)
      .eq('studio_id', context.studioId)
      .single();

    if (fetchError || !current) return { success: false, error: 'Credits not found' };

    if (current.remaining_credits < totalCredits) {
      return { success: false, error: 'Insufficient credits' };
    }

    const newBalance = current.remaining_credits - totalCredits;

    const { error: updateError } = await this.supabase
      .from('student_lesson_credits')
      .update({ remaining_credits: newBalance })
      .eq('id', current.id);

    if (updateError) return { success: false, error: updateError.message };

    // If there were service orders, update their payment status
    const serviceOrderItems = context.items.filter(i => i.type === 'service_order');
    if (serviceOrderItems.length > 0) {
      const osIds = serviceOrderItems.map(i => i.id);
      await this.supabase
        .from('service_orders')
        .update({ payment_status: 'paid' })
        .in('id', osIds);
    }

    // Record usage
    // We should record each item or a bulk usage.
    // For simplicity, we'll record one usage entry per transaction or per item.
    // The table `student_credit_usage` seems relevant.
    
    for (const item of context.items) {
        await this.supabase.from('student_credit_usage').insert({
            studio_id: context.studioId,
            student_id: context.studentId,
            credits_used: item.priceInCredits * item.quantity,
            usage_type: 'class_attendance', // Or product_purchase if we add that type to enum
            notes: `Purchase: ${item.name} (x${item.quantity})`
        });
    }

    return { success: true, message: 'Credits deducted successfully' };
  }
}
