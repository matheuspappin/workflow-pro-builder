-- 97. Cobranças por uso de crédito e compra de pacote
-- Adiciona colunas para rastrear origem da cobrança (aula, produto, marketplace, pacote)

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reference_id UUID; -- class_id, product_id, package_id, etc.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS credits_used INTEGER; -- créditos consumidos (quando payment_source = credit_usage)

COMMENT ON COLUMN public.payments.payment_source IS 'Origem: manual, monthly, pos, credit_usage, package_purchase, service_order';
COMMENT ON COLUMN public.payments.reference_id IS 'ID da aula, produto, pacote ou outro recurso vinculado';
COMMENT ON COLUMN public.payments.credits_used IS 'Créditos consumidos (quando pago com crédito)';
