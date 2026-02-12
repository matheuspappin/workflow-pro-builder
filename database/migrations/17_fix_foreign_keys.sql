
-- Garantir que as chaves estrangeiras existam para que o PostgREST possa resolver os joins
DO $$
BEGIN
    -- 1. teachers -> studios
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teachers_studio_id_fkey'
    ) THEN
        -- Primeiro remove se houver uma coluna studio_id sem constraint ou com constraint errada
        -- Mas aqui vamos apenas tentar adicionar se não houver a constraint pelo nome padrão
        ALTER TABLE teachers 
        ADD CONSTRAINT teachers_studio_id_fkey 
        FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE;
    END IF;

    -- 2. students -> studios
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_studio_id_fkey'
    ) THEN
        ALTER TABLE students 
        ADD CONSTRAINT students_studio_id_fkey 
        FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE;
    END IF;

    -- 3. users_internal -> studios
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_internal_studio_id_fkey'
    ) THEN
        ALTER TABLE users_internal 
        ADD CONSTRAINT users_internal_studio_id_fkey 
        FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE;
    END IF;

    -- 4. studios -> partners (Relacionamento inverso)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'studios_partner_id_fkey'
    ) THEN
        ALTER TABLE studios 
        ADD CONSTRAINT studios_partner_id_fkey 
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;
    END IF;
END $$;
