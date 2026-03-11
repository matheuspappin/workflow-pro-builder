-- 109. Sincronizar módulo fiscal para estúdios com planos Pro/Pro+/Enterprise (Estúdio de Dança)
-- Garante que organization_settings.enabled_modules inclua fiscal após migration 105

UPDATE organization_settings os
SET
  enabled_modules = COALESCE(os.enabled_modules, '{}'::jsonb) || '{"fiscal": true}'::jsonb,
  updated_at = NOW()
FROM studios s
JOIN verticalization_plans vp ON vp.id = s.verticalization_plan_id
JOIN verticalizations v ON v.id = vp.verticalization_id
WHERE os.studio_id = s.id
  AND v.slug = 'estudio-de-danca'
  AND vp.plan_id IN ('pro', 'pro-plus', 'enterprise')
  AND vp.modules IS NOT NULL
  AND (vp.modules->>'fiscal')::boolean = true;
