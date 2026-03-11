-- Add 'teacher' to professionals.professional_type for DanceFlow
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_professional_type_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_professional_type_check
  CHECK (professional_type IN ('technician', 'engineer', 'architect', 'teacher', 'other'));
