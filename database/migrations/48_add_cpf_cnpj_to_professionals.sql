-- 48. Adicionar coluna cpf_cnpj na tabela professionals
-- Corrige o erro "Could not find the 'cpf_cnpj' column of 'professionals' in the schema cache"

ALTER TABLE professionals ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(20);

-- Opcional: Adicionar índice para busca rápida por documento
CREATE INDEX IF NOT EXISTS idx_professionals_cpf_cnpj ON professionals(cpf_cnpj);
