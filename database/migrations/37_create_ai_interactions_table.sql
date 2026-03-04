-- Migração para criar tabela de interações da IA
CREATE TABLE IF NOT EXISTS public.ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    customer_contact TEXT NOT NULL,
    message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    intent_type TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'chat',
    action_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- 1. Admins do estúdio podem fazer tudo
CREATE POLICY "Admins can do everything with ai_interactions"
    ON public.ai_interactions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_internal
            WHERE id = auth.uid() AND studio_id = ai_interactions.studio_id
        )
    );

-- 2. Apenas leitura para outros usuários do estúdio
CREATE POLICY "Studio users can read ai_interactions"
    ON public.ai_interactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_internal
            WHERE id = auth.uid() AND studio_id = ai_interactions.studio_id
        )
    );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_interactions_studio_id ON public.ai_interactions(studio_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON public.ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_intent_type ON public.ai_interactions(intent_type);
