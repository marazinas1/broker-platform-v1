
-- 1. Narrow the self-update exemption on profiles to 'owner' only.
CREATE OR REPLACE FUNCTION public.profiles_enforce_role_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  caller_role text;
  role_changed boolean;
  active_changed boolean;
  self_update boolean;
  restricted_changed boolean;
BEGIN
  role_changed := NEW.role IS DISTINCT FROM OLD.role;
  active_changed := NEW.is_active IS DISTINCT FROM OLD.is_active;
  self_update := auth.uid() = OLD.id;
  caller_role := public.current_user_role();

  -- Only owner may self-update show_on_website, sort_order, email.
  IF self_update AND caller_role IS DISTINCT FROM 'owner' THEN
    restricted_changed :=
      (NEW.show_on_website IS DISTINCT FROM OLD.show_on_website)
      OR (NEW.sort_order IS DISTINCT FROM OLD.sort_order)
      OR (NEW.email IS DISTINCT FROM OLD.email);
    IF restricted_changed THEN
      RAISE EXCEPTION 'You may not change show_on_website, sort_order, or email on your own profile';
    END IF;
  END IF;

  IF NOT role_changed AND NOT active_changed THEN
    RETURN NEW;
  END IF;

  IF role_changed AND NEW.role = 'owner' AND OLD.role <> 'owner' THEN
    IF caller_role IS DISTINCT FROM 'owner' THEN
      RAISE EXCEPTION 'Only an owner may grant the owner role';
    END IF;
  END IF;

  IF role_changed AND OLD.role = 'owner' AND NEW.role <> 'owner' THEN
    IF caller_role IS DISTINCT FROM 'owner' THEN
      RAISE EXCEPTION 'Only an owner may revoke the owner role';
    END IF;
  END IF;

  IF self_update AND caller_role IS DISTINCT FROM 'owner' THEN
    IF role_changed OR active_changed THEN
      RAISE EXCEPTION 'You may not change your own role or active status';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Permission override guard extended to DELETE.
CREATE OR REPLACE FUNCTION public.permissions_guard_overrides()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  caller_role text;
  target_role text;
  row_profile_id uuid;
  row_permission_key text;
BEGIN
  caller_role := public.current_user_role();

  IF TG_OP = 'DELETE' THEN
    row_profile_id := OLD.profile_id;
    row_permission_key := OLD.permission_key;
  ELSE
    row_profile_id := NEW.profile_id;
    row_permission_key := NEW.permission_key;
  END IF;

  -- No self-management of overrides.
  IF row_profile_id = auth.uid() THEN
    RAISE EXCEPTION 'You may not create, modify, or delete permission overrides on your own profile';
  END IF;

  SELECT role INTO target_role FROM public.profiles WHERE id = row_profile_id;

  -- Admins may not touch overrides on an owner's profile.
  IF caller_role = 'admin' AND target_role = 'owner' THEN
    RAISE EXCEPTION 'Admins may not manage permission overrides on an owner profile';
  END IF;

  -- Owner-only permission keys may only be managed by an owner.
  IF EXISTS (SELECT 1 FROM public.owner_only_permissions WHERE permission_key = row_permission_key) THEN
    IF caller_role IS DISTINCT FROM 'owner' THEN
      RAISE EXCEPTION 'Only an owner may manage override for permission %', row_permission_key;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS permissions_guard_overrides_trg ON public.permissions;
CREATE TRIGGER permissions_guard_overrides_trg
  BEFORE INSERT OR UPDATE OR DELETE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.permissions_guard_overrides();
