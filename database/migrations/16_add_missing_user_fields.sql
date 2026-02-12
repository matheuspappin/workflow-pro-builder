-- 16_add_missing_user_fields.sql
-- Adiciona birth_date e address nas tabelas users_internal e teachers (professionals)

DO $$
BEGIN
    -- users_internal: birth_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_internal' AND column_name = 'birth_date') THEN
        ALTER TABLE users_internal ADD COLUMN birth_date DATE;
    END IF;

    -- users_internal: address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_internal' AND column_name = 'address') THEN
        ALTER TABLE users_internal ADD COLUMN address TEXT;
    END IF;

    -- teachers: birth_date
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'birth_date') THEN
            ALTER TABLE teachers ADD COLUMN birth_date DATE;
        END IF;
    END IF;

    -- teachers: address
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'address') THEN
            ALTER TABLE teachers ADD COLUMN address TEXT;
        END IF;
    END IF;

    -- professionals: birth_date
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'professionals') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professionals' AND column_name = 'birth_date') THEN
            ALTER TABLE professionals ADD COLUMN birth_date DATE;
        END IF;
    END IF;

    -- professionals: address
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'professionals') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professionals' AND column_name = 'address') THEN
            ALTER TABLE professionals ADD COLUMN address TEXT;
        END IF;
    END IF;

END $$;
