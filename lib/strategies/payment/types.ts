import { SupabaseClient } from '@supabase/supabase-js';

export type PaymentModel = 'CREDIT' | 'MONETARY';

export interface PaymentItem {
  id: string;
  name: string;
  priceInCredits: number;
  priceInCurrency: number;
  quantity: number;
  type: 'product' | 'service' | 'package' | 'service_order';
}

export interface PaymentContext {
  studentId: string | null;
  studioId: string;
  items: PaymentItem[];
  paymentMethod?: string; // card, cash, pix (for monetary)
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

export interface PaymentStrategy {
  validate(context: PaymentContext): Promise<boolean>;
  process(context: PaymentContext): Promise<PaymentResult>;
  getCurrencySymbol(): string;
}
