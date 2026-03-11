-- 110_crm_full_contact_model.sql
-- Modelo completo de contato CRM: Nome, Sobrenome, Emails, Telefones, Endereços, Empresa, Etiquetas, etc.

-- Identificação
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Contatos múltiplos
ALTER TABLE students ADD COLUMN IF NOT EXISTS email_2 VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone_1 VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone_2 VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone_3 VARCHAR(50);

-- Endereço 1 (principal)
ALTER TABLE students ADD COLUMN IF NOT EXISTS address1_type VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address1_street VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address1_city VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address1_state VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address1_zip VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address1_country VARCHAR(100);

-- Endereços 2 e 3 em JSONB (flexível)
ALTER TABLE students ADD COLUMN IF NOT EXISTS address2 JSONB DEFAULT '{}'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address3 JSONB DEFAULT '{}'::jsonb;

-- Empresa e organização
ALTER TABLE students ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Origem e marketing
ALTER TABLE students ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS language VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS email_subscriber_status VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sms_subscriber_status VARCHAR(50);

-- Atividade
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_activity_description TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_students_company ON students(studio_id, company);
CREATE INDEX IF NOT EXISTS idx_students_source ON students(studio_id, source);
