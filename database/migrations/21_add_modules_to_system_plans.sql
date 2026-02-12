
-- Adiciona coluna de módulos na tabela de planos
ALTER TABLE system_plans ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{}'::jsonb;

-- Atualizar planos existentes com os módulos baseados nos booleans atuais
UPDATE system_plans SET modules = jsonb_build_object(
  'financial', has_finance,
  'whatsapp', has_whatsapp,
  'ai_chat', has_ai,
  'multi_unit', has_multi_unit
) WHERE modules = '{}'::jsonb;
