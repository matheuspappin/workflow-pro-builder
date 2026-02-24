-- 54. Fire Protection: Campos de rastreamento de ativos e vistorias por técnico

-- 54.1 Campos adicionais para assets (extintores)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_inspection_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS next_inspection_due TIMESTAMP WITH TIME ZONE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS capacity VARCHAR(50);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS agent_type VARCHAR(50); -- PQS, CO2, Água, etc.
ALTER TABLE assets ADD COLUMN IF NOT EXISTS manufacture_date DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS pressure_status VARCHAR(20) DEFAULT 'ok' CHECK (pressure_status IN ('ok', 'low', 'empty'));

-- 54.2 Índice único para qr_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_qr_code ON assets(qr_code) WHERE qr_code IS NOT NULL;

-- 54.3 Índice para busca por studio + student (cliente)
CREATE INDEX IF NOT EXISTS idx_assets_studio_student ON assets(studio_id, student_id);
CREATE INDEX IF NOT EXISTS idx_assets_expiration ON assets(expiration_date) WHERE expiration_date IS NOT NULL;

-- 54.4 Campos de histórico para service_orders (retirada de equipamentos)
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS retirada_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS retirada_notes TEXT;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS entrega_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS asset_ids UUID[] DEFAULT '{}';

-- 54.5 RLS para o técnico poder ver os assets do seu studio
DROP POLICY IF EXISTS "technician_read_studio_assets" ON assets;
CREATE POLICY "technician_read_studio_assets" ON assets
FOR SELECT USING (
  studio_id IN (
    SELECT studio_id FROM professionals WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- 54.6 RLS para o técnico poder atualizar last_inspection_at dos assets
DROP POLICY IF EXISTS "technician_update_asset_inspection" ON assets;
CREATE POLICY "technician_update_asset_inspection" ON assets
FOR UPDATE USING (
  studio_id IN (
    SELECT studio_id FROM professionals WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- 54.7 RLS para o cliente ver seus próprios assets
DROP POLICY IF EXISTS "client_read_own_assets" ON assets;
CREATE POLICY "client_read_own_assets" ON assets
FOR SELECT USING (
  student_id = auth.uid()
);

-- 54.8 Tabela de histórico de inspeções de extintores
CREATE TABLE IF NOT EXISTS asset_inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  inspected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'ok' CHECK (status IN ('ok', 'needs_recharge', 'defective', 'replaced')),
  notes TEXT,
  conformidade_score INTEGER CHECK (conformidade_score >= 0 AND conformidade_score <= 100),
  service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE asset_inspections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_asset_inspections_asset ON asset_inspections(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_inspections_studio ON asset_inspections(studio_id);
CREATE INDEX IF NOT EXISTS idx_asset_inspections_date ON asset_inspections(inspected_at);

-- 54.9 RLS para inspeções
DROP POLICY IF EXISTS "studio_manage_asset_inspections" ON asset_inspections;
CREATE POLICY "studio_manage_asset_inspections" ON asset_inspections
FOR ALL USING (
  studio_id IN (
    SELECT studio_id FROM professionals WHERE user_id = auth.uid()
    UNION
    SELECT id FROM studios WHERE owner_id = auth.uid()
  )
);

-- 54.10 Campo finished_at para technician na OS se não existir
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE;
