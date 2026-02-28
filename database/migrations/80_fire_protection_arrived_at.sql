-- 80. Check-in de visita: registrar chegada do cliente/técnico
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN service_orders.arrived_at IS 'Horário de check-in/chegada do cliente ou técnico na vistoria';
