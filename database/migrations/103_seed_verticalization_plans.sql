-- 103. Seed de planos para Fire Protection e AgroFlowAI
-- Planos iniciais para cada verticalização

-- Fire Protection: planos para empresas de segurança contra incêndio
INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'basico', 'Inspeção Básica', 97.00,
  'Para pequenas empresas de vistoria e manutenção de extintores',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"scanner":true}'::jsonb,
  50, 3, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'fire-protection'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'pro', 'Inspeção Pro', 197.00,
  'Vistorias completas, gestão de técnicos e inventário',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"scanner":true,"inventory":true,"whatsapp":true}'::jsonb,
  200, 10, true, 'active', 14
FROM verticalizations v WHERE v.slug = 'fire-protection'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'enterprise', 'Inspeção Enterprise', 497.00,
  'Escalabilidade total, multi-unidades e suporte prioritário',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"scanner":true,"inventory":true,"whatsapp":true,"ai_chat":true,"leads":true,"multi_unit":true}'::jsonb,
  1000, 50, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'fire-protection'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

-- AgroFlowAI: planos para consultorias ambientais
INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'starter', 'CAR Starter', 97.00,
  'Regularização CAR para pequenas áreas e propriedades',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true}'::jsonb,
  30, 2, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'agroflowai'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'pro', 'CAR Pro', 197.00,
  'Laudos completos, licenciamento e monitoramento satelital',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"whatsapp":true,"leads":true}'::jsonb,
  100, 8, true, 'active', 14
FROM verticalizations v WHERE v.slug = 'agroflowai'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'enterprise', 'CAR Enterprise', 497.00,
  'Gestão completa, multi-unidades e IA para consultoria',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"whatsapp":true,"ai_chat":true,"leads":true,"multi_unit":true}'::jsonb,
  500, 30, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'agroflowai'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;
