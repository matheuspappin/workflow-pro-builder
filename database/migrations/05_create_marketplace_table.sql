
-- Tabela de Configurações do Marketplace (Loja Online do Estúdio)
CREATE TABLE IF NOT EXISTS marketplace_settings (
  studio_id UUID PRIMARY KEY, -- Vinculado ao usuário/estúdio
  store_name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL amigável (ex: danceflow.com/loja/studio-x)
  description TEXT,
  primary_color TEXT DEFAULT '#000000',
  banner_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_slug UNIQUE (slug)
);

-- Adicionar política RLS (Row Level Security)
ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;

-- Política: Dono vê e edita sua loja
CREATE POLICY "Users can manage their own marketplace" 
ON marketplace_settings 
FOR ALL 
USING (auth.uid() = studio_id);

-- Política: Público pode ver lojas ativas
CREATE POLICY "Public can view active marketplaces" 
ON marketplace_settings 
FOR SELECT 
USING (is_active = true);
