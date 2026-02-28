-- 84. Tabela ai_contact_rules - Regras de assunto por camada de contato
-- Define quais números/roles podem receber quais assuntos (financeiro, devedores, métricas, etc.)
-- Usado pelo Chat IA e WhatsApp para aplicar camadas de permissão por nicho

CREATE TABLE IF NOT EXISTS ai_contact_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE NOT NULL,
  niche TEXT NOT NULL DEFAULT 'dance' CHECK (niche IN ('dance', 'fire_protection', 'agroflowai')),
  contact_layer TEXT NOT NULL CHECK (contact_layer IN ('admin', 'student', 'lead', 'technician', 'engineer', 'client')),
  allowed_subjects JSONB DEFAULT '["turmas", "horarios", "contato", "agendamento"]'::jsonb,
  deny_subjects JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(studio_id, niche, contact_layer)
);

CREATE INDEX IF NOT EXISTS idx_ai_contact_rules_studio ON ai_contact_rules(studio_id);
CREATE INDEX IF NOT EXISTS idx_ai_contact_rules_niche ON ai_contact_rules(niche);

COMMENT ON TABLE ai_contact_rules IS 'Regras de permissão por camada - Chat IA e WhatsApp por nicho. Regras padrão estão em lib/ai-router.ts';
