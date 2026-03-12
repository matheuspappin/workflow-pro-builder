-- Tabela de Verticalizações (produtos white-label do akaaicore)
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
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: Fire Control (verticalização original)
INSERT INTO verticalizations (name, slug, description, niche, icon_name, icon_color, icon_bg, landing_url, admin_url, status, tags)
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
  '["Serviços","Técnicos","OS","Engenheiros","AVCB"]'
) ON CONFLICT (slug) DO NOTHING;

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
