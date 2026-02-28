-- 62. Fire Protection: Código de convite para clientes se vincularem a uma empresa (studio)

-- 62.1 Adicionar coluna client_invite_code na tabela studios (código único curto alfanumérico)
ALTER TABLE studios ADD COLUMN IF NOT EXISTS client_invite_code VARCHAR(10) UNIQUE;

-- 62.2 Index para busca rápida pelo código (o código é gerado na API no primeiro GET)
CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_client_invite_code ON studios(client_invite_code);
