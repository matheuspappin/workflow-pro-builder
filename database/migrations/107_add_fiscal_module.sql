-- Migration 107: Adiciona módulo Emissor Fiscal (NF-e) ao sistema
-- Disponível em todas as verticalizações (fire-protection, estudio-de-danca, agroflowai)

-- 0. Tabela para armazenar certificados A1 dos tenants (criptografados)
CREATE TABLE IF NOT EXISTS tenant_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE UNIQUE,
  pfx_encrypted BYTEA NOT NULL,
  pfx_iv VARCHAR(32) NOT NULL,
  pfx_auth_tag VARCHAR(32) NOT NULL,
  pfx_password_encrypted BYTEA NOT NULL,
  pfx_password_iv VARCHAR(32) NOT NULL,
  pfx_password_auth_tag VARCHAR(32) NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  cnpj_owner VARCHAR(14),
  environment VARCHAR(10) DEFAULT 'homologation' CHECK (environment IN ('homologation', 'production')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_certificates_studio ON tenant_certificates(studio_id);
ALTER TABLE tenant_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_certificates" ON tenant_certificates FOR ALL
  USING (studio_id = get_auth_studio_id() OR is_super_admin());

-- 1. Adicionar colunas provider, provider_ref, simulated em invoices (se não existirem)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS provider_ref TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS simulated BOOLEAN DEFAULT FALSE;

-- 2. Inserir módulo fiscal em system_modules
INSERT INTO system_modules (id, label, price, description, features) VALUES
('fiscal', 'Emissor Fiscal (NF-e)', 49.90, 'Emissão de Notas Fiscais Eletrônicas via SEFAZ', 
 '["Emissão de Notas Fiscais Eletrônicas", "Integração direta com SEFAZ", "Certificado digital A1 por tenant"]')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  price = EXCLUDED.price;

-- 3. Adicionar fiscal aos módulos de todas as verticalizações existentes
UPDATE verticalizations
SET modules = COALESCE(modules, '{}'::jsonb) || '{"fiscal": true}'::jsonb
WHERE slug IN ('fire-protection', 'estudio-de-danca', 'agroflowai');
