import { PaymentStrategy, PaymentModel } from './types';
import { CreditPaymentStrategy } from './credit-strategy';
import { MonetaryPaymentStrategy } from './monetary-strategy';
import { SupabaseClient } from '@supabase/supabase-js';

export function getPaymentStrategy(model: PaymentModel, supabase: SupabaseClient): PaymentStrategy {
  switch (model) {
    case 'CREDIT':
      return new CreditPaymentStrategy(supabase);
    case 'MONETARY':
      return new MonetaryPaymentStrategy(supabase);
    default:
      // Default fallback if unknown (e.g. during migration)
      return new CreditPaymentStrategy(supabase);
  }
}

export async function getPaymentRequirement(studioId: string, supabase: SupabaseClient): Promise<PaymentModel> {
  const { data, error } = await supabase
    .from('studios')
    .select('business_model')
    .eq('id', studioId)
    .single();

  if (error || !data) {
    console.warn(`Could not fetch business model for studio ${studioId}, defaulting to CREDIT`);
    return 'CREDIT';
  }

  return (data.business_model as PaymentModel) || 'CREDIT';
}
