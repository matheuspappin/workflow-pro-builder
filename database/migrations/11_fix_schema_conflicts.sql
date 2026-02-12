DO $$
BEGIN
    -- Adicionar enabled_modules se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_settings' AND column_name = 'enabled_modules') THEN
        ALTER TABLE organization_settings ADD COLUMN enabled_modules JSONB DEFAULT '{ "dashboard": true, "students": true, "classes": true, "financial": false, "ai_chat": false, "whatsapp": false, "pos": false }';
    END IF;

    -- Adicionar niche se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_settings' AND column_name = 'niche') THEN
        ALTER TABLE organization_settings ADD COLUMN niche TEXT DEFAULT 'dance';
    END IF;

    -- Adicionar vocabulary se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_settings' AND column_name = 'vocabulary') THEN
        ALTER TABLE organization_settings ADD COLUMN vocabulary JSONB DEFAULT '{"client": "Aluno", "provider": "Professor", "service": "Aula", "establishment": "Estúdio"}';
    END IF;

    -- Adicionar theme_colors se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_settings' AND column_name = 'theme_colors') THEN
        ALTER TABLE organization_settings ADD COLUMN theme_colors JSONB DEFAULT '{ "primary": "#7c3aed", "secondary": "#db2777" }';
    END IF;
    
    -- Adicionar business_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_settings' AND column_name = 'business_type') THEN
        ALTER TABLE organization_settings ADD COLUMN business_type TEXT DEFAULT 'dance_school';
    END IF;
END $$;

-- 2. Garantir tabela partners
CREATE TABLE IF NOT EXISTS partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Garantir tabela studio_invites
CREATE TABLE IF NOT EXISTS studio_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    email TEXT,
    token TEXT NOT NULL UNIQUE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 4. Atualizar Policies (Drop & Recreate para evitar erros de existência)
DO $$
BEGIN
    -- Partners
    DROP POLICY IF EXISTS "Partners view own data" ON partners;
    ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Partners view own data" ON partners FOR ALL USING (auth.uid() = user_id);

    -- Invites
    DROP POLICY IF EXISTS "Admins view all invites" ON studio_invites;
    DROP POLICY IF EXISTS "Public read invite by token" ON studio_invites;
    ALTER TABLE studio_invites ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Admins view all invites" ON studio_invites FOR ALL USING (true);
    CREATE POLICY "Public read invite by token" ON studio_invites FOR SELECT USING (used_at IS NULL);
END $$;
