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

    // Identify if there are any service orders in the cart
    const serviceOrderItems = context.items.filter(i => i.type === 'service_order');
    const serviceOrderId = serviceOrderItems.length > 0 ? serviceOrderItems[0].id : null;

    // Create a payment record in `payments` table
    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        studio_id: context.studioId,
        student_id: context.studentId,
        service_order_id: serviceOrderId,
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

    // If there were service orders, update their payment status
    if (serviceOrderItems.length > 0) {
      const osIds = serviceOrderItems.map(i => i.id);
      await this.supabase
        .from('service_orders')
        .update({ payment_status: 'paid' })
        .in('id', osIds);
    }

    // Update inventory for products
    const productItems = context.items.filter(i => i.type === 'product');
    for (const item of productItems) {
      const { data: prod } = await this.supabase
        .from('products')
        .select('quantity')
        .eq('id', item.id)
        .single();
      
      if (prod) {
        await this.supabase
          .from('products')
          .update({ quantity: Math.max(0, prod.quantity - item.quantity) })
          .eq('id', item.id);
        
        await this.supabase.from('inventory_transactions').insert({
          studio_id: context.studioId,
          product_id: item.id,
          type: 'sale',
          quantity: item.quantity,
          reason: 'Venda PDV',
          unit_price: item.priceInCurrency
        });
      }
    }

    return { success: true, transactionId: data.id, message: 'Payment recorded successfully' };
  }
}
