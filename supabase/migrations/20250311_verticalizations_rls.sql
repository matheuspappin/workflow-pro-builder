-- RLS para verticalizations: leitura pública (dados de catálogo)
-- Permite que o frontend busque verticalizações por slug para exibir Planos e Preços

-- Garantir que agroflowai exista (fallback se 20250225 não inseriu)
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
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"scanner":true,"inventory":false,"whatsapp":true,"ai_chat":false,"pos":false,"leads":true,"gamification":false,"marketplace":false,"erp":false,"multi_unit":true,"satellite_monitor":true}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  modules = EXCLUDED.modules,
  updated_at = NOW();

ALTER TABLE verticalizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verticalizations_select_all" ON verticalizations;
CREATE POLICY "verticalizations_select_all" ON verticalizations
  FOR SELECT USING (true);

-- Super admin pode gerenciar (para painel admin)
DROP POLICY IF EXISTS "verticalizations_super_admin" ON verticalizations;
CREATE POLICY "verticalizations_super_admin" ON verticalizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_internal
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
