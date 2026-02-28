-- 66. Índice para OS pendentes de aprovação do cliente
-- (Executar APÓS 65_client_approval.sql, em transação separada)

CREATE INDEX IF NOT EXISTS idx_service_orders_pending_client ON service_orders(customer_id, status)
  WHERE status = 'pending_client_approval';
