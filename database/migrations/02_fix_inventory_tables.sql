-- Script de Correção e Configuração do Estoque (Idempotente)
-- Este script verifica se as tabelas existem e recria as políticas de segurança para evitar erros.

-- 1. Garantir que a tabela PRODUCTS existe
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  sku VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  cost_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Garantir que a tabela TRANSACTIONS existe
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'sale', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2), 
  total_value DECIMAL(10,2),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Segurança)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Limpar políticas antigas para evitar o erro "policy already exists"
DROP POLICY IF EXISTS "studio_isolation_products" ON products;
DROP POLICY IF EXISTS "studio_isolation_transactions" ON inventory_transactions;

-- 5. Criar as políticas novamente
CREATE POLICY "studio_isolation_products" ON products FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_transactions" ON inventory_transactions FOR ALL USING (studio_id IS NOT NULL);

-- 6. Criar índices para performance (IF NOT EXISTS não é padrão em todos postgres antigos para index, então usamos o DO block ou ignoramos erro)
CREATE INDEX IF NOT EXISTS idx_products_studio ON products(studio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON inventory_transactions(product_id);
