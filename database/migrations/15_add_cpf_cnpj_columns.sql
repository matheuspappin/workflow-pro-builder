-- 15_add_cpf_cnpj_columns.sql
-- Adiciona a coluna cpf_cnpj nas tabelas de perfil que ainda não a possuem

DO $$
BEGIN
    -- users_internal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_internal' AND column_name = 'cpf_cnpj') THEN
        ALTER TABLE users_internal ADD COLUMN cpf_cnpj VARCHAR(20);
    END IF;

    -- students
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'cpf_cnpj') THEN
        ALTER TABLE students ADD COLUMN cpf_cnpj VARCHAR(20);
    END IF;

    -- teachers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'cpf_cnpj') THEN
            ALTER TABLE teachers ADD COLUMN cpf_cnpj VARCHAR(20);
        END IF;
    END IF;

    -- professionals (fallback/legacy)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'professionals') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professionals' AND column_name = 'cpf_cnpj') THEN
            ALTER TABLE professionals ADD COLUMN cpf_cnpj VARCHAR(20);
        END IF;
    END IF;

END $$;
