-- Migration 68: Adiciona coluna modules na tabela verticalizations
-- Permite configurar quais módulos estão disponíveis em cada verticalização

ALTER TABLE verticalizations ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{}';

-- Define módulos padrão para Fire Control
UPDATE verticalizations
SET modules = '{
  "dashboard": true,
  "students": true,
  "classes": true,
  "financial": true,
  "service_orders": true,
  "scanner": true,
  "inventory": true,
  "whatsapp": false,
  "ai_chat": false,
  "pos": false,
  "leads": false,
  "gamification": false,
  "marketplace": false,
  "erp": false,
  "multi_unit": false
}'::jsonb
WHERE slug = 'fire-protection';
