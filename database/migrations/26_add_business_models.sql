/* Migration: Add Business Models and Dual Pricing */
/* Created at: 2026-02-13 */

-- 1. Add business_model to studios (tenants)
ALTER TABLE studios 
ADD COLUMN IF NOT EXISTS business_model VARCHAR(20) DEFAULT 'CREDIT' CHECK (business_model IN ('CREDIT', 'MONETARY'));

-- 2. Add dual pricing to products (ERP)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_in_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_in_currency DECIMAL(10,2) DEFAULT 0;

-- 3. Add dual pricing to classes (Services)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS price_in_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_in_currency DECIMAL(10,2) DEFAULT 0;

-- 4. Add dual pricing to lesson_packages
ALTER TABLE lesson_packages
ADD COLUMN IF NOT EXISTS price_in_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_in_currency DECIMAL(10,2) DEFAULT 0;

-- 5. Ensure existing data has defaults (optional, handled by DEFAULT above but good to be explicit for logic)
UPDATE studios SET business_model = 'CREDIT' WHERE business_model IS NULL;
