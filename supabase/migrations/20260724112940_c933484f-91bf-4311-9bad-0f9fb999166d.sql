DROP POLICY IF EXISTS "Authenticated can read all profiles" ON public.profiles;

-- Signed-in users can read their own profile.
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Owners and admins can read every profile (needed for admin/team management).
CREATE POLICY "Owner and admin can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(ARRAY['owner'::text, 'admin'::text]));