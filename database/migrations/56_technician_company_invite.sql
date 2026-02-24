-- 56. Fire Protection: Código de convite para técnicos se vincularem a uma empresa (studio)

-- 56.1 Adicionar coluna invite_code na tabela studios (código único curto alfanumérico)
ALTER TABLE studios ADD COLUMN IF NOT EXISTS technician_invite_code VARCHAR(10) UNIQUE;

-- 56.2 Popular invite_code para studios existentes (6 chars uppercase do início do UUID)
UPDATE studios
SET technician_invite_code = UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))
WHERE technician_invite_code IS NULL;

-- 56.3 Index para busca rápida pelo código
CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_technician_invite_code ON studios(technician_invite_code);

-- 56.4 Adicionar campo company_name na tabela professionals para facilitar exibição
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- 56.5 Garantir índice user_id em professionals para busca rápida
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
