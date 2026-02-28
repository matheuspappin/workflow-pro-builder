-- Migration 74: AgroFlowAI - Verticalização de Compliance Ambiental e Engenharia
-- Gestão para consultorias ambientais no agronegócio com monitoramento satelital

INSERT INTO verticalizations (
  name, slug, description, niche, icon_name, icon_color, icon_bg,
  landing_url, admin_url, status, tags, modules
)
VALUES (
  'AgroFlowAI',
  'agroflowai',
  'Gestão completa para consultorias de Compliance Ambiental e Engenharia no agronegócio. Laudos, regularizações CAR, licenciamentos, vistorias técnicas e monitoramento satelital de desmatamento e vegetação.',
  'environmental_compliance',
  'Leaf',
  'text-emerald-400',
  'bg-emerald-500/10 border-emerald-500/20',
  '/solutions/agroflowai',
  '/admin/verticalizations/agroflowai',
  'coming_soon',
  '["Laudos","CAR","Licenciamento","Vistorias","Engenheiros","Satélite","Regularização"]',
  '{
    "dashboard": true,
    "students": true,
    "classes": true,
    "financial": true,
    "service_orders": true,
    "scanner": true,
    "inventory": false,
    "whatsapp": true,
    "ai_chat": false,
    "pos": false,
    "leads": true,
    "gamification": false,
    "marketplace": false,
    "erp": false,
    "multi_unit": true,
    "satellite_monitor": true
  }'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  niche = EXCLUDED.niche,
  icon_name = EXCLUDED.icon_name,
  icon_color = EXCLUDED.icon_color,
  icon_bg = EXCLUDED.icon_bg,
  landing_url = EXCLUDED.landing_url,
  admin_url = EXCLUDED.admin_url,
  status = EXCLUDED.status,
  tags = EXCLUDED.tags,
  modules = EXCLUDED.modules,
  updated_at = NOW();
