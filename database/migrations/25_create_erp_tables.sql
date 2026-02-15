/* 20. ERP System (Fornecedores, Produtos, Estoque, Contas a Pagar) */

-- 20.1 Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    address TEXT,
    contact_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(studio_id, cnpj)
);

-- 20.2 Produtos
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100), -- EAN
    sku VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0, -- Preço de venda
    cost_price DECIMAL(10,2) DEFAULT 0, -- Custo médio
    current_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'un',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(studio_id, barcode),
    UNIQUE(studio_id, sku)
);

-- 20.3 Movimentação de Estoque
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entry', 'exit', 'adjustment')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference_id UUID, -- Pode ser ID da nota ou venda
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20.4 Contas a Pagar
CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    invoice_number VARCHAR(100),
    barcode VARCHAR(255), -- Código de barras do boleto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "studio_isolation_policy_suppliers" ON suppliers FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_products" ON products FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_stock_movements" ON stock_movements FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_accounts_payable" ON accounts_payable FOR ALL USING (studio_id IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_studio ON suppliers(studio_id);
CREATE INDEX IF NOT EXISTS idx_products_studio ON products(studio_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_studio ON stock_movements(studio_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_studio ON accounts_payable(studio_id);

-- Triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_payable_updated_at BEFORE UPDATE ON accounts_payable FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
