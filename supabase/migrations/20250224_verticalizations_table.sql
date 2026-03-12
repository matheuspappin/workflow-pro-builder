-- Tabela de Verticalizações (produtos white-label do akaaicore)
-- Migration 67 + 68: tabela base + coluna modules

CREATE TABLE IF NOT EXISTS verticalizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  niche TEXT NOT NULL DEFAULT 'fire_protection',
  icon_name TEXT DEFAULT 'Layers',
  icon_color TEXT DEFAULT 'text-indigo-400',
  icon_bg TEXT DEFAULT 'bg-indigo-500/10 border-indigo-500/20',
  landing_url TEXT DEFAULT '',
  admin_url TEXT DEFAULT '',
  status TEXT DEFAULT 'coming_soon' CHECK (status IN ('active', 'beta', 'coming_soon')),
  tags JSONB DEFAULT '[]',
  modules JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir coluna modules existe (para tabelas criadas por migrações antigas sem ela)
ALTER TABLE verticalizations ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{}';

-- Seed: Fire Protection (verticalização original)
INSERT INTO verticalizations (name, slug, description, niche, icon_name, icon_color, icon_bg, landing_url, admin_url, status, tags, modules)
VALUES (
  'Fire Control',
  'fire-protection',
  'Gestão completa de empresas de segurança contra incêndio. Vistorias, rotas de técnicos, validades de extintores, OS e faturamento.',
  'fire_protection',
  'FireExtinguisher',
  'text-red-400',
  'bg-red-500/10 border-red-500/20',
  '/solutions/fire-protection',
  '/admin/verticalizations/fire-protection',
  'active',
  '["Serviços","Técnicos","OS","Engenheiros","AVCB"]',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"scanner":true,"inventory":true,"whatsapp":false,"ai_chat":false,"pos":false,"leads":false,"gamification":false,"marketplace":false,"erp":false,"multi_unit":false}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  modules = COALESCE(EXCLUDED.modules, verticalizations.modules);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_verticalizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS verticalizations_updated_at ON verticalizations;
CREATE TRIGGER verticalizations_updated_at
  BEFORE UPDATE ON verticalizations
  FOR EACH ROW EXECUTE FUNCTION update_verticalizations_updated_at();
