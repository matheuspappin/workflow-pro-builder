ALTER TABLE organization_settings 
ADD COLUMN IF NOT EXISTS enabled_modules JSONB DEFAULT '{ "dashboard": true, "students": true, "classes": true, "financial": false, "ai_chat": false, "whatsapp": false, "pos": false }',
ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'dance';

-- Ensure vocabulary/nomenclature is consistent
-- We already have 'nomenclature', but user asked for 'vocabulary'. 
-- We can add a generated column or just use nomenclature. 
-- Let's add 'vocabulary' and migrate data if needed, or just use it.
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS vocabulary JSONB DEFAULT '{"client": "Aluno", "provider": "Professor", "service": "Aula"}';

-- Theme colors
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS theme_colors JSONB DEFAULT '{ "primary": "#7c3aed", "secondary": "#db2777" }';

-- Update RLS policies if necessary (existing ones should cover update if studio_id matches)
-- Ensure users can read their own settings
DROP POLICY IF EXISTS "Studio Isolation Settings Select" ON organization_settings;
CREATE POLICY "Studio Isolation Settings Select" ON organization_settings FOR SELECT USING (studio_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Studio Isolation Settings Update" ON organization_settings;
CREATE POLICY "Studio Isolation Settings Update" ON organization_settings FOR UPDATE USING (studio_id = auth.uid()::uuid);

-- Insert default settings for existing studios if they don't have it
INSERT INTO organization_settings (studio_id)
SELECT id FROM studios
ON CONFLICT (studio_id) DO NOTHING;
