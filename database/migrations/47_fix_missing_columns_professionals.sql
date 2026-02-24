-- Fix missing columns in professionals table
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS professional_type VARCHAR(20) DEFAULT 'technician';
