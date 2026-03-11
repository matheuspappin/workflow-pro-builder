-- 111_leads_full_crm_model.sql
-- Modelo CRM completo para leads (clientes): quem comprou/visitou/participou - distintos de alunos (recorrentes)

-- Identificação
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Contatos múltiplos
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_2 VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_1 VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_2 VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_3 VARCHAR(50);

-- Endereço
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address1_street VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address1_city VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address1_state VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address1_zip VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address1_country VARCHAR(100);

-- Empresa e organização
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS document VARCHAR(50);

-- Marketing e atividade
ALTER TABLE leads ADD COLUMN IF NOT EXISTS language VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_subscriber_status VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_subscriber_status VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_description TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- Metadata flexível (dados extras da importação)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Lead convertido em aluno (referência ao student criado)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_student_id UUID;

-- Categoria (marketplace, curso, aula_experimental, geral)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'geral';

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(studio_id, category);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(studio_id, source);
CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted_to_student_id) WHERE converted_to_student_id IS NOT NULL;
