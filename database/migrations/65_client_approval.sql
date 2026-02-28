-- 65. Aprovação do Cliente: Orçamentos/Propostas antes de iniciar serviço
--
-- NOTA: O índice parcial foi movido para 66_client_approval_index.sql
-- porque PostgreSQL exige que novos valores de ENUM sejam commitados
-- antes de serem usados (ex: em WHERE de índices).

-- 65.1 Adicionar status pending_client_approval ao ENUM
ALTER TYPE service_order_status ADD VALUE IF NOT EXISTS 'pending_client_approval';

-- 65.2 Campos de aprovação/rejeição do cliente
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS client_approval_required BOOLEAN DEFAULT false;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS client_rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS client_rejection_reason TEXT;
