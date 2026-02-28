-- 64. Fire Protection: Código de convite para engenheiros se vincularem a uma empresa (studio)

-- 64.1 Adicionar coluna engineer_invite_code na tabela studios (formato E + 7 chars, único)
ALTER TABLE studios ADD COLUMN IF NOT EXISTS engineer_invite_code VARCHAR(10) UNIQUE;

-- 64.2 Index para busca rápida pelo código
CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_engineer_invite_code ON studios(engineer_invite_code);
