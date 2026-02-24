ALTER TABLE system_plans 
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14;

COMMENT ON COLUMN system_plans.trial_days IS 'Duração do período de teste em dias para novos assinantes deste plano';
