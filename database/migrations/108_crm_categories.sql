-- 108_crm_categories.sql
-- Adiciona suporte a categorias no CRM (students e leads) para importação e organização

-- Categorias em students (clientes/alunos)
ALTER TABLE students ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'geral';

-- Categorias em leads (funil de vendas)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'geral';

-- Índices para filtragem por categoria
CREATE INDEX IF NOT EXISTS idx_students_category ON students(studio_id, category);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(studio_id, category);
