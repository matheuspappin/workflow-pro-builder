-- Migração para criar tabela de horários dos profissionais
CREATE TABLE IF NOT EXISTS public.professional_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- RLS Policies
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- 1. Admins do estúdio podem fazer tudo
CREATE POLICY "Admins can do everything with professional_schedules"
    ON public.professional_schedules FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_internal
            WHERE id = auth.uid() AND studio_id = professional_schedules.studio_id
        )
    );

-- 2. Profissionais podem ver seus próprios horários
CREATE POLICY "Professionals can read their own schedules"
    ON public.professional_schedules FOR SELECT
    TO authenticated
    USING (auth.uid() = professional_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_professional_schedules_studio_id ON public.professional_schedules(studio_id);
CREATE INDEX IF NOT EXISTS idx_professional_schedules_professional_id ON public.professional_schedules(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_schedules_day_of_week ON public.professional_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_professional_schedules_active ON public.professional_schedules(is_active);
