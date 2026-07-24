
-- =========================================================================
-- 1. role_permissions (authoritative role matrix, mirrored to TypeScript)
-- =========================================================================
CREATE TABLE public.role_permissions (
  role text NOT NULL,
  permission_key text NOT NULL,
  granted boolean NOT NULL,
  PRIMARY KEY (role, permission_key)
);

GRANT SELECT ON public.role_permissions TO anon, authenticated;
GRANT ALL ON public.role_permissions TO service_role;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions readable by all"
  ON public.role_permissions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed the matrix. Must match src/lib/auth/permissions.ts historical values.
INSERT INTO public.role_permissions (role, permission_key, granted) VALUES
  ('owner','listing.create',true),('admin','listing.create',true),('agent','listing.create',true),('assistant','listing.create',true),('viewer','listing.create',false),
  ('owner','listing.edit.own',true),('admin','listing.edit.own',true),('agent','listing.edit.own',true),('assistant','listing.edit.own',true),('viewer','listing.edit.own',false),
  ('owner','listing.edit.any',true),('admin','listing.edit.any',true),('agent','listing.edit.any',false),('assistant','listing.edit.any',false),('viewer','listing.edit.any',false),
  ('owner','listing.publish',true),('admin','listing.publish',true),('agent','listing.publish',true),('assistant','listing.publish',false),('viewer','listing.publish',false),
  ('owner','listing.delete',true),('admin','listing.delete',true),('agent','listing.delete',false),('assistant','listing.delete',false),('viewer','listing.delete',false),
  ('owner','listing.status.change',true),('admin','listing.status.change',true),('agent','listing.status.change',true),('assistant','listing.status.change',false),('viewer','listing.status.change',false),
  ('owner','inquiry.view.own',true),('admin','inquiry.view.own',true),('agent','inquiry.view.own',true),('assistant','inquiry.view.own',true),('viewer','inquiry.view.own',true),
  ('owner','inquiry.view.any',true),('admin','inquiry.view.any',true),('agent','inquiry.view.any',false),('assistant','inquiry.view.any',true),('viewer','inquiry.view.any',true),
  ('owner','inquiry.assign',true),('admin','inquiry.assign',true),('agent','inquiry.assign',false),('assistant','inquiry.assign',true),('viewer','inquiry.assign',false),
  ('owner','user.invite',true),('admin','user.invite',true),('agent','user.invite',false),('assistant','user.invite',false),('viewer','user.invite',false),
  ('owner','user.manage',true),('admin','user.manage',true),('agent','user.manage',false),('assistant','user.manage',false),('viewer','user.manage',false),
  ('owner','settings.edit',true),('admin','settings.edit',true),('agent','settings.edit',false),('assistant','settings.edit',false),('viewer','settings.edit',false),
  ('owner','design.edit',true),('admin','design.edit',false),('agent','design.edit',false),('assistant','design.edit',false),('viewer','design.edit',false),
  ('owner','content.edit',true),('admin','content.edit',true),('agent','content.edit',false),('assistant','content.edit',true),('viewer','content.edit',false),
  ('owner','analytics.view.own',true),('admin','analytics.view.own',true),('agent','analytics.view.own',true),('assistant','analytics.view.own',false),('viewer','analytics.view.own',true),
  ('owner','analytics.view.any',true),('admin','analytics.view.any',true),('agent','analytics.view.any',false),('assistant','analytics.view.any',false),('viewer','analytics.view.any',true);

-- =========================================================================
-- 2. current_user_has_permission (single source of truth check)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.current_user_has_permission(_key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_active boolean;
  v_override boolean;
  v_granted boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  SELECT role, is_active INTO v_role, v_active
    FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL OR NOT COALESCE(v_active, false) THEN RETURN false; END IF;

  SELECT granted INTO v_override
    FROM public.permissions
    WHERE profile_id = auth.uid() AND permission_key = _key;
  IF FOUND THEN RETURN v_override; END IF;

  SELECT granted INTO v_granted
    FROM public.role_permissions
    WHERE role = v_role AND permission_key = _key;
  RETURN COALESCE(v_granted, false);
END;
$$;

-- =========================================================================
-- 3. slugify helper
-- =========================================================================
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s text;
BEGIN
  IF _input IS NULL THEN RETURN ''; END IF;
  s := lower(_input);
  s := translate(s,
    'äöüßáàâãåæçéèêëíìîïñóòôõøœúùûýÿ',
    'aousaaaaaaceeeeiiiinooooooeuuuyy');
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  RETURN s;
END;
$$;

-- =========================================================================
-- 4. listings table
-- =========================================================================
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  reference_code text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','coming_soon','active','reserved','sold','rented','archived')),
  deal_type text NOT NULL CHECK (deal_type IN ('sale','rent')),
  property_type text NOT NULL
    CHECK (property_type IN ('house','apartment','land','commercial','garage','other')),
  published_at timestamptz,
  sold_at timestamptz,
  sold_price numeric,
  archived_at timestamptz,
  is_featured boolean NOT NULL DEFAULT false,
  is_exclusive boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  price numeric,
  price_on_request boolean NOT NULL DEFAULT false,
  price_period text CHECK (price_period IN ('month','total')),
  commission_note text,
  additional_costs jsonb NOT NULL DEFAULT '{}'::jsonb,
  living_area numeric,
  plot_area numeric,
  usable_area numeric,
  rooms numeric,
  bedrooms int,
  bathrooms int,
  floor int,
  total_floors int,
  year_built int,
  year_renovated int,
  address_street text,
  address_number text,
  address_zip text,
  address_city text,
  address_region text,
  address_country text,
  geo_lat numeric,
  geo_lng numeric,
  geo_precision text NOT NULL DEFAULT 'approximate'
    CHECK (geo_precision IN ('exact','approximate','hidden')),
  energy jsonb NOT NULL DEFAULT '{}'::jsonb,
  features text[] NOT NULL DEFAULT '{}',
  condition text CHECK (condition IN ('new','renovated','good','needs_renovation')),
  heating_type text,
  availability_date date,
  title jsonb NOT NULL DEFAULT '{}'::jsonb,
  description jsonb NOT NULL DEFAULT '{}'::jsonb,
  highlights jsonb NOT NULL DEFAULT '{}'::jsonb,
  expose_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta_title jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta_description jsonb NOT NULL DEFAULT '{}'::jsonb,
  agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  view_count int NOT NULL DEFAULT 0,
  inquiry_count int NOT NULL DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE INDEX listings_status_idx ON public.listings(status);
CREATE INDEX listings_deal_type_idx ON public.listings(deal_type);
CREATE INDEX listings_property_type_idx ON public.listings(property_type);
CREATE INDEX listings_city_idx ON public.listings(address_city);
CREATE INDEX listings_price_idx ON public.listings(price);
CREATE INDEX listings_published_at_idx ON public.listings(published_at DESC);
CREATE INDEX listings_agent_id_idx ON public.listings(agent_id);
CREATE INDEX listings_features_gin ON public.listings USING gin(features);

-- =========================================================================
-- 5. media tables
-- =========================================================================
CREATE TABLE public.listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  alt_text jsonb NOT NULL DEFAULT '{}'::jsonb,
  caption jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  is_floorplan boolean NOT NULL DEFAULT false,
  is_visualization boolean NOT NULL DEFAULT false,
  width int,
  height int,
  blurhash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_images TO authenticated;
GRANT ALL ON public.listing_images TO service_role;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
CREATE INDEX listing_images_listing_idx ON public.listing_images(listing_id, sort_order);

CREATE TABLE public.listing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  type text CHECK (type IN ('expose','energy_cert','floorplan','other')),
  storage_path text NOT NULL,
  filename text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  requires_lead boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_documents TO authenticated;
GRANT ALL ON public.listing_documents TO service_role;
ALTER TABLE public.listing_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX listing_documents_listing_idx ON public.listing_documents(listing_id);

CREATE TABLE public.listing_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  type text CHECK (type IN ('matterport','youtube','vimeo','360')),
  url text NOT NULL,
  thumbnail_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_tours TO authenticated;
GRANT ALL ON public.listing_tours TO service_role;
ALTER TABLE public.listing_tours ENABLE ROW LEVEL SECURITY;
CREATE INDEX listing_tours_listing_idx ON public.listing_tours(listing_id, sort_order);

-- =========================================================================
-- 6. energy validator
-- =========================================================================
CREATE OR REPLACE FUNCTION public.validate_listing_energy(_country text, _energy jsonb, _property_type text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  missing text[] := '{}';
  v text;
BEGIN
  IF _property_type IN ('land','garage') THEN RETURN '{}'; END IF;

  IF _country = 'AT' THEN
    IF NOT (_energy ? 'hwb') OR jsonb_typeof(_energy->'hwb') <> 'number' THEN missing := missing || 'hwb'; END IF;
    IF NOT (_energy ? 'eeb') OR jsonb_typeof(_energy->'eeb') <> 'number' THEN missing := missing || 'eeb'; END IF;
    v := _energy->>'efficiency_class';
    IF v IS NULL OR v NOT IN ('A++','A+','A','B','C','D','E','F','G') THEN missing := missing || 'efficiency_class'; END IF;

  ELSIF _country = 'DE' THEN
    v := _energy->>'certificate_type';
    IF v IS NULL OR v NOT IN ('Bedarfsausweis','Verbrauchsausweis') THEN missing := missing || 'certificate_type'; END IF;
    IF NOT (_energy ? 'final_energy') OR jsonb_typeof(_energy->'final_energy') <> 'number' THEN missing := missing || 'final_energy'; END IF;
    IF (_energy->>'energy_source') IS NULL OR length(_energy->>'energy_source') = 0 THEN missing := missing || 'energy_source'; END IF;
    v := _energy->>'efficiency_class';
    IF v IS NULL OR v NOT IN ('A+','A','B','C','D','E','F','G','H') THEN missing := missing || 'efficiency_class'; END IF;
    IF NOT (_energy ? 'year_built') OR jsonb_typeof(_energy->'year_built') <> 'number' THEN missing := missing || 'year_built'; END IF;
  END IF;

  RETURN missing;
END;
$$;

-- =========================================================================
-- 7. triggers on listings
-- =========================================================================

-- Slug generation on INSERT only.
CREATE OR REPLACE FUNCTION public.listings_generate_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  attempt int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND length(NEW.slug) > 0 THEN RETURN NEW; END IF;

  base := public.slugify(
    coalesce(NEW.property_type, 'listing')
    || '-' || coalesce(NEW.address_city, '')
    || CASE WHEN NEW.rooms IS NOT NULL THEN '-' || NEW.rooms::text || '-zimmer' ELSE '' END
  );
  IF base = '' OR base IS NULL THEN base := 'listing'; END IF;

  LOOP
    candidate := base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
    IF NOT EXISTS (SELECT 1 FROM public.listings WHERE slug = candidate) THEN
      NEW.slug := candidate;
      RETURN NEW;
    END IF;
    attempt := attempt + 1;
    IF attempt >= 5 THEN
      NEW.slug := candidate || '-' || substr(md5(random()::text), 1, 4);
      RETURN NEW;
    END IF;
  END LOOP;
END;
$$;

CREATE TRIGGER listings_generate_slug_trg
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.listings_generate_slug();

-- Actor stamping.
CREATE OR REPLACE FUNCTION public.listings_set_actor()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
    NEW.updated_by := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_set_actor_trg
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.listings_set_actor();

-- updated_at maintenance.
CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Status flow enforcement + date side-effects.
CREATE OR REPLACE FUNCTION public.listings_enforce_status_flow()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  ok boolean := false;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  ok := CASE OLD.status
    WHEN 'draft'       THEN NEW.status IN ('coming_soon','active','archived')
    WHEN 'coming_soon' THEN NEW.status IN ('active','archived','draft')
    WHEN 'active'      THEN NEW.status IN ('reserved','sold','rented','archived')
    WHEN 'reserved'    THEN NEW.status IN ('active','sold','rented')
    WHEN 'sold'        THEN NEW.status IN ('archived','active')
    WHEN 'rented'      THEN NEW.status IN ('archived','active')
    WHEN 'archived'    THEN NEW.status IN ('draft')
    ELSE false
  END;

  IF NOT ok THEN
    RAISE EXCEPTION 'Invalid listing status transition: % -> %', OLD.status, NEW.status;
  END IF;

  IF NEW.status = 'active' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  IF NEW.status IN ('sold','rented') AND NEW.sold_at IS NULL THEN
    NEW.sold_at := now();
  END IF;
  IF NEW.status = 'archived' AND NEW.archived_at IS NULL THEN
    NEW.archived_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_enforce_status_flow_trg
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.listings_enforce_status_flow();

-- Permission enforcement for publish + status change (readable errors).
CREATE OR REPLACE FUNCTION public.listings_enforce_publish_permission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  status_changed boolean;
BEGIN
  status_changed := (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status);

  IF status_changed AND NEW.status IN ('active','coming_soon') THEN
    IF NOT public.current_user_has_permission('listing.publish') THEN
      RAISE EXCEPTION 'Permission denied: publishing a listing requires the listing.publish permission';
    END IF;
  END IF;

  IF status_changed AND NEW.status IN ('sold','rented') THEN
    IF NOT public.current_user_has_permission('listing.status.change') THEN
      RAISE EXCEPTION 'Permission denied: changing a listing to sold or rented requires the listing.status.change permission';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_enforce_publish_permission_trg
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.listings_enforce_publish_permission();

-- Energy validation on publish.
CREATE OR REPLACE FUNCTION public.listings_validate_energy_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_changed boolean;
  v_country text;
  missing text[];
BEGIN
  status_changed := (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status);
  IF NOT status_changed THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('active','coming_soon') THEN RETURN NEW; END IF;

  SELECT country INTO v_country FROM public.site_settings LIMIT 1;
  IF v_country IS NULL OR length(v_country) = 0 THEN
    RAISE EXCEPTION 'Site country is not configured; set site_settings.country before publishing listings';
  END IF;

  missing := public.validate_listing_energy(v_country, NEW.energy, NEW.property_type);
  IF array_length(missing, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Missing or invalid energy fields for country %: %', v_country, array_to_string(missing, ', ');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_validate_energy_on_publish_trg
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.listings_validate_energy_on_publish();

-- =========================================================================
-- 8. RLS policies
-- =========================================================================

-- listings: no anon SELECT policy (public reads go through listings_public).
CREATE POLICY "listings staff select"
  ON public.listings FOR SELECT TO authenticated
  USING (
    public.current_user_has_permission('listing.edit.any')
    OR (public.current_user_has_permission('listing.edit.own')
        AND (agent_id = auth.uid() OR created_by = auth.uid()))
    OR status IN ('active','coming_soon','reserved','sold','rented')
  );

CREATE POLICY "listings insert"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('listing.create'));

CREATE POLICY "listings update"
  ON public.listings FOR UPDATE TO authenticated
  USING (
    public.current_user_has_permission('listing.edit.any')
    OR (public.current_user_has_permission('listing.edit.own')
        AND (agent_id = auth.uid() OR created_by = auth.uid()))
  )
  WITH CHECK (
    public.current_user_has_permission('listing.edit.any')
    OR (public.current_user_has_permission('listing.edit.own')
        AND (agent_id = auth.uid() OR created_by = auth.uid()))
  );

CREATE POLICY "listings delete"
  ON public.listings FOR DELETE TO authenticated
  USING (public.current_user_has_permission('listing.delete'));

-- Media tables. Anon SELECT is scoped to the same predicate as the public view;
-- reachable only via the views (no anon grant on the base tables).
CREATE POLICY "listing_images anon select via view predicate"
  ON public.listing_images FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.status IN ('active','coming_soon','reserved','sold','rented')
    )
  );

CREATE POLICY "listing_images auth select"
  ON public.listing_images FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
        OR l.status IN ('active','coming_soon','reserved','sold','rented')
      )
    )
  );

CREATE POLICY "listing_images write"
  ON public.listing_images FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
      )
    )
  );

CREATE POLICY "listing_documents anon select via view predicate"
  ON public.listing_documents FOR SELECT TO anon
  USING (
    is_public = true AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.status IN ('active','coming_soon','reserved','sold','rented')
    )
  );

CREATE POLICY "listing_documents auth select"
  ON public.listing_documents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
        OR (is_public = true AND l.status IN ('active','coming_soon','reserved','sold','rented'))
      )
    )
  );

CREATE POLICY "listing_documents write"
  ON public.listing_documents FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
      )
    )
  );

CREATE POLICY "listing_tours anon select via view predicate"
  ON public.listing_tours FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.status IN ('active','coming_soon','reserved','sold','rented')
    )
  );

CREATE POLICY "listing_tours auth select"
  ON public.listing_tours FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
        OR l.status IN ('active','coming_soon','reserved','sold','rented')
      )
    )
  );

CREATE POLICY "listing_tours write"
  ON public.listing_tours FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
      )
    )
  );

-- =========================================================================
-- 9. Public views (sole public read surface)
-- =========================================================================
CREATE VIEW public.listings_public
WITH (security_invoker = true) AS
SELECT
  id, slug, reference_code, status, deal_type, property_type,
  published_at, sold_at, archived_at,
  is_featured, is_exclusive, sort_order,
  price, price_on_request, price_period, commission_note, additional_costs,
  living_area, plot_area, usable_area, rooms, bedrooms, bathrooms,
  floor, total_floors, year_built, year_renovated,
  address_street, address_number, address_zip, address_city, address_region, address_country,
  geo_lat, geo_lng, geo_precision,
  energy, features, condition, heating_type, availability_date,
  title, description, highlights, meta_title, meta_description,
  agent_id, created_at, updated_at, view_count, inquiry_count
FROM public.listings
WHERE status IN ('active','coming_soon','reserved','sold','rented');

GRANT SELECT ON public.listings_public TO anon, authenticated;

CREATE VIEW public.listing_images_public
WITH (security_invoker = true) AS
SELECT i.*
FROM public.listing_images i
JOIN public.listings_public p ON p.id = i.listing_id;
GRANT SELECT ON public.listing_images_public TO anon, authenticated;

CREATE VIEW public.listing_documents_public
WITH (security_invoker = true) AS
SELECT d.*
FROM public.listing_documents d
JOIN public.listings_public p ON p.id = d.listing_id
WHERE d.is_public = true;
GRANT SELECT ON public.listing_documents_public TO anon, authenticated;

CREATE VIEW public.listing_tours_public
WITH (security_invoker = true) AS
SELECT t.*
FROM public.listing_tours t
JOIN public.listings_public p ON p.id = t.listing_id;
GRANT SELECT ON public.listing_tours_public TO anon, authenticated;
