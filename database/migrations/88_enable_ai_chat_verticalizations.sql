-- Migration 88: Ativar AI Chat nas verticalizações principais
-- Habilita o módulo ai_chat para verticalizações que se beneficiam do assistente virtual

-- Ativar para DanceFlow (perfeito para secretária virtual)
UPDATE verticalizations
SET modules = jsonb_set(
  modules,
  '{ai_chat}',
  'true'::jsonb
)
WHERE slug = 'estudio-de-danca';

-- Ativar para AgroFlowAI (assistente técnico ambiental)
UPDATE verticalizations
SET modules = jsonb_set(
  modules,
  '{ai_chat}',
  'true'::jsonb
)
WHERE slug = 'agroflowai';

-- Ativar para Fire Protection (chatbot técnico para manutenção e certificação)
UPDATE verticalizations
SET modules = jsonb_set(
  modules,
  '{ai_chat}',
  'true'::jsonb
)
WHERE slug = 'fire-protection';

-- Adicionar AI Chat aos planos que suportam
UPDATE system_plans
SET modules = jsonb_set(
  COALESCE(modules, '{}'::jsonb),
  '{ai_chat}',
  'true'::jsonb
)
WHERE name IN ('Professional', 'Enterprise', 'Custom');

-- Log da mudança
INSERT INTO admin_system_logs (type, source, message, studio, created_at)
VALUES (
  'info',
  'migration',
  'AI Chat habilitado para DanceFlow e AgroFlowAI verticalizations',
  'system',
  NOW()
);
