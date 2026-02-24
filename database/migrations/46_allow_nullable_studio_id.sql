-- 46. Permitir profissionais sem estúdio (para cadastro independente de engenheiros)
ALTER TABLE professionals ALTER COLUMN studio_id DROP NOT NULL;

-- Garantir que a coluna professional_type exista e suporte 'engineer'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professionals' AND column_name = 'professional_type') THEN
        ALTER TABLE professionals ADD COLUMN professional_type VARCHAR(20) DEFAULT 'technician';
    END IF;
END $$;
