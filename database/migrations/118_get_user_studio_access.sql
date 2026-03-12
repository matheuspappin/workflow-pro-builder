-- Migration 118: Função get_user_studio_access()
-- Substitui as N+1 queries em requireStudioAccess por uma única chamada RPC.
-- Retorna: authorized (bool), role (text), reason (text para logs)

CREATE OR REPLACE FUNCTION get_user_studio_access(
  p_user_id  UUID,
  p_studio_id UUID
)
RETURNS TABLE(authorized BOOLEAN, role TEXT, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role   TEXT;
  v_studio RECORD;
BEGIN
  -- 1. Super Admin tem acesso global
  SELECT ui.role INTO v_role
  FROM users_internal ui
  WHERE ui.id = p_user_id AND ui.role = 'super_admin';

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, 'super_admin'::TEXT, 'super_admin'::TEXT;
    RETURN;
  END IF;

  -- 2. Verificar studio ativo
  SELECT s.owner_id, s.status, s.subscription_status, s.trial_ends_at
  INTO v_studio
  FROM studios s
  WHERE s.id = p_studio_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, ''::TEXT, 'studio_not_found'::TEXT;
    RETURN;
  END IF;

  IF v_studio.status = 'inactive' THEN
    RETURN QUERY SELECT FALSE, ''::TEXT, 'studio_inactive'::TEXT;
    RETURN;
  END IF;

  IF v_studio.subscription_status = 'trialing'
     AND v_studio.trial_ends_at IS NOT NULL
     AND v_studio.trial_ends_at < NOW() THEN
    RETURN QUERY SELECT FALSE, ''::TEXT, 'trial_expired'::TEXT;
    RETURN;
  END IF;

  -- 3. Dono do studio
  IF v_studio.owner_id = p_user_id THEN
    SELECT COALESCE(ui2.role, 'admin') INTO v_role
    FROM users_internal ui2
    WHERE ui2.id = p_user_id AND ui2.studio_id = p_studio_id;
    RETURN QUERY SELECT TRUE, COALESCE(v_role, 'admin')::TEXT, 'owner'::TEXT;
    RETURN;
  END IF;

  -- 4. users_internal (admin, receptionist, finance, seller, etc.)
  SELECT ui3.role INTO v_role
  FROM users_internal ui3
  WHERE ui3.id = p_user_id AND ui3.studio_id = p_studio_id;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, COALESCE(v_role, 'admin')::TEXT, 'users_internal'::TEXT;
    RETURN;
  END IF;

  -- 5. Professional ativo (teacher, engineer, architect, technician)
  SELECT pr.professional_type INTO v_role
  FROM professionals pr
  WHERE pr.user_id = p_user_id AND pr.studio_id = p_studio_id AND pr.status = 'active';

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, COALESCE(v_role, 'professional')::TEXT, 'professional'::TEXT;
    RETURN;
  END IF;

  -- 6. Student/cliente do studio
  PERFORM 1 FROM students st WHERE st.id = p_user_id AND st.studio_id = p_studio_id;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, 'student'::TEXT, 'student'::TEXT;
    RETURN;
  END IF;

  -- Sem vínculo
  RETURN QUERY SELECT FALSE, ''::TEXT, 'no_access'::TEXT;
END;
$$;

COMMENT ON FUNCTION get_user_studio_access(UUID, UUID) IS
  'Verifica acesso de um usuário a um studio em uma única query, substituindo as N+1 queries em requireStudioAccess.';
