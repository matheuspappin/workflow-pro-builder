-- 105. Seed de planos para verticalização Estúdio de Dança (DanceFlow)
-- Planos independentes do sistema global - controle total via admin da verticalização

-- Gratuito
INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'gratuito', 'Gratuito', 0,
  'Para testar e começar',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"whatsapp":false,"ai_chat":false,"pos":false,"inventory":false,"gamification":false,"leads":false,"scanner":false,"marketplace":false,"erp":false,"multi_unit":false,"fiscal":false}'::jsonb,
  10, 1, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'estudio-de-danca'
ON CONFLICT (verticalization_id, plan_id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  modules = EXCLUDED.modules,
  max_students = EXCLUDED.max_students,
  max_teachers = EXCLUDED.max_teachers,
  updated_at = NOW();

-- Pro
INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'pro', 'Pro', 97.00,
  'Para crescer seu negócio',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"whatsapp":true,"ai_chat":true,"pos":true,"inventory":true,"gamification":false,"leads":true,"scanner":true,"marketplace":false,"erp":false,"multi_unit":false,"fiscal":true}'::jsonb,
  100, 5, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'estudio-de-danca'
ON CONFLICT (verticalization_id, plan_id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  modules = EXCLUDED.modules,
  max_students = EXCLUDED.max_students,
  max_teachers = EXCLUDED.max_teachers,
  updated_at = NOW();

-- Pro+
INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'pro-plus', 'Pro+', 197.00,
  'Melhor custo-benefício',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"whatsapp":true,"ai_chat":true,"pos":true,"inventory":true,"gamification":true,"leads":true,"scanner":true,"marketplace":true,"erp":false,"multi_unit":false,"fiscal":true}'::jsonb,
  500, 15, true, 'active', 14
FROM verticalizations v WHERE v.slug = 'estudio-de-danca'
ON CONFLICT (verticalization_id, plan_id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  modules = EXCLUDED.modules,
  max_students = EXCLUDED.max_students,
  max_teachers = EXCLUDED.max_teachers,
  is_popular = EXCLUDED.is_popular,
  updated_at = NOW();

-- Enterprise
INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'enterprise', 'Enterprise', 397.00,
  'Para grandes redes',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"whatsapp":true,"ai_chat":true,"pos":true,"inventory":true,"gamification":true,"leads":true,"scanner":true,"marketplace":true,"erp":true,"multi_unit":true,"fiscal":true}'::jsonb,
  1000000, 1000000, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'estudio-de-danca'
ON CONFLICT (verticalization_id, plan_id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  modules = EXCLUDED.modules,
  max_students = EXCLUDED.max_students,
  max_teachers = EXCLUDED.max_teachers,
  updated_at = NOW();
