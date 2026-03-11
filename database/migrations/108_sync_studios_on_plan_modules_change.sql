-- 108. Sincronizar enabled_modules de todos os estúdios quando os módulos do plano forem alterados
-- Garante consistência: ao adicionar/remover módulos em um plano, todos os estúdios existentes
-- nesse plano recebem a atualização automaticamente (verticalizations e system_plans).

-- 1. Função: sincronizar estúdios de um verticalization_plan quando modules mudar
CREATE OR REPLACE FUNCTION sync_studios_on_verticalization_plan_modules_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só disparar se modules realmente mudou
  IF OLD.modules IS NOT DISTINCT FROM NEW.modules THEN
    RETURN NEW;
  END IF;

  IF NEW.modules IS NULL OR NEW.modules = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Atualizar organization_settings de todos os estúdios neste plano vertical
  UPDATE organization_settings os
  SET enabled_modules = NEW.modules,
      updated_at = NOW()
  FROM studios s
  WHERE os.studio_id = s.id
    AND s.verticalization_plan_id = NEW.id;

  RETURN NEW;
END;
$$;

-- 2. Trigger em verticalization_plans
DROP TRIGGER IF EXISTS trg_sync_studios_on_vp_modules_change ON verticalization_plans;
CREATE TRIGGER trg_sync_studios_on_vp_modules_change
  AFTER UPDATE OF modules ON verticalization_plans
  FOR EACH ROW
  EXECUTE FUNCTION sync_studios_on_verticalization_plan_modules_change();

-- 3. Função: sincronizar estúdios de um system_plan quando modules mudar
CREATE OR REPLACE FUNCTION sync_studios_on_system_plan_modules_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só disparar se modules realmente mudou
  IF OLD.modules IS NOT DISTINCT FROM NEW.modules THEN
    RETURN NEW;
  END IF;

  IF NEW.modules IS NULL OR NEW.modules = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Atualizar organization_settings de estúdios que usam system_plans (sem verticalization)
  UPDATE organization_settings os
  SET enabled_modules = NEW.modules,
      updated_at = NOW()
  FROM studios s
  WHERE os.studio_id = s.id
    AND s.plan = NEW.id
    AND s.verticalization_plan_id IS NULL;

  RETURN NEW;
END;
$$;

-- 4. Trigger em system_plans (se a coluna modules existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_plans' AND column_name = 'modules'
  ) THEN
    DROP TRIGGER IF EXISTS trg_sync_studios_on_sp_modules_change ON system_plans;
    EXECUTE 'CREATE TRIGGER trg_sync_studios_on_sp_modules_change
      AFTER UPDATE OF modules ON system_plans
      FOR EACH ROW
      EXECUTE FUNCTION sync_studios_on_system_plan_modules_change()';
  END IF;
END;
$$;
