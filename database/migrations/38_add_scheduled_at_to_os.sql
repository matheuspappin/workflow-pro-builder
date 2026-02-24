-- Migração para adicionar agendamento às Ordens de Serviço
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Comentário para documentação
COMMENT ON COLUMN public.service_orders.scheduled_at IS 'Data e hora agendada para o início do serviço.';
