-- 40. Tabela de Ativos/Equipamentos (Extintores, Veículos, etc)
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE, -- Dono do ativo (Cliente)
  name VARCHAR(255) NOT NULL, -- "Extintor PQS 4kg"
  type VARCHAR(50), -- "PQS", "CO2", "Agua"
  serial_number VARCHAR(100), -- Selo INMETRO
  manufacture_date DATE,
  expiration_date DATE, -- Vencimento da Carga
  last_inspection_date DATE, -- Última recarga/vistoria
  next_inspection_date DATE,
  status VARCHAR(50) DEFAULT 'ok', -- ok, warning, expired, maintenance
  location VARCHAR(255), -- "Hall de Entrada", "Garagem"
  qr_code TEXT UNIQUE, -- Hash para o QR Code
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "studio_isolation_policy_assets" ON assets;
CREATE POLICY "studio_isolation_policy_assets" ON assets FOR ALL USING (studio_id = (SELECT studio_id FROM users_internal WHERE id = auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_assets_studio ON assets(studio_id);
CREATE INDEX IF NOT EXISTS idx_assets_student ON assets(student_id);
CREATE INDEX IF NOT EXISTS idx_assets_qr_code ON assets(qr_code);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
