-- 49. Adicionar coluna professional_registration (CREA/CAU/CRM) na tabela professionals
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS professional_registration VARCHAR(50);
