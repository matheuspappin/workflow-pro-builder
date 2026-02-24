-- Migration to fix products table schema and ensure compatibility between ERP and Inventory modules
-- This adds missing columns that were defined in later migrations but might not have been created 
-- if the table already existed (due to CREATE TABLE IF NOT EXISTS).

DO $$
BEGIN
    -- 1. Add 'price' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price') THEN
        ALTER TABLE products ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
        -- Sync from selling_price if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'selling_price') THEN
            UPDATE products SET price = selling_price;
        END IF;
    END IF;

    -- 2. Add 'current_stock' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'current_stock') THEN
        ALTER TABLE products ADD COLUMN current_stock INTEGER DEFAULT 0;
        -- Sync from quantity if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'quantity') THEN
            UPDATE products SET current_stock = quantity;
        END IF;
    END IF;

    -- 3. Add 'barcode' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'barcode') THEN
        ALTER TABLE products ADD COLUMN barcode VARCHAR(100);
    END IF;

    -- 4. Add 'unit' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'unit') THEN
        ALTER TABLE products ADD COLUMN unit VARCHAR(20) DEFAULT 'un';
    END IF;

    -- 5. Add 'min_stock' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'min_stock') THEN
        ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 0;
        -- Sync from min_quantity if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'min_quantity') THEN
            UPDATE products SET min_stock = min_quantity;
        END IF;
    END IF;

END $$;
