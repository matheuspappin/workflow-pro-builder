-- 54. Lembretes de Vendas (Fire Protection PDV)
-- Tabela para agendar e rastrear lembretes de pagamento e follow-up pós-venda

CREATE TABLE IF NOT EXISTS sale_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES students(id) ON DELETE SET NULL,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('payment_pending', 'follow_up', 'recarga_proxima')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  message_sent TEXT,
  channel VARCHAR(20) DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sale_reminders_studio ON sale_reminders(studio_id);
CREATE INDEX IF NOT EXISTS idx_sale_reminders_order ON sale_reminders(service_order_id);
CREATE INDEX IF NOT EXISTS idx_sale_reminders_scheduled ON sale_reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sale_reminders_sent ON sale_reminders(sent_at);

-- RLS
ALTER TABLE sale_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "studio_manage_sale_reminders" ON sale_reminders;
CREATE POLICY "studio_manage_sale_reminders" ON sale_reminders
FOR ALL USING (
  studio_id = (SELECT studio_id FROM users_internal WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM users_internal WHERE id = auth.uid() AND role = 'super_admin')
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_sale_reminders_updated_at ON sale_reminders;
CREATE TRIGGER update_sale_reminders_updated_at
BEFORE UPDATE ON sale_reminders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
