-- Sincronizar enabled_modules de todos os estúdios quando os módulos do plano forem alterados
-- Garante consistência: ao adicionar/remover módulos em um plano, todos os estúdios existentes
-- nesse plano recebem a atualização automaticamente (verticalizations e system_plans).

-- 1. Função: sincronizar estúdios de um verticalization_plan quando modules mudar
CREATE OR REPLACE FUNCTION sync_studios_on_verticalization_plan_modules_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.modules IS NOT DISTINCT FROM NEW.modules THEN
    RETURN NEW;
  END IF;

  IF NEW.modules IS NULL OR NEW.modules = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  UPDATE organization_settings os
  SET enabled_modules = NEW.modules,
      updated_at = NOW()
  FROM studios s
  WHERE os.studio_id = s.id
    AND s.verticalization_plan_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_studios_on_vp_modules_change ON verticalization_plans;
CREATE TRIGGER trg_sync_studios_on_vp_modules_change
  AFTER UPDATE OF modules ON verticalization_plans
  FOR EACH ROW
  EXECUTE FUNCTION sync_studios_on_verticalization_plan_modules_change();

-- 2. Função: sincronizar estúdios de um system_plan quando modules mudar
CREATE OR REPLACE FUNCTION sync_studios_on_system_plan_modules_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.modules IS NOT DISTINCT FROM NEW.modules THEN
    RETURN NEW;
  END IF;

  IF NEW.modules IS NULL OR NEW.modules = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

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

DROP TRIGGER IF EXISTS trg_sync_studios_on_sp_modules_change ON system_plans;
CREATE TRIGGER trg_sync_studios_on_sp_modules_change
  AFTER UPDATE OF modules ON system_plans
  FOR EACH ROW
  EXECUTE FUNCTION sync_studios_on_system_plan_modules_change();
