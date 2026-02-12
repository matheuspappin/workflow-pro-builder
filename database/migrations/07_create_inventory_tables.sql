-- Script de Criação/Atualização da Tabela de Transações de Estoque (Idempotente)

-- 1. Garantir que a tabela existe com a estrutura básica
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('in', 'out', 'sale', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_value DECIMAL(10,2),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Adicionar colunas extras se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_transactions' AND column_name = 'payment_method') THEN
        ALTER TABLE inventory_transactions ADD COLUMN payment_method VARCHAR(50);
    END IF;
END $$;

-- 3. Índices para performance (idempotente)
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_studio ON inventory_transactions(studio_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);

-- 4. RLS (idempotente)
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "studio_isolation_policy_inventory_transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "studio_isolation_transactions" ON inventory_transactions;
CREATE POLICY "studio_isolation_policy_inventory_transactions" ON inventory_transactions FOR ALL USING (studio_id IS NOT NULL);
