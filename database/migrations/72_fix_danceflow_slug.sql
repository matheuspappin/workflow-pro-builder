-- Migration 72: Corrige slug do DanceFlow para corresponder à rota Next.js real
-- O slug 'dance-studio' causava 404 porque a rota existe em /solutions/estudio-de-danca

UPDATE verticalizations
SET
  slug        = 'estudio-de-danca',
  landing_url = '/solutions/estudio-de-danca',
  admin_url   = '/admin/verticalizations/estudio-de-danca',
  updated_at  = NOW()
WHERE niche = 'dance'
  AND slug IN ('dance-studio', 'estudio-de-danca');
