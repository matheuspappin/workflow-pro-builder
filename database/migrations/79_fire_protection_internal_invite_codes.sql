-- 79. Fire Protection: Códigos de convite para finance, recepção e vendedor (users_internal)

-- 79.1 Finance (F + 7 chars)
ALTER TABLE studios ADD COLUMN IF NOT EXISTS finance_invite_code VARCHAR(10) UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_finance_invite_code ON studios(finance_invite_code);

-- 79.2 Recepção (R + 7 chars)
ALTER TABLE studios ADD COLUMN IF NOT EXISTS reception_invite_code VARCHAR(10) UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_reception_invite_code ON studios(reception_invite_code);

-- 79.3 Vendedor (V + 7 chars)
ALTER TABLE studios ADD COLUMN IF NOT EXISTS seller_invite_code VARCHAR(10) UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_seller_invite_code ON studios(seller_invite_code);
