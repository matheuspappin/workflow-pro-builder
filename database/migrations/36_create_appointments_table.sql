-- Migração para criar a tabela de agendamentos pontuais
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- 1. Admins do estúdio podem fazer tudo
CREATE POLICY "Admins can do everything with appointments"
    ON public.appointments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_internal
            WHERE id = auth.uid() AND studio_id = appointments.studio_id
        )
    );

-- 2. Clientes podem ver seus próprios agendamentos
CREATE POLICY "Clients can see their own appointments"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (auth.uid() = client_id);

-- 3. Clientes podem criar seus próprios agendamentos
CREATE POLICY "Clients can create their own appointments"
    ON public.appointments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = client_id);

-- 4. Clientes podem cancelar seus próprios agendamentos (update status)
CREATE POLICY "Clients can cancel their own appointments"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (auth.uid() = client_id)
    WITH CHECK (status = 'cancelled');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_studio_id ON public.appointments(studio_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
