-- Migration 70: Atualiza DanceFlow para modelo Monetary e habilita módulo Scanner
-- O nicho 'dance' agora usa modelo de pagamento monetário (mensalidades) e portaria QR Code

UPDATE verticalizations
SET
  modules = '{
    "dashboard": true,
    "students": true,
    "classes": true,
    "financial": true,
    "service_orders": false,
    "scanner": true,
    "inventory": false,
    "whatsapp": true,
    "ai_chat": false,
    "pos": true,
    "leads": true,
    "gamification": true,
    "marketplace": false,
    "erp": false,
    "multi_unit": true
  }'::jsonb,
  updated_at = NOW()
WHERE slug = 'estudio-de-danca';

-- Atualizar organization_settings existentes do nicho dance para MONETARY
UPDATE organization_settings
SET
  business_type = 'MONETARY',
  updated_at = NOW()
WHERE niche = 'dance';

-- Atualizar studios existentes do nicho dance para MONETARY
UPDATE studios
SET
  business_model = 'MONETARY',
  updated_at = NOW()
WHERE id IN (
  SELECT studio_id FROM organization_settings WHERE niche = 'dance'
);
