-- Migration 69: Adiciona verticalização de Estúdio de Dança
-- DanceFlow — gestão completa para escolas e estúdios de dança

INSERT INTO verticalizations (name, slug, description, niche, icon_name, icon_color, icon_bg, landing_url, admin_url, status, tags, modules)
VALUES (
  'DanceFlow',
  'estudio-de-danca',
  'Gestão completa para estúdios e escolas de dança. Matrículas, turmas, frequência de alunos, financeiro e relacionamento com responsáveis em uma única plataforma.',
  'dance',
  'Music',
  'text-violet-400',
  'bg-violet-500/10 border-violet-500/20',
  '/solutions/estudio-de-danca',
  '/admin/verticalizations/estudio-de-danca',
  'active',
  '["Alunos","Turmas","Matrículas","Financeiro","Responsáveis"]',
  '{
    "dashboard": true,
    "students": true,
    "classes": true,
    "financial": true,
    "service_orders": false,
    "scanner": false,
    "inventory": false,
    "whatsapp": true,
    "ai_chat": false,
    "pos": true,
    "leads": true,
    "gamification": true,
    "marketplace": false,
    "erp": false,
    "multi_unit": true
  }'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  landing_url = EXCLUDED.landing_url,
  admin_url = EXCLUDED.admin_url,
  modules = EXCLUDED.modules,
  updated_at = NOW();
