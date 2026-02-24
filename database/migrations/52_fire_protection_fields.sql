-- 52. Fire Protection: Campos específicos para Vistorias e OS

-- 52.1 Adicionar status nao_conforme ao ENUM
ALTER TYPE service_order_status ADD VALUE IF NOT EXISTS 'nao_conforme';

-- 52.2 Campos específicos de Vistoria / OS
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS vistoria_type VARCHAR(100);
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS conformidade_score INTEGER CHECK (conformidade_score >= 0 AND conformidade_score <= 100);
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'alta', 'urgente'));
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS laudo_url TEXT;

-- 52.3 Índices para performance
CREATE INDEX IF NOT EXISTS idx_service_orders_project_type ON service_orders(project_type);
CREATE INDEX IF NOT EXISTS idx_service_orders_priority ON service_orders(priority);
CREATE INDEX IF NOT EXISTS idx_service_orders_scheduled ON service_orders(scheduled_at);

-- 52.4 RLS: Studio pode gerenciar suas próprias OS/Vistorias
DROP POLICY IF EXISTS "studio_manage_own_orders" ON service_orders;
CREATE POLICY "studio_manage_own_orders" ON service_orders
FOR ALL USING (
  studio_id = (SELECT studio_id FROM users_internal WHERE id = auth.uid())
);

-- 52.5 Tabela de itens de checklist de vistoria (baseada em milestones, mas com campo específico)
-- Usa service_order_milestones já existente, apenas garantindo o campo category
ALTER TABLE service_order_milestones ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'geral';
