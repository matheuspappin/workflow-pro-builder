-- 42. Suporte a Projetos PPCI e Marcos (Milestones) em Ordens de Serviço

-- Adicionar tipo de projeto à OS
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'common';

-- Tabela de Marcos/Etapas da OS
CREATE TABLE IF NOT EXISTS service_order_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    completed_at TIMESTAMP WITH TIME ZONE,
    order_index INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE service_order_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio_isolation_milestones" ON service_order_milestones 
FOR ALL USING (studio_id = (SELECT studio_id FROM users_internal WHERE id = auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_milestones_order ON service_order_milestones(service_order_id);
CREATE INDEX IF NOT EXISTS idx_milestones_studio ON service_order_milestones(studio_id);

-- Trigger updated_at
CREATE TRIGGER update_service_order_milestones_updated_at 
BEFORE UPDATE ON service_order_milestones 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar campo de comissão/repasse à OS para o Engenheiro
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS professional_commission_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS professional_commission_status VARCHAR(20) DEFAULT 'pending' CHECK (professional_commission_status IN ('pending', 'approved', 'paid', 'cancelled'));
