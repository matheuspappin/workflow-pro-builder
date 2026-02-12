-- Tabela de Leads (CRM) Otimizada
DROP TABLE IF EXISTS leads CASCADE;

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  
  -- Dados do Lead
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  source VARCHAR(100), -- Instagram, Indicação, Google, etc.
  
  -- Controle do Funil
  stage VARCHAR(50) DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'trial_scheduled', 'trial_done', 'negotiating', 'won', 'lost')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  
  -- Detalhes
  interest_level INTEGER DEFAULT 1 CHECK (interest_level >= 1 AND interest_level <= 5), -- 1 (Frio) a 5 (Quente)
  notes TEXT,
  
  -- Datas Importantes
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política de Isolamento
CREATE POLICY "studio_isolation_policy_leads" ON leads FOR ALL USING (studio_id IS NOT NULL);

-- Índices
CREATE INDEX idx_leads_studio ON leads(studio_id);
CREATE INDEX idx_leads_stage ON leads(stage);

-- Trigger para updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
