-- Migration 89: Criar tabela studio_api_keys se não existir
-- Essencial para funcionamento de AI Chat, WhatsApp e outros serviços

CREATE TABLE IF NOT EXISTS public.studio_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL, -- 'whatsapp', 'gemini', 'openai', 'stripe', etc.
    api_key TEXT,
    api_secret TEXT,
    instance_id VARCHAR(255), -- ID da instância (ex: Evolution API)
    webhook_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(studio_id, service_name)
);

-- RLS Policies
ALTER TABLE public.studio_api_keys ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- 1. Admins do estúdio podem fazer tudo
CREATE POLICY "Admins can do everything with studio_api_keys"
    ON public.studio_api_keys FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_internal
            WHERE id = auth.uid() AND studio_id = studio_api_keys.studio_id
        )
    );

-- 2. Super admins podem tudo
CREATE POLICY "Super admins can do everything with studio_api_keys"
    ON public.studio_api_keys FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_internal
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_studio_api_keys_studio_id ON public.studio_api_keys(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_api_keys_service_name ON public.studio_api_keys(service_name);
CREATE INDEX IF NOT EXISTS idx_studio_api_keys_status ON public.studio_api_keys(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_studio_api_keys_updated_at ON public.studio_api_keys;

CREATE TRIGGER update_studio_api_keys_updated_at 
    BEFORE UPDATE ON public.studio_api_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir chaves padrão para serviços essenciais
INSERT INTO public.studio_api_keys (studio_id, service_name, api_key, status)
SELECT 
    id,
    'openai',
    NULL, -- Será preenchido pelo usuário
    'inactive'
FROM public.studios 
WHERE id NOT IN (
    SELECT DISTINCT studio_id 
    FROM public.studio_api_keys 
    WHERE service_name = 'openai'
);

INSERT INTO public.studio_api_keys (studio_id, service_name, api_key, status)
SELECT 
    id,
    'gemini', 
    NULL, -- Será preenchido pelo usuário
    'inactive'
FROM public.studios 
WHERE id NOT IN (
    SELECT DISTINCT studio_id 
    FROM public.studio_api_keys 
    WHERE service_name = 'gemini'
);
