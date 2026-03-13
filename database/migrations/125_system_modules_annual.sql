-- Migration 125: Suporte a preço anual em system_modules
-- Permite definir price_annual e annual_discount_percent por módulo (admin/plans Módulos tab).

ALTER TABLE system_modules ADD COLUMN IF NOT EXISTS price_annual DECIMAL(10,2);
ALTER TABLE system_modules ADD COLUMN IF NOT EXISTS annual_discount_percent INTEGER DEFAULT 17
  CHECK (annual_discount_percent >= 0 AND annual_discount_percent <= 50);

COMMENT ON COLUMN system_modules.price_annual IS 'Preço anual em BRL. Se null, calcula price * 12 * (1 - annual_discount_percent/100)';
COMMENT ON COLUMN system_modules.annual_discount_percent IS 'Desconto % no plano anual (ex: 17 = ~2 meses grátis)';

-- Preencher valores iniciais para módulos pagos
UPDATE system_modules SET
  price_annual = ROUND(price * 12 * (1 - COALESCE(annual_discount_percent, 17) / 100.0), 2),
  annual_discount_percent = COALESCE(annual_discount_percent, 17)
WHERE price > 0 AND (price_annual IS NULL OR price_annual = 0);
