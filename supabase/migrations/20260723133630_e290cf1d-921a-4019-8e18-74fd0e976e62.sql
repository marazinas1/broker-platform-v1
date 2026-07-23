
-- ============================================================
-- User management + permission system
-- ============================================================

-- 1.1 profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('owner','admin','agent','assistant','viewer')),
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  public_title text,
  public_bio jsonb NOT NULL DEFAULT '{}'::jsonb,
  public_photo_url text,
  languages_spoken text[],
  specializations text[],
  show_on_website boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 1.2 permissions
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  granted boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, permission_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER permissions_set_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 1.3 user_invitations
CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','admin','agent','assistant','viewer')),
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invitations TO authenticated;
GRANT ALL ON public.user_invitations TO service_role;

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1.4 security-definer helpers
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_active()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false)
$$;

CREATE OR REPLACE FUNCTION public.has_role(_roles text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.count_active_owners()
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.profiles WHERE role = 'owner' AND is_active = true
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_active() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.count_active_owners() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_owners() TO authenticated;

-- ============================================================
-- 1.5 signup trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invite record;
  resolved_role text := 'viewer';
BEGIN
  SELECT id, role INTO invite
    FROM public.user_invitations
   WHERE lower(email) = lower(NEW.email)
     AND accepted_at IS NULL
     AND expires_at > now()
   ORDER BY created_at DESC
   LIMIT 1;

  IF invite.id IS NOT NULL THEN
    resolved_role := invite.role;
    UPDATE public.user_invitations SET accepted_at = now() WHERE id = invite.id;
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, resolved_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 1.6 role/is_active integrity trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.profiles_enforce_role_integrity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  caller_role text;
  role_changed boolean;
  active_changed boolean;
BEGIN
  role_changed := NEW.role IS DISTINCT FROM OLD.role;
  active_changed := NEW.is_active IS DISTINCT FROM OLD.is_active;

  IF NOT role_changed AND NOT active_changed THEN
    RETURN NEW;
  END IF;

  caller_role := public.current_user_role();

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
  IF auth.uid() = OLD.id AND caller_role IS DISTINCT FROM 'owner' THEN
    IF role_changed OR active_changed THEN
      RAISE EXCEPTION 'You may not change your own role or active status';
    END IF;
  END IF;

  -- Rule 4: owner self-modification allowed; last-owner guard enforces safety.
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_enforce_role_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_enforce_role_integrity();

-- ============================================================
-- 1.7 last-owner guard
-- ============================================================

CREATE OR REPLACE FUNCTION public.profiles_protect_last_owner_upd()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'owner' AND OLD.is_active = true
     AND (NEW.role <> 'owner' OR NEW.is_active = false)
     AND public.count_active_owners() <= 1 THEN
    RAISE EXCEPTION 'Cannot demote or deactivate the last active owner';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_protect_last_owner_del()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'owner' AND OLD.is_active = true
     AND public.count_active_owners() <= 1 THEN
    RAISE EXCEPTION 'Cannot delete the last active owner';
  END IF;
  RETURN OLD;
END;
$$;

-- Runs after integrity trigger (alphabetic order: 'p' after 'e').
CREATE TRIGGER profiles_protect_last_owner_upd
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_last_owner_upd();

CREATE TRIGGER profiles_protect_last_owner_del
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_last_owner_del();

-- ============================================================
-- 1.8 RLS policies
-- ============================================================

-- profiles
CREATE POLICY "Public team members are readable"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (show_on_website = true);

CREATE POLICY "Authenticated can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Owner and admin can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['owner','admin']))
  WITH CHECK (public.has_role(ARRAY['owner','admin']));

CREATE POLICY "Owner and admin can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.has_role(ARRAY['owner','admin']));

-- permissions
CREATE POLICY "Own or admin can read permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.has_role(ARRAY['owner','admin']));

CREATE POLICY "Owner and admin can insert permissions"
  ON public.permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(ARRAY['owner','admin']));

CREATE POLICY "Owner and admin can update permissions"
  ON public.permissions FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['owner','admin']))
  WITH CHECK (public.has_role(ARRAY['owner','admin']));

CREATE POLICY "Owner and admin can delete permissions"
  ON public.permissions FOR DELETE
  TO authenticated
  USING (public.has_role(ARRAY['owner','admin']));

-- user_invitations
CREATE POLICY "Owner and admin can read invitations"
  ON public.user_invitations FOR SELECT
  TO authenticated
  USING (public.has_role(ARRAY['owner','admin']));

CREATE POLICY "Owner and admin can insert invitations"
  ON public.user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(ARRAY['owner','admin']));

CREATE POLICY "Owner and admin can delete invitations"
  ON public.user_invitations FOR DELETE
  TO authenticated
  USING (public.has_role(ARRAY['owner','admin']));
