-- Fix students table: add default for id and missing columns
DO $$
BEGIN
    -- 1. Add default for id if it doesn't have one
    -- Note: We don't drop the constraint because we might still want to link to auth.users, 
    -- but we want it to be optional or at least generated automatically.
    -- However, if it references auth.users, a random UUID will fail unless it's in auth.users.
    -- The best approach for now is to make it a standalone UUID if the reference is not strictly required for all students.
    
    -- Check if it references auth.users
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'students' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'students_id_fkey'
    ) THEN
        ALTER TABLE students DROP CONSTRAINT students_id_fkey;
    END IF;

    -- Add default gen_random_uuid() to id
    ALTER TABLE students ALTER COLUMN id SET DEFAULT gen_random_uuid();

    -- 2. Add monthly_fee column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'monthly_fee') THEN
        ALTER TABLE students ADD COLUMN monthly_fee DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- 3. Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'metadata') THEN
        ALTER TABLE students ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

END $$;
