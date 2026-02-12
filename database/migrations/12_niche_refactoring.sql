-- 12_niche_refactoring.sql
-- Refatoração para suportar múltiplos nichos e white-label real

-- 1. Generalização da tabela 'classes' (Aulas -> Serviços)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS category VARCHAR(100), -- Substitui dance_style para outros nichos
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb; -- Para guardar dados específicos (ex: equipamentos necessários)

-- 2. Metadados Flexíveis para Entidades Principais
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb; -- Ex: Histórico médico, preferências, nível técnico

ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb, -- Ex: Registro profissional (CRM, CREF, OAB)
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. Melhoria no White-Label (Domínios e Branding)
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE, -- Ex: app.minhaclinica.com.br
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{
  "logo_url": null,
  "favicon_url": null,
  "login_image_url": null,
  "pwa_name": null,
  "pwa_short_name": null,
  "seo_title": null,
  "seo_description": null
}'::jsonb;

-- 4. Tabela de Serviços Personalizados (Para Marketplace de Serviços)
CREATE TABLE IF NOT EXISTS service_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche VARCHAR(50) NOT NULL, -- dance, gym, dentist
  name VARCHAR(255) NOT NULL, -- "Limpeza de Pele", "Avaliação Física"
  default_price DECIMAL(10,2),
  default_duration_min INTEGER,
  metadata_schema JSONB DEFAULT '{}'::jsonb, -- Schema de validação para campos extras
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para busca rápida por domínio (White-label)
CREATE INDEX IF NOT EXISTS idx_org_domain ON organization_settings(custom_domain);
