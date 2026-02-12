CREATE TABLE IF NOT EXISTS partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL, -- O usuário que é um parceiro
    name TEXT NOT NULL,
    slug TEXT UNIQUE, -- para URL personalizada do parceiro ex: app.com/parceiro-x
    commission_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Adicionar vínculo de parceiro aos estúdios
ALTER TABLE studios 
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);

-- Tabela de Convites/Resgate de Sistema
-- Permite criar um estúdio sem dono inicial e gerar um link para o cliente assumir
CREATE TABLE IF NOT EXISTS studio_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    email TEXT, -- Email do cliente (opcional, pode ser link aberto)
    token TEXT NOT NULL UNIQUE, -- Token para URL de resgate
    used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_invites ENABLE ROW LEVEL SECURITY;

-- Parceiros veem seus próprios dados
DROP POLICY IF EXISTS "Partners view own data" ON partners;
CREATE POLICY "Partners view own data" ON partners 
    FOR ALL USING (auth.uid() = user_id);

-- Admin vê todos os invites (simplificado, idealmente checar role)
DROP POLICY IF EXISTS "Admins view all invites" ON studio_invites;
CREATE POLICY "Admins view all invites" ON studio_invites 
    FOR ALL USING (true); -- Ajustar para verificar role super_admin ou partner dono do studio

-- Permite leitura publica de invites via token para a página de resgate
DROP POLICY IF EXISTS "Public read invite by token" ON studio_invites;
CREATE POLICY "Public read invite by token" ON studio_invites 
    FOR SELECT USING (used_at IS NULL); 

-- Atualizar studios para permitir que parceiros vejam seus studios criados
DROP POLICY IF EXISTS "Partners view their studios" ON studios;
CREATE POLICY "Partners view their studios" ON studios 
    FOR SELECT USING (
        partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
        OR 
        owner_id = auth.uid() -- Mantém acesso do dono
    );
