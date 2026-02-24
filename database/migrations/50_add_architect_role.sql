-- Add 'architect' to professional_type check constraint
-- First, we need to drop the existing check constraint if it exists and recreate it.
-- Since we are using VARCHAR(20) with CHECK, we can't easily "add" a value without dropping/recreating.

DO $$ 
BEGIN
    -- Update the check constraint for professional_type in professionals table
    ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_professional_type_check;
    ALTER TABLE professionals ADD CONSTRAINT professionals_professional_type_check 
        CHECK (professional_type IN ('technician', 'engineer', 'architect', 'other'));

    -- Add CAU field for Architects (like CREA for Engineers)
    ALTER TABLE professionals ADD COLUMN IF NOT EXISTS cau_registration VARCHAR(50);
END $$;
