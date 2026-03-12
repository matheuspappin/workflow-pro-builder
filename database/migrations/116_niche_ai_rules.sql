-- 116. Tabela niche_ai_rules - Valores e Regras Específicas por vertical
-- Regras globais definidas no Controlador (admin/testes) e injetadas no contexto da Catarina

CREATE TABLE IF NOT EXISTS public.niche_ai_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche TEXT NOT NULL UNIQUE,
  rules_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valores padrão para cada niche (retrocompatibilidade)
INSERT INTO public.niche_ai_rules (niche, rules_text)
VALUES 
  ('dance', ''),
  ('fire_protection', ''),
  ('agroflowai', '')
ON CONFLICT (niche) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_niche_ai_rules_niche ON public.niche_ai_rules(niche);

COMMENT ON TABLE public.niche_ai_rules IS 'Regras e valores específicos por vertical (dance, fire_protection, agroflowai). Definidas no Controlador e injetadas no contexto da Catarina.';
