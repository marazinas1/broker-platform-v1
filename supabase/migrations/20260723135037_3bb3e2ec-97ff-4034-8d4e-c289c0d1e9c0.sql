
-- 1. Extend profiles_enforce_role_integrity to lock down self-updatable identity/public fields.
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

  -- Restrict self-updates on sensitive public/identity fields for non-owner/non-admin users.
  IF self_update AND caller_role IS DISTINCT FROM 'owner' AND caller_role IS DISTINCT FROM 'admin' THEN
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

  -- Rule 1: only owner may set role='owner'
  IF role_changed AND NEW.role = 'owner' AND OLD.role <> 'owner' THEN
    IF caller_role IS DISTINCT FROM 'owner' THEN
      RAISE EXCEPTION 'Only an owner may grant the owner role';
    END IF;
  END IF;

  -- Rule 2: only owner may clear role='owner'
  IF role_changed AND OLD.role = 'owner' AND NEW.role <> 'owner' THEN
    IF caller_role IS DISTINCT FROM 'owner' THEN
      RAISE EXCEPTION 'Only an owner may revoke the owner role';
    END IF;
  END IF;

  -- Rule 3: non-owner may not change their own role or is_active
  IF self_update AND caller_role IS DISTINCT FROM 'owner' THEN
    IF role_changed OR active_changed THEN
      RAISE EXCEPTION 'You may not change your own role or active status';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Owner-only permission keys registry + guard trigger on public.permissions.
CREATE TABLE IF NOT EXISTS public.owner_only_permissions (
  permission_key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.owner_only_permissions TO authenticated;
GRANT ALL ON public.owner_only_permissions TO service_role;

ALTER TABLE public.owner_only_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read owner-only keys" ON public.owner_only_permissions;
CREATE POLICY "Anyone authenticated can read owner-only keys"
  ON public.owner_only_permissions FOR SELECT TO authenticated USING (true);

INSERT INTO public.owner_only_permissions (permission_key)
VALUES ('design.edit')
ON CONFLICT (permission_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.permissions_guard_overrides()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  caller_role text;
  target_role text;
BEGIN
  caller_role := public.current_user_role();

  -- Never allow self-override.
  IF NEW.profile_id = auth.uid() THEN
    RAISE EXCEPTION 'You may not create or modify permission overrides on your own profile';
  END IF;

  -- Look up target profile role.
  SELECT role INTO target_role FROM public.profiles WHERE id = NEW.profile_id;

  -- Admins may not touch overrides on an owner's profile.
  IF caller_role = 'admin' AND target_role = 'owner' THEN
    RAISE EXCEPTION 'Admins may not manage permission overrides on an owner profile';
  END IF;

  -- Owner-only keys may only be granted by an owner.
  IF EXISTS (SELECT 1 FROM public.owner_only_permissions WHERE permission_key = NEW.permission_key) THEN
    IF caller_role IS DISTINCT FROM 'owner' THEN
      RAISE EXCEPTION 'Only an owner may grant override for permission %', NEW.permission_key;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS permissions_guard_overrides_trg ON public.permissions;
CREATE TRIGGER permissions_guard_overrides_trg
  BEFORE INSERT OR UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.permissions_guard_overrides();

-- 3. UPDATE policy on user_invitations for owner/admin.
DROP POLICY IF EXISTS "Owners and admins can update invitations" ON public.user_invitations;
CREATE POLICY "Owners and admins can update invitations"
  ON public.user_invitations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['owner','admin']))
  WITH CHECK (public.has_role(ARRAY['owner','admin']));
