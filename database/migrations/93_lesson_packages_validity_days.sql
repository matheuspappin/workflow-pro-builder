-- Add validity_days to lesson_packages (validity of the package in days, e.g. 90)
ALTER TABLE lesson_packages
ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 90;
