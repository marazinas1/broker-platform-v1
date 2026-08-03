-- role_permissions is a non-sensitive lookup matrix; a SELECT policy for
-- anon+authenticated already exists but the Data API GRANT was missing.
GRANT SELECT ON public.role_permissions TO anon;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;

-- owner_only_permissions: authenticated-only lookup used by permission checks.
GRANT SELECT ON public.owner_only_permissions TO authenticated;
GRANT ALL ON public.owner_only_permissions TO service_role;

-- Ensure a SELECT policy exists for both roles on role_permissions.
DROP POLICY IF EXISTS "role_permissions readable by all" ON public.role_permissions;
CREATE POLICY "role_permissions readable by all"
  ON public.role_permissions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Overrides table + profiles are already restricted; no write policies added:
-- role_permissions and owner_only_permissions remain seeded via migrations only.
