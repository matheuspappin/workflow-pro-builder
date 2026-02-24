-- Migração para vincular Pagamentos a Ordens de Serviço e rastrear status de pagamento na OS
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded'));
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS service_order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL;

-- Criar índice para performance nas buscas de pagamentos por OS
CREATE INDEX IF NOT EXISTS idx_payments_service_order ON public.payments(service_order_id);

-- Comentários para documentação
COMMENT ON COLUMN public.service_orders.payment_status IS 'Status do pagamento da Ordem de Serviço.';
COMMENT ON COLUMN public.payments.service_order_id IS 'ID da Ordem de Serviço vinculada a este pagamento.';
