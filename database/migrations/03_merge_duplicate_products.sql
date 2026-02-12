-- Script to Merge Duplicate Products and Enforce Uniqueness
DO $$
DECLARE
    r RECORD;
    keep_id UUID;
    total_qty INTEGER;
    total_val DECIMAL(10,2);
    avg_cost DECIMAL(10,2);
BEGIN
    -- Loop through all duplicates (same studio_id and sku)
    FOR r IN
        SELECT studio_id, sku, array_agg(id ORDER BY created_at ASC) as ids
        FROM products
        WHERE sku IS NOT NULL AND sku != '' AND status != 'archived'
        GROUP BY studio_id, sku
        HAVING count(*) > 1
    LOOP
        -- We will keep the first product created (ids[1])
        keep_id := r.ids[1];

        RAISE NOTICE 'Merging duplicates for SKU % (Studio %)', r.sku, r.studio_id;

        -- Calculate total quantity and total value (for weighted average cost) from ALL duplicates
        SELECT 
            COALESCE(SUM(quantity), 0), 
            COALESCE(SUM(quantity * cost_price), 0)
        INTO total_qty, total_val
        FROM products 
        WHERE id = ANY(r.ids);

        -- Calculate new weighted average cost
        IF total_qty > 0 THEN
            avg_cost := total_val / total_qty;
        ELSE
            -- If total qty is 0, preserve the cost of the main product
            SELECT cost_price INTO avg_cost FROM products WHERE id = keep_id;
        END IF;

        -- Update the kept product with combined stats
        UPDATE products
        SET quantity = total_qty,
            cost_price = avg_cost
        WHERE id = keep_id;

        -- Move all transactions from duplicate products to the kept product
        UPDATE inventory_transactions
        SET product_id = keep_id
        WHERE product_id = ANY(r.ids[2:array_length(r.ids, 1)]);

        -- Delete the duplicate products
        DELETE FROM products
        WHERE id = ANY(r.ids[2:array_length(r.ids, 1)]);
        
    END LOOP;
END $$;

-- Add UNIQUE constraint to prevent future duplicates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_studio_id_sku_key'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_studio_id_sku_key UNIQUE (studio_id, sku);
    END IF;
END $$;
