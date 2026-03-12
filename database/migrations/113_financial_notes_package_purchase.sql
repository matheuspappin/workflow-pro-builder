-- 113. Suporte a NF-e para compra de pacotes de créditos (DanceFlow)
-- Permite source_type 'package_purchase' em financial_notes para vincular notas a pagamentos de pacotes.

ALTER TABLE financial_notes DROP CONSTRAINT IF EXISTS financial_notes_source_type_check;
ALTER TABLE financial_notes ADD CONSTRAINT financial_notes_source_type_check
  CHECK (source_type IN ('service_order', 'erp_order', 'manual', 'package_purchase'));

COMMENT ON COLUMN financial_notes.source_type IS 'Origem: service_order, erp_order, manual, package_purchase (compra de créditos DanceFlow)';
